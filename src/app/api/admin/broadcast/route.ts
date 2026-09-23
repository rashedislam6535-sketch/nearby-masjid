import { NextResponse } from "next/server";
import { getMemoryStore, saveToDisk } from "@/lib/dataStore";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const broadcasts: Array<{
      id: number | string;
      title: string;
      message: string;
      type: string;
      department?: string;
      createdAt: string;
      deliveredCount: number;
    }> = [];

    if (process.env.DATABASE_URL) {
      try {
        const notifs = await db
          .select()
          .from(notifications)
          .orderBy(desc(notifications.createdAt))
          .limit(60);

        const seen = new Set<string>();
        for (const n of notifs) {
          // Only include genuine broadcasts/system notices
          if (n.title.startsWith("[Broadcast]") || n.type === "system" || n.type === "reminder" || n.type === "achievement") {
            const key = `${n.title}-${n.message}`;
            if (!seen.has(key)) {
              seen.add(key);
              const count = notifs.filter((x) => `${x.title}-${x.message}` === key).length;
              broadcasts.push({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type,
                createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
                deliveredCount: count,
              });
            }
          }
        }

        if (broadcasts.length > 0) {
          return NextResponse.json({ success: true, broadcasts });
        }
      } catch (dbErr) {
        console.warn("DB broadcast history read bypassed:", dbErr);
      }
    }

    const store = getMemoryStore();
    const seen = new Set<string>();
    for (const n of store.notifications) {
      if (n.title.startsWith("[Broadcast]") || n.type === "system" || n.type === "reminder" || n.type === "achievement") {
        const key = `${n.title}-${n.message}`;
        if (!seen.has(key)) {
          seen.add(key);
          const count = store.notifications.filter((x) => `${x.title}-${x.message}` === key).length;
          broadcasts.push({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            createdAt: n.createdAt,
            deliveredCount: count,
          });
        }
      }
    }

    return NextResponse.json({ success: true, broadcasts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, message, type, department } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    const cleanTitle = String(title).trim();
    const cleanMessage = String(message).trim();
    const notifType = type || "system";
    const formattedTitle = cleanTitle.startsWith("[Broadcast]") ? cleanTitle : `[Broadcast] ${cleanTitle}`;
    const nowIso = new Date().toISOString();

    let deliveredCount = 0;

    // 1. If PostgreSQL is configured, insert to all matching users
    if (process.env.DATABASE_URL) {
      try {
        const allDbUsers = await db.select().from(users);
        const targetDbUsers = department && department !== "All"
          ? allDbUsers.filter((u) => u.department === department)
          : allDbUsers;

        for (const u of targetDbUsers) {
          await db.insert(notifications).values({
            userId: u.id,
            title: formattedTitle,
            message: cleanMessage,
            type: notifType,
            isRead: 0,
          });
        }

        deliveredCount = targetDbUsers.length;
      } catch (dbErr) {
        console.warn("DB broadcast write failed, saving to active store:", dbErr);
      }
    }

    // 2. Also save to MemoryStore and sync to disk
    const store = getMemoryStore();
    const targetMemUsers = department && department !== "All"
      ? store.users.filter((u) => u.department === department)
      : store.users;

    let runningMaxId = store.notifications.length > 0
      ? Math.max(...store.notifications.map((n) => (typeof n.id === "number" ? n.id : 0)))
      : 1000;

    for (const u of targetMemUsers) {
      runningMaxId += 1;
      store.notifications.unshift({
        id: runningMaxId,
        userId: u.id,
        title: formattedTitle,
        message: cleanMessage,
        type: notifType,
        isRead: 0,
        createdAt: nowIso,
      });
    }

    // Add universal fallback so any current or future user sees the broadcast
    runningMaxId += 1;
    store.notifications.unshift({
      id: runningMaxId,
      userId: 0,
      title: formattedTitle,
      message: cleanMessage,
      type: notifType,
      isRead: 0,
      createdAt: nowIso,
    });

    saveToDisk(store);

    if (deliveredCount === 0) {
      deliveredCount = targetMemUsers.length || 1;
    }

    return NextResponse.json({
      success: true,
      deliveredCount,
      message: `Announcement broadcasted to ${deliveredCount} team member(s).`,
      broadcast: {
        title: formattedTitle,
        message: cleanMessage,
        department: department || "All",
        type: notifType,
        deliveredCount,
        createdAt: nowIso,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
