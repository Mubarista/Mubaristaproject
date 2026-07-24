"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Mail, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

interface OtpDialogProps {
  email: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type OtpStatus = "input" | "verifying" | "success" | "error";

const CONFETTI_COLORS = ["#2563eb", "#16a34a", "#eab308", "#dc2626", "#3b82f6", "#22c55e"];

function ConfettiPiece({ index }: { index: number }) {
  const style = {
    left: `${8 + (index * 14) % 84}%`,
    animationDelay: `${(index * 0.08) % 0.5}s`,
    animationDuration: `${0.8 + (index % 3) * 0.3}s`,
    backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    width: index % 2 === 0 ? "8px" : "6px",
    height: index % 2 === 0 ? "8px" : "12px",
    borderRadius: index % 3 === 0 ? "50%" : "2px",
  };
  return (
    <span
      className="absolute top-0 pointer-events-none"
      style={{ ...style, animation: `otp-confetti-fall ${style.animationDuration} ease-out ${style.animationDelay} forwards` }}
    />
  );
}

export function OtpDialog({ email, open, onClose, onSuccess }: OtpDialogProps) {
  const { verifyOTP, sendOTP } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [status, setStatus] = useState<OtpStatus>("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [closing, setClosing] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentFlash, setResentFlash] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Countdown timer
  useEffect(() => {
    if (!open || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [open, countdown]);

  // Focus first input when opened
  useEffect(() => {
    if (open) {
      setDigits(Array(6).fill(""));
      setStatus("input");
      setErrorMsg("");
      setCountdown(60);
      setClosing(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 350);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 280);
  }, [onClose]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "verifying") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, status, handleClose]);

  const code = digits.join("");

  async function handleVerify() {
    if (code.length !== 6 || status === "verifying") return;
    setStatus("verifying");
    setErrorMsg("");
    try {
      const result = await verifyOTP(email, code);
      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          onSuccess();
        }, 1400);
      } else {
        setStatus("error");
        setErrorMsg(result.message || "Invalid code. Please try again.");
        setTimeout(() => {
          setStatus("input");
          setDigits(Array(6).fill(""));
          inputRefs.current[0]?.focus();
        }, 600);
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
      setTimeout(() => {
        setStatus("input");
        setDigits(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }, 600);
    }
  }

  // Auto-verify when all 6 digits entered
  useEffect(() => {
    if (code.length === 6 && status === "input") {
      const t = setTimeout(() => handleVerify(), 250);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, status]);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit && value !== "") return;
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      handleVerify();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    const result = await sendOTP(email);
    setResending(false);
    if (result.success) {
      setCountdown(60);
      setErrorMsg("");
      setResentFlash(true);
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      setTimeout(() => setResentFlash(false), 2500);
    } else {
      setErrorMsg(result.message || "Failed to resend code");
    }
  }

  if (!open) return null;

  const maskedEmail = email.length > 24 ? `${email.slice(0, 3)}•••${email.slice(email.indexOf("@"))}` : email;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Verify your email">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${closing ? "animate-otp-backdrop-out" : "animate-otp-backdrop-in"}`}
        onClick={status !== "verifying" ? handleClose : undefined}
      />

