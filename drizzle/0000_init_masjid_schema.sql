CREATE TABLE "masjid_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"location" text,
	"favorite_mosques" text DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "masjid_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "mosques" (
	"id" serial PRIMARY KEY NOT NULL,
	"mosque_name_bn" text NOT NULL,
	"mosque_name_en" text NOT NULL,
	"image" text,
	"address" text NOT NULL,
	"division" text NOT NULL,
	"district" text NOT NULL,
	"upazila" text NOT NULL,
	"union_name" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"contact" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prayer_times" (
	"id" serial PRIMARY KEY NOT NULL,
	"mosque_id" integer NOT NULL,
	"fajr" text NOT NULL,
	"dhuhr" text NOT NULL,
	"asr" text NOT NULL,
	"maghrib" text NOT NULL,
	"isha" text NOT NULL,
	"jummah" text DEFAULT '01:30 PM',
	"image" text,
	"updated_date" timestamp with time zone DEFAULT now(),
	"next_update_date" timestamp with time zone,
	"is_verified" boolean DEFAULT true,
	"ocr_raw_text" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timetable_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"mosque_id" integer,
	"action" text NOT NULL,
	"details" text,
	"chart_image" text,
	"performed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "prayer_times" ADD CONSTRAINT "prayer_times_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_logs" ADD CONSTRAINT "timetable_logs_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE cascade ON UPDATE no action;