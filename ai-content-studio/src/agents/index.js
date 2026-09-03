import { callGroq } from '../services/groqService';
import { callTavily } from '../services/tavilyService';
import { supabase } from '../supabase/client';

export const runResearchAgent = async (topic) => {
    console.log(`[Research Agent] Running for topic: ${topic}`);
    const result = await callTavily(topic);
    return result;
};

export const generateSingleBlogAgent = async ({ topic, length, tone, audience, seoLevel, contentElements, researchData, maxTokens }) => {
    console.log(`[Blog Generation Agent] Generating blog for: ${topic}`);
    const systemPrompt = `You are an expert AI Blog Writer, SEO specialist, and Content Strategist.
Generate a high-quality, unique blog post formatted entirely in Markdown.
Do not output JSON. Do not output any conversational filler outside the blog content.

Include the following in your Markdown output:
1. An SEO Title as an H1 heading at the very beginning (e.g. # Your Title)
2. A brief metadata block (Meta Description, Keywords) below the title.
3. The full, structured blog content.
${contentElements?.length > 0 ? `4. Incorporate special sections at the end: ${contentElements.join(', ')}.` : ''}

Instructions:
- Target Audience: ${audience}
- Tone: ${tone}
- SEO Strategy Level: ${seoLevel}
- Ensure the blog length corresponds to: ${length}.
- Maintain high linguistic quality, natural phrasing, and human-like flow.
- Make sure every execution creates a completely unique piece of content even for the same topic.`;

    const userPrompt = `Topic: ${topic}\nResearch Data: ${JSON.stringify(researchData)}`;

    const response = await callGroq(systemPrompt, userPrompt, 'llama-3.1-8b-instant', maxTokens);
    return response;
};

export const generateBulkTopics = async (category, count, existingTopics = []) => {
    console.log(`[Bulk Topics Agent] Generating ${count} topics for category: ${category}`);
    const cleanCategory = category.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();

    let brand = 'Huzzler';
    let brandDesc = 'freelancing and gig-economy platform';
    let targetNiche = cleanCategory;
    let topicIdeas = '';
    let targetAudience = '';

    if (cleanCategory.includes(' - ')) {
        const parts = cleanCategory.split(' - ');
        brand = parts[0].trim();
        targetNiche = parts.slice(1).join(' - ').trim();
        
        if (brand === 'Wiviy') {
            brandDesc = 'dating and relationships app';
        } else if (brand === 'RentIt') {
            brandDesc = 'house renting, roommate finding, and property listing platform';
        } else {
            brandDesc = `${brand} platform`;
        }
    }

    // Try to fetch additional context from database
    try {
        const { data } = await supabase
            .from('blog_categories')
            .select('topic_ideas, target_audience')
            .eq('category_name', targetNiche)
            .ilike('group_name', `%${brand}%`)
            .maybeSingle();
            
        if (data) {
            if (data.topic_ideas) topicIdeas = data.topic_ideas;
            if (data.target_audience) targetAudience = data.target_audience;
        }
    } catch (e) {
        console.warn('[Bulk Topics Agent] Could not fetch category details from DB:', e);
    }

    const systemPrompt = `You are a creative blog topic generator specializing in the "${targetNiche}" niche for ${brand === 'Huzzler' ? 'a' : 'the'} ${brandDesc} called ${brand}.
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${topicIdeas ? `Topic Ideas/Context to inspire you: ${topicIdeas}` : ''}
Generate exactly ${count} unique, specific, and engaging blog post topics.
Return ONLY a JSON array of strings. No explanation, no numbering, no markdown.
Example output: ["Topic 1", "Topic 2", "Topic 3"]

Rules:
- Each topic must be unique and different from each other.
- Each topic must be specific enough to write a full blog about.
- Topics should be SEO-friendly and compelling.
- Do NOT repeat any of these already-used topics: ${existingTopics.length > 0 ? existingTopics.join(', ') : 'None'}`;

    const userPrompt = `Generate ${count} unique blog topics for the "${targetNiche}" category.`;

    const response = await callGroq(systemPrompt, userPrompt, 'llama-3.1-8b-instant', 2000);

    try {
        // Extract JSON array from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const topics = JSON.parse(jsonMatch[0]);
            return topics.filter(t => typeof t === 'string' && t.trim().length > 0).slice(0, count);
        }
    } catch (e) {
        console.warn('[Bulk Topics Agent] Failed to parse JSON, falling back to line split:', e);
    }

    // Fallback: split by newlines and clean up
    return response
        .split('\n')
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^["'-]\s*/, '').replace(/["']$/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, count);
};
