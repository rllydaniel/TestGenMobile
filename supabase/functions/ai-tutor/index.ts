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
    const { message, history = [], subject, unit, context } = body;

    if (!message) {
      return json({ error: 'message is required' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return json({ error: 'OPENAI_API_KEY not configured' }, 500);
    }

    const subjectContext = subject
      ? `The student is studying ${subject}${unit ? ` — specifically the unit: ${unit}` : ''}.`
      : '';

    const extraContext = context
      ? `Additional context from the study guide they are reading:\n${context}`
      : '';

    const systemPrompt = `You are a professional, knowledgeable tutor. You help students understand concepts clearly and build confidence in their learning.

${subjectContext}
${extraContext}

Guidelines:
- Be concise but thorough — explain concepts clearly without being verbose
- Use LaTeX for math: $...$ for inline, $$...$$ for display math
- Use **bold** for key terms
- Give examples when they help clarify concepts
- If a student is confused, try a different explanation angle
- Be encouraging but professional — avoid being overly enthusiastic
- If asked to quiz, create focused practice questions
- Keep responses under 300 words unless the topic requires more detail`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 2000,
        messages,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[ai-tutor] OpenAI error:', errText);
      return json({ error: 'Failed to get tutor response' }, 502);
    }

    const openaiData = await openaiRes.json();
    const response = openaiData.choices?.[0]?.message?.content;

    if (!response) {
      return json({ error: 'Empty response from AI' }, 502);
    }

    return json({ response });
  } catch (err) {
    console.error('[ai-tutor] Error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