      {/* Dialog */}
      <div
        ref={containerRef}
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 shadow-2xl ${closing ? "animate-otp-dialog-out" : "animate-otp-dialog-in"}`}
        style={{ background: "var(--card)", backdropFilter: "blur(24px)" }}
      >
        {/* Ambient top glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: status === "success" ? "radial-gradient(circle, #22c55e 0%, transparent 70%)" : status === "error" ? "radial-gradient(circle, #ef4444 0%, transparent 70%)" : "radial-gradient(circle, #2563eb 0%, transparent 70%)", transition: "background 0.5s ease" }}
        />

        {/* Confetti on success */}
        {status === "success" && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 14 }).map((_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>
        )}

        {/* Close button */}
        {status !== "verifying" && status !== "success" && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl text-muted hover:bg-white/10 hover:text-foreground hover:rotate-90 transition-all duration-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="relative px-8 pt-10 pb-8">
          {/* Icon area */}
          <div className="flex justify-center mb-6">
            {status === "success" ? (
              <div className="relative animate-otp-icon-pop">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green/15 border-2 border-green/40">
                  <CheckCircle2 className="h-10 w-10 text-green" strokeWidth={2.5} />
                </div>
                <Sparkles className="absolute -top-1 -right-2 h-5 w-5 text-yellow animate-pulse" />
                <Sparkles className="absolute -bottom-1 -left-2 h-4 w-4 text-blue animate-pulse" style={{ animationDelay: "0.3s" }} />
              </div>
            ) : status === "error" ? (
              <div className="animate-otp-error">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red/15 border-2 border-red/40">
                  <AlertCircle className="h-10 w-10 text-red" strokeWidth={2.5} />
                </div>
              </div>
            ) : (
              <div className="relative otp-pulse-ring">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue/15 border-2 border-blue/40 transition-transform duration-300 hover:scale-105">
                  <ShieldCheck className="h-10 w-10 text-blue animate-float" strokeWidth={2} />
                </div>
              </div>
            )}
          </div>

          {/* Title & subtitle */}
          <div className="text-center mb-8">
            {status === "success" ? (
              <>
                <h2 className="text-2xl font-bold mb-1 animate-otp-success">You're verified!</h2>
                <p className="text-sm text-muted">Taking you to your dashboard…</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1">Check your inbox</h2>
                <p className="text-sm text-muted flex items-center justify-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-foreground" title={email}>{maskedEmail}</span>
                </p>
              </>
            )}
          </div>

          {status !== "success" && (
            <>
              {/* OTP input cells */}
              <div
                className={`flex justify-center gap-2.5 sm:gap-3 mb-6 ${status === "error" ? "animate-otp-error" : ""}`}
                onPaste={handlePaste}
              >
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={2}
                    value={digit}
                    disabled={status === "verifying"}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className={`otp-input-cell h-14 w-11 sm:w-12 rounded-xl border-2 text-center text-xl font-bold font-mono outline-none transition-all duration-200 disabled:opacity-50
                      ${digit
                        ? "border-blue/60 bg-blue/10 text-foreground scale-105"
                        : "border-white/15 bg-muted-bg text-foreground hover:border-white/30"
                      }
                      focus:border-blue focus:bg-blue/5 focus:scale-110 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]
                      ${status === "error" ? "border-red/60 bg-red/5" : ""}
                    `}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              {/* Progress dots showing filled count */}
              <div className="flex justify-center gap-1.5 mb-6">
                {digits.map((d, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${d ? "w-6 bg-blue" : "w-1.5 bg-white/20"}`}
                  />
                ))}
              </div>

              {/* Error message */}
              {errorMsg && status === "error" && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red/10 border border-red/30 px-4 py-3 text-sm text-red animate-otp-error">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Resent flash */}
              {resentFlash && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-green/10 border border-green/30 px-4 py-3 text-sm text-green animate-otp-dialog-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  New code sent! Check your inbox.
                </div>
              )}

              {/* Verify button */}
              <Button
                variant="primary"
                className="w-full h-12 text-base font-semibold relative overflow-hidden group"
                disabled={code.length !== 6 || status === "verifying"}
                onClick={handleVerify}
              >
                {status === "verifying" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Verifying your code…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Verify Code
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                )}
              </Button>

              {/* Resend row */}
              <div className="mt-5 text-center">
                <p className="text-sm text-muted">
                  Didn't receive the code?{" "}
                  {countdown > 0 ? (
                    <span className="inline-flex items-center gap-1 font-medium text-foreground/70">
                      <span className="inline-block w-7 text-center font-mono tabular-nums">{countdown}s</span>
                      <span className="inline-block h-1 w-14 rounded-full bg-white/10 overflow-hidden align-middle">
                        <span
                          className="block h-full bg-blue rounded-full transition-all duration-1000 ease-linear"
                          style={{ width: `${(countdown / 60) * 100}%` }}
                        />
                      </span>
                    </span>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="font-semibold text-blue hover:underline inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                      {resending ? "Sending…" : "Resend code"}
                    </button>
                  )}
                </p>
              </div>
            </>
          )}

          {/* Success loading bar */}
          {status === "success" && (
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-green rounded-full" style={{ animation: "progress 1.2s ease-out forwards" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}