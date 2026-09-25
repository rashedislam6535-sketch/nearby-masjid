import { pgTable, serial, text, timestamp, doublePrecision, integer, boolean } from "drizzle-orm/pg-core";

export const mosques = pgTable("mosques", {
  id: serial("id").primaryKey(),
  mosqueNameBn: text("mosque_name_bn").notNull(),
  mosqueNameEn: text("mosque_name_en").notNull(),
  image: text("image"),
  address: text("address").notNull(),
  division: text("division").notNull(),
  district: text("district").notNull(),
  upazila: text("upazila").notNull(),
  unionName: text("union_name"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  contact: text("contact"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const prayerTimes = pgTable("prayer_times", {
  id: serial("id").primaryKey(),
  mosqueId: integer("mosque_id").notNull().references(() => mosques.id, { onDelete: "cascade" }),
  fajr: text("fajr").notNull(),
  dhuhr: text("dhuhr").notNull(),
  asr: text("asr").notNull(),
  maghrib: text("maghrib").notNull(),
  isha: text("isha").notNull(),
  jummah: text("jummah").default("01:30 PM"),
  image: text("image"),
  updatedDate: timestamp("updated_date", { withTimezone: true }).defaultNow(),
  nextUpdateDate: timestamp("next_update_date", { withTimezone: true }),
  isVerified: boolean("is_verified").default(true),
  ocrRawText: text("ocr_raw_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const masjidUsers = pgTable("masjid_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  location: text("location"),
  favoriteMosques: text("favorite_mosques").default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const timetableLogs = pgTable("timetable_logs", {
  id: serial("id").primaryKey(),
  mosqueId: integer("mosque_id").references(() => mosques.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  chartImage: text("chart_image"),
  performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow(),
});

export type Mosque = typeof mosques.$inferSelect;
export type NewMosque = typeof mosques.$inferInsert;
export type PrayerTime = typeof prayerTimes.$inferSelect;
export type NewPrayerTime = typeof prayerTimes.$inferInsert;
