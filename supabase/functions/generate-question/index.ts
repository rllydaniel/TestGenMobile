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
    const {
      subject,
      topics = [],
      count = 10,
      difficulty = 'mixed',
      questionTypeInstruction,
      maxTokens = 4000,
    } = body;

    if (!subject) {
      return json({ error: 'subject is required' }, 400);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return json({ error: 'OpenAI API key not configured' }, 500);
    }

    const prompt = buildPrompt({ subject, topics, difficulty, count, questionTypeInstruction });

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an expert test-prep question writer. Return valid JSON only, matching the schema provided.',
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

    let parsed: { questions: Question[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: 'Failed to parse questions from OpenAI response' }, 502);
    }

    if (!Array.isArray(parsed.questions)) {
      return json({ error: 'Invalid question format returned' }, 502);
    }

    return json({ questions: parsed.questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return json({ error: message }, 500);
  }
});

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'short-response';
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

function buildPrompt({
  subject,
  topics,
  difficulty,
  count,
  questionTypeInstruction,
}: {
  subject: string;
  topics: string[];
  difficulty: string;
  count: number;
  questionTypeInstruction?: string;
}) {
  const topicStr = topics.length > 0 ? ` covering topics: ${topics.join(', ')}` : '';
  const typeInstructions = questionTypeInstruction ??
    'Generate multiple choice questions only. Include a mix of standard MCQ (4 options A/B/C/D) and True/False.';

  return `Generate ${count} practice test questions for ${subject}${topicStr} at ${difficulty} difficulty.

${typeInstructions}

Return a JSON object with this exact schema:
{
  "questions": [
    {
      "id": "unique-id",
      "text": "Question text here",
      "type": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this answer is correct",
      "difficulty": "${difficulty}",
      "topic": "topic name"
    }
  ]
}

Rules:
- "text" is the question text
- "type" is either "multiple-choice" or "short-response"
- For multiple-choice: "options" has 2-4 choices, "correctAnswer" is the EXACT TEXT of the correct option (not an index)
- For short-response: "options" is [] and "correctAnswer" is a model answer (1-3 sentences)
- For True/False questions: "options" is exactly ["True", "False"] and type is "multiple-choice"
- Questions should reflect real ${subject} exam content at ${difficulty} difficulty
- Explanations should be concise but educational`;
}
