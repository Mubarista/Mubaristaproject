"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/payment/payment-dialog";
import { useAuth } from "@/lib/auth-context";

interface Props {
  amount: number;
  competitionTitle: string;
}

export function CompetitionPayButton({ amount, competitionTitle }: Props) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const country = user?.country ?? "";

  return (
    <>
      <Button
        variant="primary"
        className="w-full"
        size="lg"
        onClick={() => setOpen(true)}
        disabled={amount === 0}
      >
        <CreditCard className="h-5 w-5" />
        {amount === 0 ? "Free Entry" : `Pay Entry Fee`}
      </Button>

      <PaymentDialog
        open={open}
        onClose={() => setOpen(false)}
        amount={amount}
        description={`Entry fee — ${competitionTitle}`}
        userCountry={country}
        paymentType="competition_entry"
        onSuccess={(method, ref) => {
          console.info(`Payment success: ${method} / ${ref}`);
        }}
      />
    </>
  );
}
