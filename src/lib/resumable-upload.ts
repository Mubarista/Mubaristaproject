import { supabase } from "./supabase";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface ResumableUploadOptions {
  file: File;
  bucket: string;
  path: string;
  contentType: string;
  onProgress?: (progress: UploadProgress) => void;
  chunkSize?: number; // Default 5MB chunks
  maxRetries?: number;
}

export async function resumableUpload({
  file,
  bucket,
  path,
  contentType,
  onProgress,
  chunkSize = 5 * 1024 * 1024, // 5MB default chunk size
  maxRetries = 3,
}: ResumableUploadOptions): Promise<{ url: string; path: string }> {
  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadedChunks = 0;
  let retries = 0;

  // Get upload URL for each chunk
  const uploadUrls: string[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const chunkPath = `${path}.part${i}`;

    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      try {
        attempt++;
        console.log(`Uploading chunk ${i + 1}/${totalChunks} (attempt ${attempt}/${maxRetries})`);

        // Get upload URL for this chunk
        const { data: uploadData, error: uploadError } = await (supabase.storage
          .from(bucket) as any)
          .createUploadUrl(chunkPath);

        if (uploadError) {
          console.error(`Failed to get upload URL for chunk ${i}:`, uploadError);
          throw uploadError;
        }

        // Upload the chunk
        const formData = new FormData();
        formData.append('file', chunk);

        const response = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: formData,
          headers: {
            'Content-Type': contentType,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to upload chunk ${i}:`, errorText);
          throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
        }

        success = true;
        uploadUrls.push(uploadData.url);
        uploadedChunks++;

        if (onProgress) {
          const progress = {
            loaded: uploadedChunks * chunkSize,
            total: file.size,
            percentage: Math.round((uploadedChunks / totalChunks) * 100),
          };
          onProgress(progress);
        }

        console.log(`Successfully uploaded chunk ${i + 1}/${totalChunks}`);
      } catch (error) {
        console.error(`Error uploading chunk ${i} (attempt ${attempt}):`, error);
        if (attempt >= maxRetries) {
          throw new Error(`Failed to upload chunk ${i} after ${maxRetries} attempts`);
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // Combine chunks server-side (this would need a server-side function)
  // For now, we'll return the last chunk URL as a fallback
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return { url: publicUrl, path };
}

// Alternative: Use Supabase's built-in upload with retry logic
export async function uploadWithRetry(
  file: File,
  bucket: string,
  path: string,
  contentType: string,
  onProgress?: (progress: UploadProgress) => void,
  maxRetries = 3
): Promise<{ url: string; path: string }> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      console.log(`Upload attempt ${retries + 1}/${maxRetries}`);

      // Upload with progress tracking using XHR
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.url) {
                resolve({ url: response.url, path: response.fileName || path });
              } else {
                reject(new Error('Invalid response: missing URL'));
              }
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        // Use the existing API upload endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'video');

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

    } catch (error) {
      console.error(`Upload attempt ${retries + 1} failed:`, error);
      lastError = error as Error;
      retries++;
      
      if (retries < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Upload failed after maximum retries');
}