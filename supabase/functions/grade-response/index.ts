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
    const { question, correctAnswer, userAnswer } = body;

    if (!question || !correctAnswer || !userAnswer) {
      return json({ error: 'question, correctAnswer, and userAnswer are required' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return json({ error: 'OpenAI API key not configured' }, 500);
    }

    const prompt = `You are grading a short-response answer on a test.

Question: ${question}
Model Answer: ${correctAnswer}
Student Answer: ${userAnswer}

Grade the student's answer on a scale of 0 to 10 based on accuracy, completeness, and understanding.
- 10: Perfect or near-perfect answer
- 7-9: Good understanding with minor omissions
- 4-6: Partial understanding, some key points missing
- 1-3: Mostly incorrect but shows some effort
- 0: Completely wrong or irrelevant

Return a JSON object with this exact schema:
{
  "score": <number 0-10>,
  "maxScore": 10,
  "feedback": "<brief 1-2 sentence feedback explaining the grade>"
}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a fair and constructive test grader. Return valid JSON only.',
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

    let parsed: { score: number; maxScore: number; feedback: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: 'Failed to parse grading response' }, 502);
    }

    return json({
      score: Math.max(0, Math.min(10, Math.round(parsed.score))),
      maxScore: 10,
      feedback: parsed.feedback || 'No feedback available.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Grading failed';
    return json({ error: message }, 500);
  }
});
