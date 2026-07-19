"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload, ImageIcon, Trash2, Search, FileText, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/lib/admin-data-context";
import { supabase } from "@/lib/supabase";

interface AdminModalProps {
  title: string;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  children: React.ReactNode;
}

export function AdminModal({ title, onClose, onSave, children }: AdminModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">{children}</div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving} loadingText="Saving...">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm text-muted mb-1">
        {label} {required && <span className="text-red">*</span>}
      </label>
      {children}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue ${props.className ?? ""}`}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export function Textarea(props: TextareaProps) {
  return (
    <textarea
      rows={3}
      {...props}
      className={`w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue resize-none ${props.className ?? ""}`}
    />
  );
}

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}
export function Select({ options, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue ${props.className ?? ""}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
}

export function CountrySelect({ value, onChange }: CountrySelectProps) {
  const { supportedCountries } = useAdminData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = supportedCountries.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const selected = supportedCountries.find((c) => c.name === value);

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 rounded-xl bg-muted-bg border border-white/10 px-4 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue hover:border-blue/40 transition-all"
      >
        {selected ? (
          <>
            <span className="text-lg leading-none">{selected.flag}</span>
            <span className="flex-1">{selected.name}</span>
            <span className="font-mono text-xs text-muted">{selected.dialCode}</span>
          </>
        ) : (
          <span className="text-muted flex-1">Select a country…</span>
        )}
        <span className="text-muted text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl bg-background border border-white/10 shadow-xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
            <Search className="h-3.5 w-3.5 text-muted shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country…"
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted px-4 py-3">No countries found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.name); setOpen(false); setQuery(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                    c.name === value ? "bg-blue/15 text-blue" : "hover:bg-white/5"
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="font-mono text-xs text-muted">{c.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  type?: "photo" | "pdf";
}

export function FileUpload({ value, onChange, label = "File", accept = ".pdf", type = "pdf" }: FileUploadProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _label = label;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      } else {
        console.error("Upload failed:", await res.text());
        alert(`Failed to upload ${type === "pdf" ? "PDF" : "file"}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Failed to upload ${type === "pdf" ? "PDF" : "file"}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Preview area */}
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-muted-bg p-4 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName || "PDF uploaded"}</p>
            <p className="text-xs text-muted truncate">{value}</p>
          </div>
          <button
            type="button"
            onClick={() => { onChange(""); setFileName(""); if (inputRef.current) inputRef.current.value = ""; }}
            className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-red/80 transition-colors shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-muted-bg hover:border-blue/50 hover:bg-blue/5 transition-all cursor-pointer h-32 ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {uploading ? (
            <>
              <div className="animate-spin h-8 w-8 border-2 border-blue border-t-transparent rounded-full" />
              <p className="text-xs text-muted">Uploading...</p>
            </>
          ) : (
            <>
              <FileText className="h-8 w-8 text-muted" />
              <p className="text-xs text-muted">Click to upload PDF</p>
              <p className="text-xs text-muted/60">PDF only, max 50MB</p>
            </>
          )}
        </div>
      )}

      {/* Actions row */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted-bg border border-white/10 text-xs hover:bg-blue/10 hover:border-blue/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : value ? "Change PDF" : "Upload PDF"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
      </div>
    </div>
  );
}

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: "square" | "banner" | "portrait";
}

export function ImageUpload({ value, onChange, label = "Image", aspectRatio = "banner" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadPreview() {
      if (!value) {
        setPreviewUrl(null);
        return;
      }
      try {
        const res = await fetch(value, { mode: "cors", cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setPreviewUrl(objectUrl);
      } catch (error) {
        console.error("ImageUpload preview fetch error:", error);
        setPreviewUrl(null);
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [value]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "photo");
      formData.append("maxWidth", "1920");
      formData.append("maxHeight", "1080");
      formData.append("quality", "85");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      } else {
        console.error("Upload failed:", await res.text());
        alert("Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  const heightClass = aspectRatio === "square" ? "h-40 w-40" : aspectRatio === "portrait" ? "h-52 w-40" : "h-40 w-full";

  return (
    <div className="space-y-2">
      {/* Preview area */}
      {value ? (
        <div className={`relative rounded-xl overflow-hidden border border-white/10 bg-muted-bg ${heightClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl || value}
            alt={label}
            className="w-full h-full object-cover"
            onError={() => {
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
            }}
          />
          <button
            type="button"
            onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red/80 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-muted-bg hover:border-blue/50 hover:bg-blue/5 transition-all cursor-pointer ${heightClass} ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {uploading ? (
            <>
              <div className="animate-spin h-8 w-8 border-2 border-blue border-t-transparent rounded-full" />
              <p className="text-xs text-muted">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted" />
              <p className="text-xs text-muted">Click to upload image</p>
              <p className="text-xs text-muted/60">PNG, JPG, WEBP</p>
            </>
          )}
        </div>
      )}

      {/* Actions row */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted-bg border border-white/10 text-xs hover:bg-blue/10 hover:border-blue/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : value ? "Change image" : "Upload image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
      </div>
    </div>
  );
}

interface VideoUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function VideoUpload({ value, onChange, label = "Video" }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Get a presigned URL from the server, then upload directly to Supabase Storage.
      // This bypasses the Vercel function payload size limit for large videos.
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop() || "mp4"}`;
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileName, contentType: file.type }),
      });

      if (!presignedRes.ok) {
        const text = await presignedRes.text();
        console.error("Presigned URL failed:", text);
        alert("Failed to get upload URL");
        return;
      }

      const { path, token, publicUrl } = await presignedRes.json();

      const { error: uploadError } = await supabase.storage.from("Videos").uploadToSignedUrl(path, token, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        alert("Failed to upload video");
        return;
      }

      onChange(publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload video");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
          <video
            key={value}
            src={value}
            controls
            className="w-full h-full object-contain"
            controlsList="nodownload"
          />
          <button
            type="button"
            onClick={() => { onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red/80 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-muted-bg hover:border-blue/50 hover:bg-blue/5 transition-all cursor-pointer h-40 w-full"
        >
          {uploading ? (
            <>
              <div className="animate-spin h-8 w-8 border-2 border-blue border-t-transparent rounded-full" />
              <p className="text-xs text-muted">Uploading...</p>
            </>
          ) : (
            <>
              <VideoIcon className="h-8 w-8 text-muted" />
              <p className="text-xs text-muted">Click to upload {label}</p>
              <p className="text-xs text-muted/60">MP4, WEBM, MOV (max 200MB)</p>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted-bg border border-white/10 text-xs hover:bg-blue/10 hover:border-blue/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : value ? "Change video" : `Upload ${label}`}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
      </div>
    </div>
  );
}
