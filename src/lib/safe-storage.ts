// Safe storage wrapper that handles cases where localStorage/sessionStorage
// is not available (e.g. sandboxed iframes, privacy modes, third-party contexts).

function getStorage(getStorage: () => Storage) {
  return {
    getItem(key: string): string | null {
      try {
        return getStorage().getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): boolean {
      try {
        getStorage().setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    removeItem(key: string): boolean {
      try {
        getStorage().removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
}

function getLocalStorage(): Storage {
  if (typeof window === "undefined") return {} as Storage;
  // Accessing window.localStorage may throw in sandboxed/third-party contexts
  try {
    return window.localStorage;
  } catch {
    return {} as Storage;
  }
}

function getSessionStorage(): Storage {
  if (typeof window === "undefined") return {} as Storage;
  try {
    return window.sessionStorage;
  } catch {
    return {} as Storage;
  }
}

export const safeLocalStorage = getStorage(getLocalStorage);
export const safeSessionStorage = getStorage(getSessionStorage);
