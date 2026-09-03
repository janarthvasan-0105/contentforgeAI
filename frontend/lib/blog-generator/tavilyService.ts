import axios from 'axios';

const TAVILY_API_KEY = process.env.NEXT_PUBLIC_BLOG_GEN_TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

const researchCache = new Map();

export const callTavily = async (query: string) => {
    if (researchCache.has(query)) {
        console.log(`[Tavily] Using cached research for: ${query}`);
        return researchCache.get(query);
    }

    if (!TAVILY_API_KEY || TAVILY_API_KEY === 'your_tavily_key') {
        console.warn("Tavily API Key is missing. Returning placeholder data.");
        return { results: [{ title: 'Placeholder Search Result', url: 'https://placeholder.com', content: 'This is a placeholder for research data.' }] };
    }

    try {
        const response = await axios.post(TAVILY_API_URL, {
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: 'advanced',
            include_answer: true,
            max_results: 5
        });
        researchCache.set(query, response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error calling Tavily API:', error);
        throw new Error(error.response?.data?.error || 'Failed to call Tavily API');
    }
};
