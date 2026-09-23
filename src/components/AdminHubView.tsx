"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import {
  Shield,
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  Radio,
  Send,
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  ArrowUpRight,
  Filter,
  Search,
  Coffee,
  X,
  RefreshCw,
  KeyRound,
  Activity,
  Copy,
  Check,
  Lock,
  Calendar,
  MapPin,
  Laptop,
  CheckSquare,
  Bell,
  Megaphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AdminHubView() {
  const { currentUser, switchUser, setActiveTab, toast, confirm, notifyDataChanged } = useApp();
  const [employeesData, setEmployeesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  // Broadcast Modal
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastDept, setBroadcastDept] = useState("All");
  const [broadcastType, setBroadcastType] = useState("system");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState("employee");
  const [editDept, setEditDept] = useState("");
  const [editDesig, setEditDesig] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Password Control Modal
  const [passwordUser, setPasswordUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassField, setShowPassField] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Live Shift & Activity Details Modal
  const [selectedStaffActivity, setSelectedStaffActivity] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, bcastRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/admin/broadcast"),
      ]);

      if (empRes.ok) {
        const empJson = await empRes.json();
        setEmployeesData(empJson.employees || []);
      }

      if (bcastRes.ok) {
        const bcastJson = await bcastRes.json();
        setRecentBroadcasts(bcastJson.broadcasts || []);
      }
    } catch (e: any) {
      toast({ title: "Failed to load telemetry", description: e.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered employees
  const filtered = employeesData.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase()) ||
      (emp.employee?.employeeCode && emp.employee.employeeCode.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = deptFilter === "All" || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // KPI Calculations
  const totalStaff = employeesData.length;
  const activeNow = employeesData.filter((e) => e.stats?.attendanceStatus === "working").length;
  const onBreakCount = employeesData.filter((e) => e.stats?.attendanceStatus === "on_break").length;
  const loggedTodayCount = employeesData.filter((e) => e.stats?.todayLogged || (e.stats?.todayTasksCount > 0)).length;
  const totalTickets = employeesData.reduce((acc, curr) => acc + (curr.stats?.tickets || 0), 0);
  const totalKyc = employeesData.reduce((acc, curr) => acc + (curr.stats?.kyc || 0), 0);
  const totalChats = employeesData.reduce((acc, curr) => acc + (curr.stats?.chats || 0), 0);

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toast({ title: "Validation Error", description: "Title and message are required.", variant: "error" });
      return;
    }

    setBroadcastSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          department: broadcastDept,
          type: broadcastType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Broadcast failed");

      toast({
        title: "Announcement Broadcasted!",
        description: data.message || `Broadcast sent to ${data.deliveredCount} member(s).`,
        variant: "success",
      });

      setShowBroadcast(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
      notifyDataChanged();
      loadData();
    } catch (err: any) {
      toast({ title: "Broadcast Failed", description: err.message, variant: "error" });
    } finally {
      setBroadcastSending(false);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editPassword && editPassword.trim().length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "error" });
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          role: editRole,
          department: editDept,
          designation: editDesig,
          password: editPassword ? editPassword.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      toast({
        title: "Staff Updated",
        description: `${editingUser.name}'s profile and role have been updated.`,
        variant: "success",
      });

      setEditingUser(null);
      setEditPassword("");
      loadData();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;

    if (!newPassword || newPassword.trim().length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "error" });
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: passwordUser.id,
          password: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password update failed");

      toast({
        title: "Password Updated",
        description: `New password has been set for ${passwordUser.name} (${passwordUser.email}).`,
        variant: "success",
      });

      setPasswordUser(null);
      setNewPassword("");
      loadData();
    } catch (err: any) {
      toast({ title: "Password Update Failed", description: err.message, variant: "error" });
    } finally {
      setPassLoading(false);
    }
  };

  const handleDeleteUser = async (emp: any) => {
    if (emp.id === currentUser?.id) {
      toast({ title: "Action Denied", description: "You cannot delete your own active administrator account.", variant: "error" });
      return;
    }

    const confirmed = await confirm({
      title: `Delete Employee: ${emp.name}`,
      description: `Are you sure you want to permanently delete ${emp.name} (${emp.email})? This action cannot be undone. All of their attendance check-ins, logged activities, and credentials will be removed.`,
      confirmText: "Yes, Delete Account",
      destructive: true,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${emp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      toast({
        title: "Staff Member Removed",
        description: data.message || `${emp.name} has been deleted.`,
        variant: "success",
      });

      loadData();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "error" });
    }
  };

  const handleInspect = async (empId: number) => {
    await switchUser(empId);
    setActiveTab("dashboard");
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    toast({ title: "Password Copied", description: "Password copied to clipboard.", variant: "default" });
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const departments = Array.from(new Set(employeesData.map((e) => e.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-950/40 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30">
                <Shield className="h-3.5 w-3.5" />
                ADMIN COMMAND SECTOR
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Telemetry Active
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Enterprise Operations & Staff Command
            </h1>
            <p className="mt-1 text-sm text-zinc-300 max-w-2xl">
              Real-time employee check-in & check-out tracking, live daily progress monitoring, credential administration, and role governance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-1.5 border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Telemetry
            </Button>

            <Button
              onClick={() => setShowBroadcast(true)}
              className="gap-1.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-lg shadow-rose-600/20"
            >
              <Radio className="h-3.5 w-3.5" />
              Broadcast Notice
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Staff</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
            {totalStaff}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">{departments.length} departments</p>
        </Card>

        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Working</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {activeNow}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Checked in on shift</p>
        </Card>

        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">On Break</span>
            <Coffee className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {onBreakCount}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Rest / Pause cycle</p>
        </Card>

        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Daily Updates</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
            {loggedTodayCount} <span className="text-sm font-normal text-zinc-400">/ {totalStaff}</span>
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Logged work today</p>
        </Card>

        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Tickets</span>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
            {totalTickets}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Processed across team</p>
        </Card>

        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">KYC Verifications</span>
            <Shield className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
            {totalKyc}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Tier 1 & 2 verifications</p>
        </Card>
      </div>

      {/* Staff Telemetry & Control Roster */}
      <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span>Workforce Telemetry & Governance Roster</span>
              <Badge variant="outline" className="text-xs font-mono font-normal">
                {filtered.length} Staff Members
              </Badge>
            </CardTitle>
            <CardDescription>
              Monitor live shift attendance (check-in / check-out times), inspect employee activity progress, and manage passwords and account roles.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search staff, dept, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-y border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <th className="px-5 py-3">Employee & Credentials</th>
                <th className="px-3 py-3">Department & Role</th>
                <th className="px-3 py-3">Attendance & Shift Timing</th>
                <th className="px-3 py-3">Today Activity Progress</th>
                <th className="px-3 py-3 text-center">Score</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-zinc-500">
                    No employees found matching the filter.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const isCurrent = currentUser?.id === emp.id;
                  const isAdm = emp.role === "admin" || emp.role === "manager";
                  const attStatus = emp.stats?.attendanceStatus;

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors ${
                        isCurrent ? "bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      {/* Name & Credentials Column */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar || emp.employee?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                            alt={emp.name}
                            className="h-8 w-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{emp.name}</p>
                              {isCurrent && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1">
                                  You
                                </Badge>
                              )}
                              {isAdm && (
                                <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[9px] font-bold text-rose-500 border border-rose-500/20">
                                  {emp.role.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{emp.email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-zinc-400">
                                ID: {emp.employee?.employeeCode || `EMP-${1000 + emp.id}`}
                              </span>
                              <span className="text-zinc-300 dark:text-zinc-600">·</span>
                              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5" />
                                {emp.password ? "Protected" : "Default"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role Column */}
                      <td className="px-3 py-3.5">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{emp.department}</p>
                        <p className="text-xs text-zinc-500 truncate">
                          {emp.employee?.designation || (isAdm ? "System Administrator" : "Support Specialist")}
                        </p>
                      </td>

                      {/* Attendance & Shift Timing Column */}
                      <td className="px-3 py-3.5">
                        <div className="space-y-1">
                          {attStatus === "working" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              On Duty
                            </span>
                          ) : attStatus === "on_break" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              On Break {emp.stats?.breakMinutes > 0 ? `(${emp.stats.breakMinutes}m)` : ""}
                            </span>
                          ) : attStatus === "checked_out" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-500 border border-zinc-400/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                              Shift Ended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                              ○ Not Checked In
                            </span>
                          )}

                          {/* Check In / Check Out details */}
                          {emp.stats?.checkInTime && (
                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono space-y-0.5">
                              <div>
                                In: <strong className="text-zinc-800 dark:text-zinc-200">{emp.stats.checkInTime}</strong>
                                {emp.stats?.checkOutTime && (
                                  <span> · Out: <strong className="text-zinc-800 dark:text-zinc-200">{emp.stats.checkOutTime}</strong></span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                {emp.stats.shiftDuration !== "—" ? emp.stats.shiftDuration : "Shift started"}
                                {emp.stats.breakMinutes > 0 ? ` · ${emp.stats.breakMinutes}m breaks` : ""}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Today Activity Progress Column */}
                      <td className="px-3 py-3.5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              {emp.stats?.todayTasksCount ?? 0} tasks today
                            </span>
                            {emp.stats?.todayLogged && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Logged
                              </span>
                            )}
                          </div>

                          {/* Breakdown pills */}
                          <div className="flex flex-wrap items-center gap-1">
                            {emp.stats?.todayTickets > 0 && (
                              <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-indigo-500">
                                {emp.stats.todayTickets} tix
                              </span>
                            )}
                            {emp.stats?.todayKyc > 0 && (
                              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-emerald-500">
                                {emp.stats.todayKyc} kyc
                              </span>
                            )}
                            {emp.stats?.todayChats > 0 && (
                              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-cyan-500">
                                {emp.stats.todayChats} chats
                              </span>
                            )}
                            {emp.stats?.todayCalls > 0 && (
                              <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-purple-500">
                                {emp.stats.todayCalls} calls
                              </span>
                            )}
                            {emp.stats?.todayEmails > 0 && (
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-amber-500">
                                {emp.stats.todayEmails} emails
                              </span>
                            )}
                            {emp.stats?.todayTraining > 0 && (
                              <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-rose-500">
                                {emp.stats.todayTraining}h train
                              </span>
                            )}
                            {!emp.stats?.todayTickets && !emp.stats?.todayKyc && !emp.stats?.todayChats && !emp.stats?.todayCalls && (
                              <span className="text-[11px] text-zinc-400">No shift activity yet</span>
                            )}
                          </div>

                          {/* Latest Activity snippet */}
                          {emp.stats?.latestActivity && (
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]" title={emp.stats.latestActivity}>
                              Latest: {emp.stats.latestActivity}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Performance Score Column */}
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            (emp.stats?.performanceScore || 75) >= 90
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          {emp.stats?.performanceScore || 85}%
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Inspect Workspace */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInspect(emp.id)}
                            className="h-7 px-2 text-xs gap-1 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                            title="Inspect workspace from this employee perspective (Return to Admin anytime)"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Inspect</span>
                          </Button>

                          {/* View Activity & Shift Log */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStaffActivity(emp)}
                            className="h-7 px-2 text-xs gap-1 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            title="View detailed shift & activity logs"
                          >
                            <Activity className="h-3 w-3" />
                            <span>Activity</span>
                          </Button>

                          {/* Password & Credentials Management */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPasswordUser(emp);
                              setNewPassword("");
                              setShowPassField(false);
                            }}
                            className="h-7 px-2 text-xs gap-1 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                            title="Manage & Reset Password"
                          >
                            <KeyRound className="h-3 w-3" />
                            <span>Pass</span>
                          </Button>

                          {/* Edit Role & Details */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingUser(emp);
                              setEditRole(emp.role);
                              setEditDept(emp.department);
                              setEditDesig(emp.employee?.designation || "");
                              setEditPassword("");
                            }}
                            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            title="Edit Role & Details"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>

                          {/* Delete User */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isCurrent || (isAdm && employeesData.filter((e) => e.role === "admin").length <= 1)}
                            onClick={() => handleDeleteUser(emp)}
                            className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-20"
                            title={isCurrent ? "Cannot delete your own account" : "Permanently remove employee"}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Broadcast Announcements History Card */}
      {recentBroadcasts.length > 0 && (
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-rose-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Active System Broadcasts</h3>
              <Badge variant="outline" className="text-[10px] font-mono">
                {recentBroadcasts.length} Sent
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBroadcast(true)}
              className="text-xs h-7 gap-1 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
            >
              <Plus className="h-3 w-3" />
              <span>New Announcement</span>
            </Button>
          </div>

          <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
            {recentBroadcasts.slice(0, 5).map((b) => (
              <div key={b.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{b.title}</span>
                    <span className="rounded bg-rose-500/10 px-1.5 py-0.2 text-[9px] font-mono text-rose-500 capitalize">
                      {b.type || "system"}
                    </span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">{b.message}</p>
                </div>
                <div className="text-right shrink-0 text-[11px] text-zinc-400 font-mono">
                  <span>{b.deliveredCount ? `Sent to ${b.deliveredCount} user(s)` : "Broadcast active"}</span>
                  <span className="ml-2">· {new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Broadcast Announcement Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Broadcast System Announcement</h3>
                  <p className="text-xs text-zinc-400">Push live notification to team members</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcast(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Mandatory System Maintenance / Q3 Target Review"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Announcement Details *</label>
                <textarea
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter the full announcement content visible to all selected staff..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Target Department</label>
                  <select
                    value={broadcastDept}
                    onChange={(e) => setBroadcastDept(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rose-500"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Priority Type</label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rose-500"
                  >
                    <option value="system">System Notice</option>
                    <option value="achievement">Achievement & Milestone</option>
                    <option value="reminder">Urgent Action Required</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcast(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {broadcastSending ? "Broadcasting..." : "Send Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Password Control Modal */}
      {passwordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Employee Password Control</h3>
                  <p className="text-xs text-zinc-400">Inspect & reset credentials for {passwordUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordUser(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Employee Quick Info */}
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{passwordUser.name}</p>
                  <p className="text-zinc-400">{passwordUser.email}</p>
                </div>
                <div className="text-right font-mono text-[11px] text-zinc-500">
                  <p>ID: {passwordUser.employee?.employeeCode || `EMP-${1000 + passwordUser.id}`}</p>
                  <p>Role: {passwordUser.role}</p>
                </div>
              </div>

              {/* Current Password Display */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-400">Current Password</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassField(!showPassField)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {showPassField ? "Hide" : "Reveal"}
                    </button>
                    {passwordUser.password && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(passwordUser.password)}
                        className="text-[11px] text-zinc-400 hover:text-white inline-flex items-center gap-1"
                        title="Copy password"
                      >
                        {copiedPass ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedPass ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="font-mono text-sm tracking-wider px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-200">
                  {showPassField ? passwordUser.password || "No password stored" : "••••••••••••"}
                </div>
              </div>

              {/* Set New Password Form */}
              <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-300">Set New Password *</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-medium"
                    >
                      <Sparkles className="h-3 w-3" />
                      Auto-Generate Secure Pass
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 font-mono placeholder:font-sans placeholder:text-zinc-600 outline-none focus:border-amber-500"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    As an administrator, this will immediately overwrite the employee&apos;s login password.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setPasswordUser(null)}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={passLoading || !newPassword}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                  >
                    {passLoading ? "Updating..." : "Save New Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Live Shift & Activity Details Modal */}
      {selectedStaffActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative text-zinc-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStaffActivity.avatar || selectedStaffActivity.employee?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                  alt={selectedStaffActivity.name}
                  className="h-10 w-10 rounded-full object-cover border border-zinc-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedStaffActivity.name}</h3>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {selectedStaffActivity.employee?.employeeCode || `EMP-${1000 + selectedStaffActivity.id}`}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {selectedStaffActivity.department} · {selectedStaffActivity.employee?.designation || selectedStaffActivity.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaffActivity(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body scrollable */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Shift Attendance Timing Card */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  Today&apos;s Shift Telemetry
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <p className="text-zinc-500 text-[11px]">Shift Status</p>
                    <p className="font-semibold mt-1 capitalize text-emerald-400">
                      {selectedStaffActivity.stats?.attendanceStatus?.replace("_", " ") || "Not checked in"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <p className="text-zinc-500 text-[11px]">Check In Time</p>
                    <p className="font-semibold mt-1 text-white font-mono">
                      {selectedStaffActivity.stats?.checkInTime || "—"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <p className="text-zinc-500 text-[11px]">Check Out Time</p>
                    <p className="font-semibold mt-1 text-white font-mono">
                      {selectedStaffActivity.stats?.checkOutTime || (selectedStaffActivity.stats?.checkInTime ? "On Shift" : "—")}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <p className="text-zinc-500 text-[11px]">Active Duration</p>
                    <p className="font-semibold mt-1 text-white font-mono">
                      {selectedStaffActivity.stats?.shiftDuration || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Location: {selectedStaffActivity.stats?.location || "Headquarters"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Laptop className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Device: {selectedStaffActivity.stats?.device || "Web Browser"}</span>
                  </div>
                  <div>
                    <span>Total Breaks: {selectedStaffActivity.stats?.breakMinutes || 0} minutes ({selectedStaffActivity.stats?.breakCount || 0} cycles)</span>
                  </div>
                </div>
              </div>

              {/* Today Tasks Metrics */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                  Today&apos;s Output Metrics
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <p className="text-lg font-bold text-indigo-400 tabular-nums">{selectedStaffActivity.stats?.todayTickets || 0}</p>
                    <p className="text-[10px] text-zinc-400 uppercase">Tickets</p>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <p className="text-lg font-bold text-cyan-400 tabular-nums">{selectedStaffActivity.stats?.todayChats || 0}</p>
                    <p className="text-[10px] text-zinc-400 uppercase">Chats</p>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <p className="text-lg font-bold text-emerald-400 tabular-nums">{selectedStaffActivity.stats?.todayKyc || 0}</p>
                    <p className="text-[10px] text-zinc-400 uppercase">KYC</p>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <p className="text-lg font-bold text-purple-400 tabular-nums">{selectedStaffActivity.stats?.todayCalls || 0}</p>
                    <p className="text-[10px] text-zinc-400 uppercase">Calls</p>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <p className="text-lg font-bold text-amber-400 tabular-nums">{selectedStaffActivity.stats?.todayEmails || 0}</p>
                    <p className="text-[10px] text-zinc-400 uppercase">Emails</p>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <p className="text-lg font-bold text-rose-400 tabular-nums">{selectedStaffActivity.stats?.todayTraining || 0}h</p>
                    <p className="text-[10px] text-zinc-400 uppercase">Training</p>
                  </div>
                </div>
              </div>

              {/* Detailed Today Activities List */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                  Today&apos;s Activity Records ({selectedStaffActivity.stats?.todayActivities?.length || 0})
                </h4>

                {(!selectedStaffActivity.stats?.todayActivities || selectedStaffActivity.stats.todayActivities.length === 0) ? (
                  <div className="p-6 text-center rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 text-xs">
                    No individual activity logs recorded for today yet.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden text-xs">
                    {selectedStaffActivity.stats.todayActivities.map((act: any) => (
                      <div key={act.id} className="p-3 hover:bg-zinc-900/50 transition">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-400 font-mono">
                              {act.type}
                            </span>
                            <span className="font-semibold text-zinc-200">
                              {act.quantity > 1 ? `${act.quantity} items` : `1 task`}
                            </span>
                            {act.accountId && (
                              <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                                {act.accountId}
                              </span>
                            )}
                            {act.country && (
                              <span className="text-[11px] text-emerald-400">
                                ({act.country})
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">
                            {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}
                          </span>
                        </div>
                        {act.description && (
                          <p className="mt-1 text-zinc-400 text-xs pl-0.5">
                            {act.description}
                          </p>
                        )}
                        {(act.ticketCategory || act.priority || act.status) && (
                          <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-zinc-500 font-mono">
                            {act.ticketCategory && <span>Category: {act.ticketCategory}</span>}
                            {act.priority && <span>Priority: {act.priority}</span>}
                            {act.status && <span className="text-emerald-400 font-medium">Status: {act.status}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const empId = selectedStaffActivity.id;
                  setSelectedStaffActivity(null);
                  handleInspect(empId);
                }}
                className="gap-1.5 border-indigo-700 bg-indigo-950/30 text-indigo-400 hover:bg-indigo-900/50 text-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Inspect This Workspace</span>
              </Button>

              <button
                onClick={() => setSelectedStaffActivity(null)}
                className="rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Staff Profile & Access</h3>
                  <p className="text-xs text-zinc-400">{editingUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Assigned Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                >
                  <option value="employee">Standard Employee</option>
                  <option value="manager">Team Manager</option>
                  <option value="admin">System Administrator</option>
                </select>
                <p className="mt-1 text-[11px] text-zinc-500">Only administrators have clearance to change employee roles.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Department</label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                >
                  <option value="Customer Support">Customer Support</option>
                  <option value="Compliance & KYC">Compliance & KYC</option>
                  <option value="Client Success">Client Success</option>
                  <option value="Technical Operations">Technical Operations</option>
                  <option value="Operations & Leadership">Operations & Leadership</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Designation Title</label>
                <input
                  type="text"
                  value={editDesig}
                  onChange={(e) => setEditDesig(e.target.value)}
                  placeholder="e.g. Senior Compliance Lead"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Reset Password (Optional)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave empty to keep current password"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  {editLoading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
