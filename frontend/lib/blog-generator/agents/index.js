import { callGroq } from '@/lib/blog-generator/groqService';
import { callTavily } from '@/lib/blog-generator/tavilyService';
import { blogGenSupabase as supabase } from '@/lib/blog-generator/supabase-client';

export const runResearchAgent = async (topic) => {
    console.log(`[Research Agent] Running for topic: ${topic}`);
    const result = await callTavily(topic);
    return result;
};

export const generateSingleBlogAgent = async ({ topic, length, tone, audience, seoLevel, contentElements, researchData, maxTokens }) => {
    console.log(`[Blog Generation Agent] Generating blog for: ${topic}`);
    const systemPrompt = `You are an expert AI Blog Writer, SEO specialist, and Content Strategist.
Generate a high-quality, unique blog post and return it strictly as a valid JSON object.
Do NOT output any markdown blocks (like \`\`\`json) or conversational filler outside the JSON object.

The JSON MUST conform to the following structure:
{
  "title": "Your SEO Title",
  "metaDescription": "A brief meta description",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "featuredImage": { "mode": "generated", "url": "", "alt": "A descriptive alt text for the featured image" },
  "sections": [
    {
      "heading": "Section Heading",
      "body": "Markdown content for this section. May include lists, bold text, etc."
    }
  ]
}

Instructions:
- Target Audience: ${audience}
- Tone: ${tone}
- SEO Strategy Level: ${seoLevel}
- Ensure the blog length corresponds to: ${length}.
- Maintain high linguistic quality, natural phrasing, and human-like flow.
- Make sure every execution creates a completely unique piece of content even for the same topic.
${contentElements?.length > 0 ? `- Incorporate special sections at the end as separate sections: ${contentElements.join(', ')}.` : ''}

Return ONLY valid JSON.`;

    const userPrompt = `Topic: ${topic}\nResearch Data: ${JSON.stringify(researchData)}`;

    const response = await callGroq(systemPrompt, userPrompt, 'qwen/qwen3.8-27b', maxTokens, true);
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

    const response = await callGroq(systemPrompt, userPrompt, 'qwen/qwen3.8-27b', 2000);

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
