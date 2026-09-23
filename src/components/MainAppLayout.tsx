

"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Sidebar, TopBar } from "@/components/Navigation";
import { DashboardView } from "@/components/DashboardView";
import { TimelineView } from "@/components/TimelineView";
import { CalendarView } from "@/components/CalendarView";
import { PerformanceTrackerView } from "@/components/PerformanceTrackerView";
import { ReportsView } from "@/components/ReportsView";
import { SettingsView } from "@/components/SettingsView";
import { ProfileView } from "@/components/ProfileView";
import { LogActivityPage } from "@/components/ActivityLogForm";
import { AdminHubView } from "@/components/AdminHubView";
import { LoginView } from "@/components/auth/LoginView";
import { Toaster, ConfirmDialog } from "@/components/Feedback";
import { Eye, ArrowLeft, Shield, Megaphone, Radio, BellRing, Check, ChevronRight } from "lucide-react";

export function MainAppLayout() {
  const {
    activeTab,
    currentUser,
    isAuthenticated,
    authLoading,
    isImpersonating,
    originalAdmin,
    stopImpersonating,
    notifications,
    markNotificationAsRead,
  } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBroadcastIndex, setActiveBroadcastIndex] = useState(0);

  // Filter unread broadcast notifications
  const unreadBroadcasts = notifications.filter(
    (n) =>
      n.isRead === 0 &&
      (n.title.startsWith("[Broadcast]") ||
        n.type === "system" ||
        n.type === "reminder" ||
        n.type === "achievement")
  );

  const currentBroadcast = unreadBroadcasts[activeBroadcastIndex] || unreadBroadcasts[0];

  // Initial Auth Loading Screen
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg animate-pulse">
            W
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="h-3 w-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span>Loading WorkPulse Workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, display the Login Interface ("Login Face")
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginView />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Impersonation & Workspace Inspection Banner */}
        {isImpersonating && originalAdmin && currentUser && (
          <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-rose-500/30 bg-gradient-to-r from-zinc-900 via-rose-950 to-indigo-950 px-4 py-2 text-xs text-white shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white font-bold animate-pulse shrink-0">
                <Eye className="h-3 w-3" />
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-rose-300">Admin Inspection Mode:</span>
                <span>Viewing workspace as</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-white">
                  {currentUser.name} ({currentUser.email})
                </span>
                <span className="text-zinc-400">· Role: {currentUser.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={stopImpersonating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white shadow-md hover:bg-rose-500 transition active:scale-95 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Admin ({originalAdmin.name.split(" ")[0]})</span>
              </button>
            </div>
          </div>
        )}

        <TopBar onMenu={() => setMenuOpen(true)} />

        {/* Live Broadcast Notice Alert Banner */}
        {unreadBroadcasts.length > 0 && currentBroadcast && (
          <div className="relative border-b border-rose-500/30 bg-gradient-to-r from-zinc-900 via-rose-950/60 to-zinc-900 px-4 py-3 text-xs shadow-md animate-fadeIn">
            <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white shadow-md ring-2 ring-rose-500/20">
                  <Megaphone className="h-4 w-4 animate-bounce" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300 border border-rose-500/30">
                      <Radio className="h-2.5 w-2.5 animate-pulse text-rose-400" />
                      BROADCAST ANNOUNCEMENT
                    </span>
                    {unreadBroadcasts.length > 1 && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ({activeBroadcastIndex + 1} of {unreadBroadcasts.length})
                      </span>
                    )}
                    <span className="font-semibold text-white truncate text-[13px]">
                      {currentBroadcast.title.replace(/^\[Broadcast\]\s*/i, "")}
                    </span>
                  </div>
                  <p className="mt-1 text-zinc-300 text-xs leading-relaxed max-w-3xl">
                    {currentBroadcast.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {unreadBroadcasts.length > 1 && (
                  <button
                    onClick={() =>
                      setActiveBroadcastIndex((prev) => (prev + 1) % unreadBroadcasts.length)
                    }
                    className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition"
                  >
                    Next Notice ({((activeBroadcastIndex + 1) % unreadBroadcasts.length) + 1}/{unreadBroadcasts.length})
                  </button>
                )}

                <button
                  onClick={() => {
                    markNotificationAsRead(currentBroadcast.id);
                    if (activeBroadcastIndex >= unreadBroadcasts.length - 1) {
                      setActiveBroadcastIndex(0);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-rose-500 hover:to-indigo-500 transition shadow-sm active:scale-95"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Acknowledge Notice</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={activeTab} className="fade-in">
            {activeTab === "admin-hub" && <AdminHubView />}
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "daily-update" && <LogActivityPage />}
            {activeTab === "timeline" && <TimelineView />}
            {activeTab === "calendar" && <CalendarView />}
            {activeTab === "performance" && <PerformanceTrackerView />}
            {activeTab === "reports" && <ReportsView />}
            {activeTab === "profile" && <ProfileView />}
            {activeTab === "settings" && <SettingsView />}
          </div>
        </main>

        <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm py-4 px-4 sm:px-8">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">WorkPulse</span>
              <span>·</span>
              <span>Enterprise Performance Suite v2.5</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Powered by</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Rashed Islam
              </span>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
      <ConfirmDialog />
    </div>
  );
}
