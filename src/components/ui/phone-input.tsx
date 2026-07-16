"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTRY_CODES, parsePhoneValue } from "@/lib/phone-utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  error?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "",
  className,
  required,
  disabled,
  icon,
  error,
}: PhoneInputProps) {
  const parsed = parsePhoneValue(value);
  const [countryCode, setCountryCode] = useState(`+${parsed.countryCode}`);
  const [localNumber, setLocalNumber] = useState(parsed.localNumber.slice(0, 9));
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const next = parsePhoneValue(value);
    const normalized = `+${next.countryCode}${next.localNumber.slice(0, 9)}`;
    if (value && normalized !== value && next.matched) {
      onChangeRef.current(normalized);
      return;
    }
    setCountryCode(`+${next.countryCode}`);
    setLocalNumber(next.localNumber.slice(0, 9));
  }, [value]);

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    setCountryCode(code);
    onChangeRef.current(`${code}${localNumber}`);
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    setLocalNumber(digits);
    onChangeRef.current(`${countryCode}${digits}`);
  }

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-xl bg-muted-bg border px-3 py-3 text-sm focus-within:ring-2",
        error
          ? "border-red focus-within:ring-red"
          : "border-white/10 focus-within:ring-blue",
        icon ? "pl-11" : "pl-3",
        className
      )}
    >
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          {icon}
        </span>
      )}

      <div className="relative shrink-0">
        <select
          value={countryCode}
          onChange={handleCountryChange}
          disabled={disabled}
          required={required}
          className="appearance-none bg-transparent text-sm font-mono text-foreground pr-6 py-0 focus:outline-none cursor-pointer disabled:opacity-50"
        >
          {COUNTRY_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
      </div>

      <span className="text-white/10 select-none">|</span>

      <input
        type="tel"
        inputMode="numeric"
        value={localNumber}
        onChange={handleLocalChange}
        maxLength={9}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none disabled:opacity-50"
      />
    </div>
  );
}
