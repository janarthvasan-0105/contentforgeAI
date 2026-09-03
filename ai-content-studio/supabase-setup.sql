-- Supabase SQL Setup

CREATE TABLE blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  topic text NOT NULL,
  content text NOT NULL,
  seo_score integer DEFAULT 0,
  status text DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id),
  content text NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id),
  publish_date timestamp with time zone NOT NULL,
  platform text NOT NULL,
  status text DEFAULT 'pending'
);

CREATE TABLE published_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id),
  platform text NOT NULL,
  published_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
