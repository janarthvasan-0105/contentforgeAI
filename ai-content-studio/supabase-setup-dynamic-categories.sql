-- CREATE TABLE FOR DYNAMIC BLOG CATEGORIES
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name text NOT NULL,
  category_name text NOT NULL,
  topic_ideas text,
  target_audience text,
  icon text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_name, category_name)
);

-- SEED INITIAL HUZZLER CATEGORIES
INSERT INTO blog_categories (group_name, category_name, topic_ideas, target_audience, icon) VALUES
('Huzzler (Freelancing)', 'Trends', 'Market forecasts, industry shifts, new gig economies', 'All freelancers', '📈'),
('Huzzler (Freelancing)', 'Freelancers', 'Client communication, tax planning, building a portfolio', 'All freelancers', '💼'),
('Huzzler (Freelancing)', 'Clients', 'How to hire top talent, writing clear job specs', 'Hiring clients', '🤝'),
('Huzzler (Freelancing)', 'Started', 'First gig guide, platform settings, profile optimization', 'New freelancers', '🚀'),
('Huzzler (Freelancing)', 'Earnings & Finance', 'Pricing strategy, invoicing tips, saving for taxes', 'All freelancers', '💸'),
('Huzzler (Freelancing)', 'Tools & Productivity', 'Project management apps, time trackers, focus habits', 'All freelancers', '🛠️'),
('Huzzler (Freelancing)', 'Marketing Yourself', 'Personal branding, LinkedIn tips, cold emailing', 'All freelancers', '📣'),
('Huzzler (Freelancing)', 'Success Stories', 'Interviews with top earners, business scaling examples', 'All freelancers', '⭐'),
('Huzzler (Freelancing)', 'Safety & Trust', 'Avoiding scam clients, safe payments, contracts', 'All freelancers', '🔐'),
('Huzzler (Freelancing)', 'Remote Work', 'Home office setups, digital nomad visas, work-life balance', 'All freelancers', '🌐')
ON CONFLICT (group_name, category_name) DO NOTHING;

-- SEED INITIAL WIVIY CATEGORIES
INSERT INTO blog_categories (group_name, category_name, topic_ideas, target_audience, icon) VALUES
('Wiviy (Dating)', 'Dating Tips', 'First message ideas, profile do''s & don''ts, conversation starters', 'All users', '💬'),
('Wiviy (Dating)', 'Profile & Looks', 'Writing a bio that works, best photos, standing out', 'New users', '📸'),
('Wiviy (Dating)', 'Trending', 'Dating culture news, viral trends, modern relationship norms', 'All users', '🔥'),
('Wiviy (Dating)', 'Relationships', 'Building connections, long-distance tips', 'Serious daters', '💑'),
('Wiviy (Dating)', 'Local Dating', 'City-specific date ideas, local events', 'Location-based users', '📍'),
('Wiviy (Dating)', 'Mental & Emotional', 'Dating anxiety, self-worth, healing', 'All users', '🧠'),
('Wiviy (Dating)', 'Safety & Red Flags', 'Spotting red flags, safe meetups', 'All users', '🛡️'),
('Wiviy (Dating)', 'For Singles', 'Self-improvement, embracing single life', 'Single users', '🙋')
ON CONFLICT (group_name, category_name) DO NOTHING;

-- SEED INITIAL RENTIT CATEGORIES
INSERT INTO blog_categories (group_name, category_name, topic_ideas, target_audience, icon) VALUES
('RentIt (Rentals)', 'Trending', 'Market trends, rental hotspots', 'All renters & landlords', '📈'),
('RentIt (Rentals)', 'PGs', 'PG rules, safety tips, PG vs hostel', 'Students & young professionals', '🏠'),
('RentIt (Rentals)', 'Flatmates', 'Finding flatmates, splitting bills', 'Young adults, students', '👥'),
('RentIt (Rentals)', 'Apartments', 'Lease tips, furnished vs unfurnished', 'Families, professionals', '🏢'),
('RentIt (Rentals)', 'Commercials', 'Office rentals, co-working spaces', 'Entrepreneurs, SMBs', '💼'),
('RentIt (Rentals)', 'Localities', 'Neighborhood guides, locality comparisons', 'Relocating tenants', '📍'),
('RentIt (Rentals)', 'Rental Tips', 'Negotiation, hidden charges, tenant rights', 'First-time renters', '💡'),
('RentIt (Rentals)', 'Landlord Corner', 'Tenant screening, legal compliance', 'Property owners', '👨‍💼'),
('RentIt (Rentals)', 'City Guides', 'Best areas by budget', 'New city movers', '🗺️'),
('RentIt (Rentals)', 'Legal & Docs', 'Rent agreements, police verification', 'All users', '📄')
ON CONFLICT (group_name, category_name) DO NOTHING;
