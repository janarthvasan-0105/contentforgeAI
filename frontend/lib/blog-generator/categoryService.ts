import { blogGenSupabase as supabase } from './supabase-client';

export const DEFAULT_CATEGORIES = [
    // Huzzler
    { group_name: "Huzzler (Freelancing)", category_name: "Trends", topic_ideas: "Market forecasts, industry shifts, new gig economies", target_audience: "All freelancers", icon: "📈" },
    { group_name: "Huzzler (Freelancing)", category_name: "Freelancers", topic_ideas: "Client communication, tax planning, building a portfolio", target_audience: "All freelancers", icon: "💼" },
    { group_name: "Huzzler (Freelancing)", category_name: "Clients", topic_ideas: "How to hire top talent, writing clear job specs", target_audience: "Hiring clients", icon: "🤝" },
    { group_name: "Huzzler (Freelancing)", category_name: "Started", topic_ideas: "First gig guide, platform settings, profile optimization", target_audience: "New freelancers", icon: "🚀" },
    { group_name: "Huzzler (Freelancing)", category_name: "Earnings & Finance", topic_ideas: "Pricing strategy, invoicing tips, saving for taxes", target_audience: "All freelancers", icon: "💸" },
    { group_name: "Huzzler (Freelancing)", category_name: "Tools & Productivity", topic_ideas: "Project management apps, time trackers, focus habits", target_audience: "All freelancers", icon: "🛠️" },
    { group_name: "Huzzler (Freelancing)", category_name: "Marketing Yourself", topic_ideas: "Personal branding, LinkedIn tips, cold emailing", target_audience: "All freelancers", icon: "📣" },
    { group_name: "Huzzler (Freelancing)", category_name: "Success Stories", topic_ideas: "Interviews with top earners, business scaling examples", target_audience: "All freelancers", icon: "⭐" },
    { group_name: "Huzzler (Freelancing)", category_name: "Safety & Trust", topic_ideas: "Avoiding scam clients, safe payments, contracts", target_audience: "All freelancers", icon: "🔐" },
    { group_name: "Huzzler (Freelancing)", category_name: "Remote Work", topic_ideas: "Home office setups, digital nomad visas, work-life balance", target_audience: "All freelancers", icon: "🌐" },
    // Wiviy
    { group_name: "Wiviy (Dating)", category_name: "Dating Tips", topic_ideas: "First message ideas, profile do's & don'ts, conversation starters", target_audience: "All users", icon: "💬" },
    { group_name: "Wiviy (Dating)", category_name: "Profile & Looks", topic_ideas: "Writing a bio that works, best photos, standing out", target_audience: "New users", icon: "📸" },
    { group_name: "Wiviy (Dating)", category_name: "Trending", topic_ideas: "Dating culture news, viral trends, modern relationship norms", target_audience: "All users", icon: "🔥" },
    { group_name: "Wiviy (Dating)", category_name: "Relationships", topic_ideas: "Building connections, long-distance tips", target_audience: "Serious daters", icon: "💑" },
    { group_name: "Wiviy (Dating)", category_name: "Local Dating", topic_ideas: "City-specific date ideas, local events", target_audience: "Location-based users", icon: "📍" },
    { group_name: "Wiviy (Dating)", category_name: "Mental & Emotional", topic_ideas: "Dating anxiety, self-worth, healing", target_audience: "All users", icon: "🧠" },
    { group_name: "Wiviy (Dating)", category_name: "Safety & Red Flags", topic_ideas: "Spotting red flags, safe meetups", target_audience: "All users", icon: "🛡️" },
    { group_name: "Wiviy (Dating)", category_name: "For Singles", topic_ideas: "Self-improvement, embracing single life", target_audience: "Single users", icon: "🙋" },
    // RentIt
    { group_name: "RentIt (Rentals)", category_name: "Trending", topic_ideas: "Market trends, rental hotspots", target_audience: "All renters & landlords", icon: "📈" },
    { group_name: "RentIt (Rentals)", category_name: "PGs", topic_ideas: "PG rules, safety tips, PG vs hostel", target_audience: "Students & young professionals", icon: "🏠" },
    { group_name: "RentIt (Rentals)", category_name: "Flatmates", topic_ideas: "Finding flatmates, splitting bills", target_audience: "Young adults, students", icon: "👥" },
    { group_name: "RentIt (Rentals)", category_name: "Apartments", topic_ideas: "Lease tips, furnished vs unfurnished", target_audience: "Families, professionals", icon: "🏢" },
    { group_name: "RentIt (Rentals)", category_name: "Commercials", topic_ideas: "Office rentals, co-working spaces", target_audience: "Entrepreneurs, SMBs", icon: "💼" },
    { group_name: "RentIt (Rentals)", category_name: "Localities", topic_ideas: "Neighborhood guides, locality comparisons", target_audience: "Relocating tenants", icon: "📍" },
    { group_name: "RentIt (Rentals)", category_name: "Rental Tips", topic_ideas: "Negotiation, hidden charges, tenant rights", target_audience: "First-time renters", icon: "💡" },
    { group_name: "RentIt (Rentals)", category_name: "Landlord Corner", topic_ideas: "Tenant screening, legal compliance", target_audience: "Property owners", icon: "👨‍💼" },
    { group_name: "RentIt (Rentals)", category_name: "City Guides", topic_ideas: "Best areas by budget", target_audience: "New city movers", icon: "🗺️" },
    { group_name: "RentIt (Rentals)", category_name: "Legal & Docs", topic_ideas: "Rent agreements, police verification", target_audience: "All users", icon: "📄" }
];

export const getCategories = async () => {
    try {
        const { data, error } = await supabase
            .from('blog_categories')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) {
            console.warn('[Category Service] Error loading categories from DB, falling back to defaults:', error);
            return DEFAULT_CATEGORIES;
        }

        if (!data || data.length === 0) {
            console.log('[Category Service] Table is empty, seeding default categories...');
            await seedDefaultCategories();
            const { data: reloadedData } = await supabase
                .from('blog_categories')
                .select('*')
                .order('created_at', { ascending: true });
            return reloadedData && reloadedData.length > 0 ? reloadedData : DEFAULT_CATEGORIES;
        }

        return data;
    } catch (err) {
        console.error('[Category Service] Failed to retrieve categories from DB, returning defaults:', err);
        return DEFAULT_CATEGORIES;
    }
};

export const addCategory = async (categoryObj: any) => {
    const { data, error } = await supabase
        .from('blog_categories')
        .insert([categoryObj])
        .select();

    if (error) {
        throw new Error(error.message || 'Failed to add category');
    }
    return data && data.length > 0 ? data[0] : null;
};

const seedDefaultCategories = async () => {
    try {
        const { error } = await supabase
            .from('blog_categories')
            .insert(DEFAULT_CATEGORIES);
        if (error) {
            console.warn('[Category Service] Failed to seed default categories:', error);
        } else {
            console.log('[Category Service] Seeding default categories completed successfully.');
        }
    } catch (e) {
        console.warn('[Category Service] Failed to seed default categories:', e);
    }
};
