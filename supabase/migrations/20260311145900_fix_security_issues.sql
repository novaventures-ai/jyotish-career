-- Enable RLS for all tables
ALTER TABLE "incomeStreams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "remedies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "yogas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "birthProfiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "careerCategories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "occupations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "userCareerRecommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chatMessages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chatConversations" ENABLE ROW LEVEL SECURITY;

-- 1. Master Data / Public Content (Read-only for all)
CREATE POLICY "Public read access for incomeStreams" ON "incomeStreams" FOR SELECT USING (true);
CREATE POLICY "Public read access for remedies" ON "remedies" FOR SELECT USING (true);
CREATE POLICY "Public read access for yogas" ON "yogas" FOR SELECT USING (true);
CREATE POLICY "Public read access for careerCategories" ON "careerCategories" FOR SELECT USING (true);
CREATE POLICY "Public read access for occupations" ON "occupations" FOR SELECT USING (true);

-- 2. User specific data (Owner access only)
-- We assume "openId" in "users" table matches Supabase auth.uid()

CREATE POLICY "Users can view and update their own data" ON "users"
FOR ALL USING (auth.uid()::text = "openId");

CREATE POLICY "Users can handle their own birthProfiles" ON "birthProfiles"
FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = "birthProfiles"."userId" AND users."openId" = auth.uid()::text));

CREATE POLICY "Users can handle their own careerRecommendations" ON "userCareerRecommendations"
FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = "userCareerRecommendations"."userId" AND users."openId" = auth.uid()::text));

CREATE POLICY "Users can handle their own chatConversations" ON "chatConversations"
FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = "chatConversations"."userId" AND users."openId" = auth.uid()::text));

CREATE POLICY "Users can handle their own chatMessages" ON "chatMessages"
FOR ALL USING (EXISTS (
  SELECT 1 FROM "chatConversations" 
  JOIN users ON users.id = "chatConversations"."userId"
  WHERE "chatConversations".id = "chatMessages"."conversationId" 
  AND users."openId" = auth.uid()::text
));

-- 3. Fix handle_new_user function search_path
-- Note: We only run this if the function exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user SET search_path = public;
  END IF;
END $$;
