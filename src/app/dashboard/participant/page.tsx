"use client";

import { Suspense } from "react";
import ParticipantDashboardContent from "./participant-dashboard-content";

export default function ParticipantDashboard() {
  return (
    <Suspense fallback={<div className="pt-24 pb-16 min-h-screen flex items-center justify-center"><p className="text-muted">Loading dashboard...</p></div>}>
      <ParticipantDashboardContent />
    </Suspense>
  );
}
