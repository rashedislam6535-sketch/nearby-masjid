-- ==============================================================================
-- Migration: Row-Level Security (RLS) Policies for Nearby Masjid
-- Protects production data against unauthorized write, update, and delete calls.
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE "mosques" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "prayer_times" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "timetable_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "masjid_users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- 2. Public Read-Only Access (Anyone can browse verified mosques and prayer timetables)
CREATE POLICY "Public read access for mosques" 
ON "mosques" 
FOR SELECT 
USING (true);
--> statement-breakpoint

CREATE POLICY "Public read access for prayer times" 
ON "prayer_times" 
FOR SELECT 
USING (true);
--> statement-breakpoint

CREATE POLICY "Public read access for timetable logs" 
ON "timetable_logs" 
FOR SELECT 
USING (true);
--> statement-breakpoint

-- 3. Restrict destructive mutations to authenticated service role / backend connection
-- Standard postgres / service_role has BYPASSRLS or admin privilege
CREATE POLICY "Admin write access for mosques" 
ON "mosques" 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
--> statement-breakpoint

CREATE POLICY "Admin write access for prayer times" 
ON "prayer_times" 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
--> statement-breakpoint

CREATE POLICY "Admin write access for timetable logs" 
ON "timetable_logs" 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
