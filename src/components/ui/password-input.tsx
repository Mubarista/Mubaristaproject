"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Optional icon rendered inside the field on the left (pass a sized icon, e.g. <Lock className="h-4 w-4" />). */
  leftIcon?: React.ReactNode;
}

/**
 * Password field with a built-in reveal/hide toggle.
 * Matches the app's input styling and works for both user and admin forms.
 */
export function PasswordInput({ leftIcon, className, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none flex items-center">
          {leftIcon}
        </span>
      )}
      <input
        {...props}
        type={show ? "text" : "password"}
        className={cn(
          "w-full rounded-xl bg-muted-bg border border-white/10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50 transition-opacity",
          leftIcon ? "pl-11" : "pl-4",
          "pr-11",
          className
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted hover:text-foreground hover:bg-white/5 transition-colors focus:outline-none"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}