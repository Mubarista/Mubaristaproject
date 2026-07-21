"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  deadline: string;
  closedText?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getTimeLeft(deadline: string): TimeLeft {
  const target = new Date(deadline).getTime();
  const now = Date.now();
  const diff = target - now;
  if (Number.isNaN(target) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: false };
}

export function Countdown({ deadline, closedText = "Registration Closed" }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft.expired) {
    return <span className="text-red text-xs font-medium">{closedText}</span>;
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      <span className="bg-red/10 text-red px-1.5 py-0.5 rounded">{timeLeft.days}d</span>
      <span className="bg-blue/10 text-blue px-1.5 py-0.5 rounded">{timeLeft.hours}h</span>
      <span className="bg-yellow/10 text-yellow px-1.5 py-0.5 rounded">{timeLeft.minutes}m</span>
      <span className="bg-green/10 text-green px-1.5 py-0.5 rounded">{timeLeft.seconds}s</span>
    </div>
  );
}
