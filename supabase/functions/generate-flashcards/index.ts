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
    const { subject, topics = [], count = 10 } = body;

    if (!subject) {
      return json({ error: 'subject is required' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return json({ error: 'OpenAI API key not configured' }, 500);
    }

    const topicStr = topics.length > 0 ? ` focusing on: ${topics.join(', ')}` : '';
    const prompt = `Generate ${count} study flashcards for ${subject}${topicStr}.

Return a JSON object with this exact schema:
{
  "flashcards": [
    {
      "id": "unique-id",
      "front": "Question or prompt on the front of the card",
      "back": "Answer or explanation on the back of the card"
    }
  ]
}

Rules:
- Each flashcard should test a distinct concept
- Use varied question styles: definitions, fill-in-the-blank, "what is", comparisons, cause/effect
- Front should be concise and specific
- Back should be a clear, complete answer (1-3 sentences)
- Cover key terms, formulas, processes, and relationships
- Difficulty should range from foundational to intermediate`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator creating study flashcards. Return valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => 'unknown error');
      return json({ error: `OpenAI request failed: ${errText}` }, 502);
    }

    const openaiData = await openaiRes.json();
    const raw = openaiData.choices?.[0]?.message?.content;

    if (!raw) {
      return json({ error: 'Empty response from OpenAI' }, 502);
    }

    let parsed: { flashcards: { id: string; front: string; back: string }[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: 'Failed to parse flashcards from OpenAI response' }, 502);
    }

    if (!Array.isArray(parsed.flashcards)) {
      return json({ error: 'Invalid flashcard format returned' }, 502);
    }

    return json({ flashcards: parsed.flashcards });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return json({ error: message }, 500);
  }
});
