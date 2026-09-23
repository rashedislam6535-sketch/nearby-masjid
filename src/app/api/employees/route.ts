import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, dailyUpdates, attendanceCheckIns, attendance, activities, employees } from "@/db/schema";
import { calculateProductivityScore, toDateStr } from "@/lib/utils";
import { getMemoryStore } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

function formatTime(isoString?: string | null): string | null {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

function calculateShiftDuration(checkIn?: string | null, checkOut?: string | null, breakMinutes = 0, workingMinutes?: number | null): string {
  if (!checkIn) return "—";
  try {
    const start = new Date(checkIn).getTime();
    if (checkOut) {
      const end = new Date(checkOut).getTime();
      const mins = workingMinutes ?? Math.max(0, Math.round((end - start) / 60000) - breakMinutes);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m shift`;
    }
    const ongoing = Math.max(0, Math.round((Date.now() - start) / 60000) - breakMinutes);
    const h = Math.floor(ongoing / 60);
    const m = ongoing % 60;
    return `${h}h ${m}m active`;
  } catch {
    return "—";
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const todayStr = searchParams.get("date") || toDateStr(new Date());

    if (process.env.DATABASE_URL) {
      try {
        const allUsers = await db.select().from(users).orderBy(users.role);
        const allEmployees = await db.select().from(employees);
        const allActs = await db.select().from(activities);
        const allAttendance = await db.select().from(attendance);

        const employeesData = allUsers.map((user) => {
          const emp = allEmployees.find((e) => e.userId === user.id);
          const empId = emp?.id || user.id;

          const userActs = allActs.filter((a) => a.employeeId === empId);
          const todayActs = userActs.filter((a) => a.date === todayStr);

          let totalTickets = 0;
          let totalChats = 0;
          let totalKyc = 0;
          let totalCalls = 0;
          let totalEmails = 0;
          let totalTraining = 0;

          let todayTickets = 0;
          let todayChats = 0;
          let todayKyc = 0;
          let todayCalls = 0;
          let todayEmails = 0;
          let todayTraining = 0;

          for (const a of userActs) {
            const qty = Number(a.quantity) || 1;
            if (a.type === "ticket") totalTickets += qty;
            if (a.type === "chat") totalChats += qty;
            if (a.type === "kyc") totalKyc += qty;
            if (a.type === "call") totalCalls += qty;
            if (a.type === "email") totalEmails += qty;
            if (a.type === "training") totalTraining += qty;
          }

          for (const a of todayActs) {
            const qty = Number(a.quantity) || 1;
            if (a.type === "ticket") todayTickets += qty;
            if (a.type === "chat") todayChats += qty;
            if (a.type === "kyc") todayKyc += qty;
            if (a.type === "call") todayCalls += qty;
            if (a.type === "email") todayEmails += qty;
            if (a.type === "training") todayTraining += qty;
          }

          const userAtt = allAttendance.find((a) => a.employeeId === empId && a.date === todayStr);
          const recentAtt = allAttendance
            .filter((a) => a.employeeId === empId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          const attToDisplay = userAtt || recentAtt;
          const isTodayAtt = Boolean(userAtt);

          let attStatus: "working" | "on_break" | "checked_out" | "not_checked_in" = "not_checked_in";
          if (userAtt) {
            if (userAtt.checkOut) attStatus = "checked_out";
            else if (userAtt.checkIn) attStatus = "working";
          }

          const todayTasksCount = todayTickets + todayChats + todayKyc + todayCalls + todayEmails + (todayTraining > 0 ? 1 : 0);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            avatar: emp?.photo || user.avatar,
            password: user.password,
            employee: emp || null,
            stats: {
              tickets: totalTickets,
              chats: totalChats,
              kyc: totalKyc,
              calls: totalCalls,
              emails: totalEmails,
              trainingHours: Number(totalTraining.toFixed(1)),
              todayTickets,
              todayChats,
              todayKyc,
              todayCalls,
              todayEmails,
              todayTraining: Number(todayTraining.toFixed(1)),
              todayTasksCount,
              todayActivitiesCount: todayActs.length,
              todayActivities: todayActs,
              todayLogged: todayActs.length > 0,
              attendanceStatus: attStatus,
              checkInTime: formatTime(userAtt?.checkIn?.toISOString()),
              checkOutTime: formatTime(userAtt?.checkOut?.toISOString()),
              shiftDuration: calculateShiftDuration(userAtt?.checkIn?.toISOString(), userAtt?.checkOut?.toISOString(), 0, userAtt?.workingMinutes),
              workingMinutes: userAtt?.workingMinutes || 0,
              breakMinutes: 0,
              isOnBreak: false,
              location: userAtt?.location || "Headquarters",
              device: userAtt?.device || "Web Browser",
              performanceScore: Math.min(99, Math.max(70, 75 + todayTasksCount * 4)),
              latestActivity: todayActs[0] ? `${todayActs[0].type.toUpperCase()}: ${todayActs[0].description || "Task completed"}` : null,
              latestActivityTime: todayActs[0] ? formatTime(todayActs[0].createdAt.toISOString()) : null,
            },
          };
        });

        if (employeesData.length > 0) {
          return NextResponse.json({ employees: employeesData });
        }
      } catch (e) {
        console.warn("Employees DB read bypassed to memory store:", e);
      }
    }

    const store = getMemoryStore();

    const employeesData = store.users.map((user) => {
      const emp = store.employees.find((e) => e.userId === user.id);
      const empId = emp?.id || user.id;

      const acts = store.activities.filter((a) => a.employeeId === empId || a.employeeId === user.id);
      const todayActs = acts.filter((a) => a.date === todayStr);

      let totalTickets = 0;
      let totalChats = 0;
      let totalKyc = 0;
      let totalCalls = 0;
      let totalEmails = 0;
      let totalTraining = 0;

      let todayTickets = 0;
      let todayChats = 0;
      let todayKyc = 0;
      let todayCalls = 0;
      let todayEmails = 0;
      let todayTraining = 0;

      for (const a of acts) {
        const qty = Number(a.quantity) || 1;
        if (a.type === "ticket") totalTickets += qty;
        if (a.type === "chat") totalChats += qty;
        if (a.type === "kyc") totalKyc += qty;
        if (a.type === "call") totalCalls += qty;
        if (a.type === "email") totalEmails += qty;
        if (a.type === "training") totalTraining += qty;
      }

      for (const a of todayActs) {
        const qty = Number(a.quantity) || 1;
        if (a.type === "ticket") todayTickets += qty;
        if (a.type === "chat") todayChats += qty;
        if (a.type === "kyc") todayKyc += qty;
        if (a.type === "call") todayCalls += qty;
        if (a.type === "email") todayEmails += qty;
        if (a.type === "training") todayTraining += qty;
      }

      // Check attendance for today
      const todayAtt = store.attendance.find(
        (a) => (a.employeeId === empId || a.userId === user.id) && a.date === todayStr
      );

      // Most recent attendance across any date for context
      const recentAtt = store.attendance
        .filter((a) => a.employeeId === empId || a.userId === user.id)
        .sort((a, b) => new Date(b.checkIn || b.date).getTime() - new Date(a.checkIn || a.date).getTime())[0];

      const activeAtt = todayAtt || (recentAtt?.date === todayStr ? recentAtt : null);

      let attStatus: "working" | "on_break" | "checked_out" | "not_checked_in" = "not_checked_in";
      if (activeAtt) {
        if (activeAtt.status === "checked_out" || activeAtt.checkOut) {
          attStatus = "checked_out";
        } else if (activeAtt.status === "on_break" || activeAtt.onBreak) {
          attStatus = "on_break";
        } else if (activeAtt.checkIn) {
          attStatus = "working";
        }
      } else if (user.role === "admin") {
        // Admin default to working if active
        attStatus = "working";
      }

      const todayTasksCount = todayTickets + todayChats + todayKyc + todayCalls + todayEmails + (todayTraining > 0 ? 1 : 0);
      const latestAct = todayActs[0] || acts[0];

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: emp?.photo || user.avatar,
        password: store.passwords[user.email] || (user as any).password || "••••••••",
        employee: emp || null,
        stats: {
          tickets: totalTickets,
          chats: totalChats,
          kyc: totalKyc,
          calls: totalCalls,
          emails: totalEmails,
          trainingHours: Number(totalTraining.toFixed(1)),
          todayTickets,
          todayChats,
          todayKyc,
          todayCalls,
          todayEmails,
          todayTraining: Number(todayTraining.toFixed(1)),
          todayTasksCount,
          todayActivitiesCount: todayActs.length,
          todayActivities: todayActs,
          todayLogged: todayActs.length > 0,
          attendanceStatus: attStatus,
          checkInTime: formatTime(activeAtt?.checkIn),
          checkOutTime: formatTime(activeAtt?.checkOut),
          shiftDuration: calculateShiftDuration(activeAtt?.checkIn, activeAtt?.checkOut, activeAtt?.breakMinutes || 0, activeAtt?.workingMinutes),
          workingMinutes: activeAtt?.workingMinutes || 0,
          breakMinutes: activeAtt?.breakMinutes || 0,
          breakCount: activeAtt?.breaks?.length || 0,
          isOnBreak: activeAtt?.onBreak || false,
          location: activeAtt?.location || "Headquarters",
          device: activeAtt?.device || "Web Browser",
          performanceScore: Math.min(99, Math.max(70, 75 + (todayTasksCount > 0 ? todayTasksCount * 4 : acts.length * 2))),
          latestActivity: latestAct ? `${latestAct.type.toUpperCase()}: ${latestAct.description || latestAct.ticketCategory || `${latestAct.quantity || 1} items`}` : null,
          latestActivityTime: latestAct?.createdAt ? formatTime(latestAct.createdAt) : null,
        },
      };
    });

    return NextResponse.json({ employees: employeesData });
  } catch (error: any) {
    console.error("Employees API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
