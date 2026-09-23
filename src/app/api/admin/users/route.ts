import { NextResponse } from "next/server";
import { getMemoryStore, saveToDisk } from "@/lib/dataStore";
import { db } from "@/db";
import { users, employees, dailyUpdates, attendanceCheckIns, attendance, activities, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User, EmployeeProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getMemoryStore();
    const todayStr = new Date().toISOString().split("T")[0];

    // If database is available, sync/query
    if (process.env.DATABASE_URL) {
      try {
        const dbUsers = await db.select().from(users);
        const dbEmployees = await db.select().from(employees);
        const dbActivities = await db.select().from(activities);
        const dbAttendance = await db.select().from(attendance);

        const usersWithProfiles = dbUsers.map((u) => {
          const emp = dbEmployees.find((e) => e.userId === u.id);
          const userActs = dbActivities.filter((a) => a.employeeId === (emp?.id || u.id));
          const todayActs = userActs.filter((a) => a.date === todayStr);
          const att = dbAttendance.find(
            (a) => a.employeeId === (emp?.id || u.id) && a.date === todayStr
          );

          const totalTasks = userActs.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department,
            avatar: u.avatar,
            password: u.password || store.passwords[u.email] || "••••••••",
            employee: emp || null,
            stats: {
              totalActivities: userActs.length,
              totalTasks,
              todayActivities: todayActs.length,
              availability: emp?.availability || "available",
              attendanceStatus: att?.checkOut ? "checked_out" : att?.checkIn ? "working" : "not_checked_in",
              lastActive: userActs[0]?.createdAt ? new Date(userActs[0].createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
            },
          };
        });

        if (usersWithProfiles.length > 0) {
          return NextResponse.json({
            success: true,
            users: usersWithProfiles,
            totalCount: usersWithProfiles.length,
          });
        }
      } catch (dbErr) {
        console.warn("DB users read fallback to memory store:", dbErr);
      }
    }

    const usersWithProfiles = store.users.map((u) => {
      const emp = store.employees.find((e) => e.userId === u.id);
      const userActs = store.activities.filter((a) => a.employeeId === (emp?.id || u.id));
      const todayActs = userActs.filter((a) => a.date === todayStr);
      const att = store.attendance.find(
        (a) => (a.employeeId === (emp?.id || u.id) || a.userId === u.id) && a.date === todayStr
      );

      const totalTasks = userActs.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
      const pwd = store.passwords[u.email] || (u as any).password || "••••••••";

      return {
        ...u,
        password: pwd,
        employee: emp || null,
        stats: {
          totalActivities: userActs.length,
          totalTasks,
          todayActivities: todayActs.length,
          availability: emp?.availability || "available",
          attendanceStatus: att?.status || (u.role === "admin" ? "working" : "not_checked_in"),
          lastActive: userActs[0]?.createdAt ? new Date(userActs[0].createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
        },
      };
    });

    return NextResponse.json({
      success: true,
      users: usersWithProfiles,
      totalCount: store.users.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, department, designation, availability, password, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const pwdToSet = password || newPassword;
    if (pwdToSet && String(pwdToSet).trim().length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const store = getMemoryStore();
    const userIndex = store.users.findIndex((u) => u.id === Number(userId));
    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role protection: prevent removing the last admin
    if (role && role !== "admin" && store.users[userIndex].role === "admin") {
      const adminCount = store.users.filter((u) => u.role === "admin").length;
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot demote the only remaining administrator." }, { status: 400 });
      }
    }

    if (role) store.users[userIndex].role = role;
    if (department) store.users[userIndex].department = department;

    const empIndex = store.employees.findIndex((e) => e.userId === Number(userId));
    if (empIndex !== -1) {
      if (department) store.employees[empIndex].department = department;
      if (designation !== undefined) store.employees[empIndex].designation = designation;
      if (availability) store.employees[empIndex].availability = availability;
    }

    // Update password if provided
    if (pwdToSet) {
      const cleanPwd = String(pwdToSet).trim();
      store.passwords[store.users[userIndex].email] = cleanPwd;
      (store.users[userIndex] as any).password = cleanPwd;
    }

    // Also update PostgreSQL if available
    if (process.env.DATABASE_URL) {
      try {
        const updateFields: any = {};
        if (role) updateFields.role = role;
        if (department) updateFields.department = department;
        if (pwdToSet) updateFields.password = String(pwdToSet).trim();

        if (Object.keys(updateFields).length > 0) {
          await db.update(users).set(updateFields).where(eq(users.id, Number(userId)));
        }

        const empUpdateFields: any = {};
        if (department) empUpdateFields.department = department;
        if (designation !== undefined) empUpdateFields.designation = designation;
        if (availability) empUpdateFields.availability = availability;

        if (Object.keys(empUpdateFields).length > 0) {
          await db.update(employees).set(empUpdateFields).where(eq(employees.userId, Number(userId)));
        }
      } catch (dbErr) {
        console.warn("DB user update bypassed, saved to memory store:", dbErr);
      }
    }

    saveToDisk(store);

    return NextResponse.json({
      success: true,
      message: pwdToSet ? "User profile and password updated successfully." : "User profile updated successfully.",
      user: store.users[userIndex],
      employee: empIndex !== -1 ? store.employees[empIndex] : null,
      password: pwdToSet ? String(pwdToSet).trim() : store.passwords[store.users[userIndex].email],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const store = getMemoryStore();
    const targetUser = store.users.find((u) => u.id === userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Prevent deleting the last admin
    if (targetUser.role === "admin") {
      const adminCount = store.users.filter((u) => u.role === "admin").length;
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last administrator account." }, { status: 400 });
      }
    }

    // Cascade delete in PostgreSQL if configured
    if (process.env.DATABASE_URL) {
      try {
        await db.delete(users).where(eq(users.id, userId));
      } catch (dbErr) {
        console.warn("DB user delete bypassed, deleting from active store:", dbErr);
      }
    }

    const emp = store.employees.find((e) => e.userId === userId);
    const empId = emp?.id;

    store.users = store.users.filter((u) => u.id !== userId);
    store.employees = store.employees.filter((e) => e.userId !== userId);
    store.activities = store.activities.filter(
      (a) => a.employeeId !== userId && (empId ? a.employeeId !== empId : true)
    );
    store.attendance = store.attendance.filter(
      (a) => a.userId !== userId && (empId ? a.employeeId !== empId : true)
    );
    store.dailyUpdates = store.dailyUpdates.filter((u) => u.userId !== userId);
    store.notifications = store.notifications.filter((n) => n.userId !== userId);
    delete store.passwords[targetUser.email];

    saveToDisk(store);

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) removed successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
