"use client";

import Link from "next/link";
import { User, Bell, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonWrapper } from "@/components/ui/skeleton";

function SettingsSkeleton() {
  return (
    <div className="pt-24 pb-16 animate-pulse">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <SkeletonAvatar className="h-16 w-16" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 h-full">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 border-red/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <SkeletonButton />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout, isLoading } = useAuth();

  const settingsSections = [
    {
      title: "Account",
      description: "Manage your account details and security",
      icon: User,
      href: "/settings/account",
    },
    {
      title: "Profile",
      description: "Update your profile information and preferences",
      icon: User,
      href: "/settings/profile",
    },
    {
      title: "Security",
      description: "Secure your account with email verification",
      icon: Shield,
      href: "/settings/security",
    },
    {
      title: "Notifications",
      description: "Manage your notification preferences",
      icon: Bell,
      href: "/settings/notifications",
    },
  ];

  return (
    <SkeletonWrapper isLoading={isLoading} skeleton={<SettingsSkeleton />}>
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted text-sm">Manage your account settings and preferences</p>
          </div>

          <div className="mb-8">
            <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue/10 flex items-center justify-center text-blue text-2xl font-bold overflow-hidden shrink-0">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user?.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || "U"
                )}
              </div>
              <div>
                <CardTitle className="text-xl">{user?.name || "User"}</CardTitle>
                <CardDescription>{user?.email || ""}</CardDescription>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {settingsSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="p-6 hover:border-blue transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue/10 flex items-center justify-center text-blue">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base mb-1">{section.title}</CardTitle>
                    <CardDescription className="text-sm">{section.description}</CardDescription>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="p-6 border-red/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-red/10 flex items-center justify-center text-red">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Sign Out</CardTitle>
                <CardDescription className="text-sm">Sign out of your account</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await logout();
              }}
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
    </SkeletonWrapper>
  );
}
