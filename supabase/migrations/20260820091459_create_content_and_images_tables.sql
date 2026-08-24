/*
# Create content and images tables for SmartContent AI

1. Purpose
   SmartContent AI is a multi-user content generation platform. Each signed-in
   user generates and saves their own written content (blog posts, emails,
   social posts, ads, product descriptions, code) and AI-generated images.
   Both tables are owner-scoped via user_id.

2. New Tables
   - `content`
     - id (uuid, primary key)
     - user_id (uuid, not null, defaults to auth.uid(), references auth.users, cascade delete)
     - type (text, not null) — content category: blog/email/social/ad/product/code
     - title (text) — optional title/label
     - prompt (text) — the prompt used to generate the content
     - result (text, not null) — the generated content body
     - language (text) — programming language for code type, null otherwise
     - created_at (timestamptz, default now())
   - `images`
     - id (uuid, primary key)
     - user_id (uuid, not null, defaults to auth.uid(), references auth.users, cascade delete)
     - prompt (text, not null) — the image description / prompt
     - style (text, not null) — image style e.g. Realistic Photography
     - mood (text, not null) — image mood e.g. Dramatic
     - quality (text, not null) — Standard or High Quality
     - aspect_ratio (text, not null) — e.g. 1:1, 16:9, 4:5
     - image_url (text, not null) — URL of the generated image
     - is_demo (boolean, default true) — whether the image was produced in demo mode
     - created_at (timestamptz, default now())

3. Security
   - Enable RLS on both tables.
   - Owner-scoped CRUD: each authenticated user can only access rows they own.
   - SELECT/INSERT/UPDATE/DELETE policies scoped to auth.uid() = user_id.
   - user_id columns default to auth.uid() so client inserts that omit
     user_id still satisfy the WITH CHECK ownership predicate.

4. Notes
   - No destructive operations performed; idempotent via IF NOT EXISTS.
   - Indexes added on user_id for both tables and created_at desc ordering.
*/

CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  prompt text,
  result text NOT NULL,
  language text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_content" ON content;
CREATE POLICY "select_own_content" ON content FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_content" ON content;
CREATE POLICY "insert_own_content" ON content FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_content" ON content;
CREATE POLICY "update_own_content" ON content FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_content" ON content;
CREATE POLICY "delete_own_content" ON content FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS content_user_id_idx ON content(user_id);
CREATE INDEX IF NOT EXISTS content_created_at_idx ON content(created_at DESC);

CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  style text NOT NULL,
  mood text NOT NULL,
  quality text NOT NULL,
  aspect_ratio text NOT NULL,
  image_url text NOT NULL,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_images" ON images;
CREATE POLICY "select_own_images" ON images FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_images" ON images;
CREATE POLICY "insert_own_images" ON images FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_images" ON images;
CREATE POLICY "update_own_images" ON images FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_images" ON images;
CREATE POLICY "delete_own_images" ON images FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS images_user_id_idx ON images(user_id);
CREATE INDEX IF NOT EXISTS images_created_at_idx ON images(created_at DESC);
