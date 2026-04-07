const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { subject, unit, topics = [] } = body;

    if (!subject) {
      return json({ error: 'subject is required' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return json({ error: 'OPENAI_API_KEY not configured' }, 500);
    }

    const unitContext = unit ? `Focus specifically on the unit: "${unit}".` : '';
    const topicContext = topics.length > 0 ? `Cover these topics: ${topics.join(', ')}.` : '';

    const systemPrompt = `You are an expert educator and study guide author. Create comprehensive, well-structured study guides that help students master material for exams.

Your study guides should:
- Be thorough but scannable with clear section breaks
- Use LaTeX for ALL math notation: $...$ for inline math, $$...$$ for display math
- Always use $\\frac{a}{b}$ for fractions, $x^2$ for exponents, $\\sqrt{x}$ for roots
- Use **bold** for key terms and important concepts
- Use markdown tables where comparing concepts or listing properties
- Include practical tips, mnemonics, and exam strategies
- Structure content progressively from fundamentals to advanced concepts
- Include "Key Formula" callout boxes for important equations
- Include "Study Tip" callout boxes for effective study strategies

Return valid JSON only.`;

    const userPrompt = `Create a comprehensive study guide for: ${subject}
${unitContext}
${topicContext}

Return a JSON object with this exact structure:
{
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "content": "Main content with **bold terms**, $LaTeX math$, markdown tables, bullet points, and detailed explanations. Use $$display math$$ for important equations.",
      "callout": "Optional study tip or key insight (null if none)",
      "keyTerms": ["term1", "term2"]
    }
  ]
}

Create 5-7 detailed sections. Each section's content should be 200-400 words with rich formatting. Include at least 2 sections with markdown tables comparing concepts. For math/science subjects, include key formulas in LaTeX. Make it comprehensive enough to serve as a standalone study resource.`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[generate-study-guide] OpenAI error:', errText);
      return json({ error: 'Failed to generate study guide' }, 502);
    }

    const openaiData = await openaiRes.json();
    const raw = openaiData.choices?.[0]?.message?.content;

    if (!raw) {
      return json({ error: 'Empty response from AI' }, 502);
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.sections)) {
      return json({ error: 'Invalid response structure' }, 502);
    }

    return json({ sections: parsed.sections });
  } catch (err) {
    console.error('[generate-study-guide] Error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
