"use client";

import Link from "next/link";
import {
  Users,
  Trophy,
  CreditCard,
  FileCheck,
  Gavel,
  BookOpen,
  Wrench,
  Briefcase,
  BarChart3,
  Settings,
  Bell,
  Globe,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const adminModules = [
  { icon: Users, label: "User Management", count: "48.5K", color: "text-blue" },
  { icon: Trophy, label: "Competitions", count: 12, color: "text-yellow" },
  { icon: FileCheck, label: "Applications", count: "47 pending", color: "text-green" },
  { icon: CreditCard, label: "Payments", count: "$12,450", color: "text-green" },
  { icon: Gavel, label: "Judges", count: "24", color: "text-blue" },
  { icon: BookOpen, label: "Books", count: "156", color: "text-yellow" },
  { icon: Wrench, label: "Tools", count: "89", color: "text-red" },
  { icon: Briefcase, label: "Jobs", count: "34", color: "text-green" },
  { icon: BarChart3, label: "Analytics", count: "Live", color: "text-blue" },
  { icon: Bell, label: "Notifications", count: "12", color: "text-red" },
  { icon: Globe, label: "Countries", count: 127, color: "text-green" },
  { icon: Settings, label: "Settings", count: "CMS", color: "text-muted" },
];

export default function AdminDashboard() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Badge variant="red" className="mb-2">Admin Panel</Badge>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted">Manage the MUBARISTA platform</p>
          </div>
          <div className="flex gap-3">
            <Link href="/muba2-admin">
              <Button variant="primary" size="sm">
                <Settings className="h-4 w-4" /> Open CMS Portal
              </Button>
            </Link>
            <Button variant="secondary" size="sm">
              <Bell className="h-4 w-4" /> Send Announcement
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {adminModules.map((mod) => (
            <Card key={mod.label} className="cursor-pointer group">
              <mod.icon className={`h-6 w-6 mb-3 ${mod.color} group-hover:scale-110 transition-transform`} />
              <CardTitle className="text-sm mb-1">{mod.label}</CardTitle>
              <p className="text-lg font-bold">{mod.count}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardTitle className="mb-4">Recent Applications</CardTitle>
            <div className="space-y-3">
              {[
                { name: "Alex Barista", status: "pending", competition: "Global 2026" },
                { name: "Chen Wei", status: "approved", competition: "Rising Stars" },
                { name: "Luca Rossi", status: "declined", competition: "Master Invitational" },
              ].map((app) => (
                <div key={app.name} className="flex items-center justify-between p-3 rounded-xl bg-muted-bg/50">
                  <div>
                    <p className="font-medium text-sm">{app.name}</p>
                    <p className="text-xs text-muted">{app.competition}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={app.status === "approved" ? "green" : app.status === "declined" ? "red" : "yellow"}>
                      {app.status}
                    </Badge>
                    {app.status === "pending" && (
                      <>
                        <Button variant="green" size="sm">Approve</Button>
                        <Button variant="red" size="sm">Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">Platform Analytics</CardTitle>
            <div className="space-y-4">
              {[
                { label: "Monthly Active Users", value: "12,450", pct: 85 },
                { label: "Competition Revenue", value: "$48,200", pct: 72 },
                { label: "Premium Members", value: "3,890", pct: 60 },
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{metric.label}</span>
                    <span className="font-bold">{metric.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted-bg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue to-green"
                      style={{ width: `${metric.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Link href="/dashboard/participant">
            <Button variant="ghost" size="sm">← Participant Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
