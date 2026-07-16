"use client";

import { motion } from "framer-motion";
import { CheckCircle, Mail, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplicationConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ApplicationConfirmDialog({
  open,
  onConfirm,
  onCancel,
  isLoading = false,
}: ApplicationConfirmDialogProps) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-2xl p-6 max-w-md w-full border border-white/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-blue/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-blue" />
          </div>
          <div>
            <h3 className="font-semibold">Confirm Application</h3>
            <p className="text-sm text-muted">Review before submitting</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue/5 border border-blue/10">
            <Mail className="h-4 w-4 text-blue shrink-0 mt-0.5" />
            <p className="text-sm text-muted">
              A confirmation email will be sent to your email address upon successful submission.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow/5 border border-yellow/10">
            <Clock className="h-4 w-4 text-yellow shrink-0 mt-0.5" />
            <p className="text-sm text-muted">
              Your application will be in <span className="text-yellow font-medium">pending</span> status. You will be notified via email about nomination or rejection.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-green/5 border border-green/10">
            <CheckCircle className="h-4 w-4 text-green shrink-0 mt-0.5" />
            <p className="text-sm text-muted">
              After confirmation, your application will be sent to the Mubarista team for review.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Confirm & Submit"
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
