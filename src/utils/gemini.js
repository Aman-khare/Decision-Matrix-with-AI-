// ──────────────────────────────────────────
// Gemini API utility
// ──────────────────────────────────────────

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

/**
 * Extract JSON from a Gemini response that may be wrapped in markdown code fences.
 * Handles: raw JSON, ```json ... ```, ``` ... ```, or inline {}.
 */
function extractJSON(text) {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  // Fall back to the first {...} block
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    return objMatch[0];
  }
  return null;
}

/**
 * Call Gemini with a prompt, return the text response.
 */
export async function callGemini(apiKey, model, prompt) {
  let res;
  try {
    const url = `${GEMINI_API_BASE}${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });
  } catch (networkErr) {
    throw new Error('Network error — check your internet connection and try again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `API error (status ${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini. Please try again.');
  return text;
}

/**
 * Ask Gemini to generate a decision matrix JSON from a user's description.
 * Returns { options, criteria, scores }
 */
export async function generateMatrix(apiKey, model, description) {
  const prompt = `You are a decision-making expert. The user wants to compare the following options/decision:

"${description}"

Generate a weighted decision matrix for this. You must return ONLY valid JSON (no markdown, no explanation).

Return this exact structure:
{
  "options": [
    { "id": "o1", "name": "Option A" },
    { "id": "o2", "name": "Option B" }
  ],
  "criteria": [
    { "id": "c1", "name": "Cost", "weight": 30 },
    { "id": "c2", "name": "Quality", "weight": 40 },
    { "id": "c3", "name": "Time", "weight": 30 }
  ],
  "scores": {
    "o1_c1": 7,
    "o1_c2": 8,
    "o2_c1": 5,
    "o2_c2": 9
  }
}

Rules:
- Generate 3-6 realistic, relevant options based on the user's decision
- Generate 4-7 meaningful criteria relevant to the decision type
- Weights must sum to exactly 100
- Scores must be integers between 1 and 10
- Be thoughtful and realistic with scores
- Return ONLY the JSON object, nothing else`;

  const text = await callGemini(apiKey, model, prompt);

  const jsonStr = extractJSON(text);
  if (!jsonStr) throw new Error('Could not find JSON in the AI response. Please try again.');

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('AI returned malformed JSON. Please try again.');
  }

  // Validate shape
  if (!Array.isArray(parsed.options) || !Array.isArray(parsed.criteria) || typeof parsed.scores !== 'object') {
    throw new Error('AI returned an unexpected data shape. Please try again.');
  }

  return parsed;
}

/**
 * Ask Gemini to argue for and against the winning option.
 * Returns { forPoints, againstPoints, verdict }
 */
export async function generateDebate(apiKey, model, matrix) {
  const { options, criteria, scores, winner } = matrix;

  // Build a readable summary
  const summary = options.map((opt) => {
    const total = criteria.reduce((sum, cr) => {
      const raw = scores[`${opt.id}_${cr.id}`] ?? 0;
      return sum + (raw * cr.weight) / 100;
    }, 0);
    return `${opt.name}: ${total.toFixed(2)} (weighted total)`;
  });

  const winnerName = options.find((o) => o.id === winner)?.name ?? 'the winner';

  const criInfo = criteria
    .map((c) => `${c.name} (weight: ${c.weight}%)`)
    .join(', ');

  const scoreLines = options.map((opt) =>
    criteria
      .map((cr) => `${opt.name} / ${cr.name}: ${scores[`${opt.id}_${cr.id}`] ?? '-'}`)
      .join(', ')
  );

  const prompt = `You are a critical decision analyst. A user ran a weighted decision matrix with the following results:

Options compared: ${options.map((o) => o.name).join(', ')}
Criteria (and weights): ${criInfo}

Individual scores (1-10):
${scoreLines.join('\n')}

Final weighted scores:
${summary.join('\n')}

The analysis selected: "${winnerName}" as the best choice.

Now argue BOTH sides in a balanced, insightful way. Return ONLY valid JSON:
{
  "forPoints": [
    "Point 1 arguing FOR this choice",
    "Point 2 arguing FOR this choice",
    "Point 3 arguing FOR this choice"
  ],
  "againstPoints": [
    "Point 1 arguing AGAINST this choice",
    "Point 2 arguing AGAINST this choice",
    "Point 3 arguing AGAINST this choice"
  ],
  "verdict": "A 2-3 sentence nuanced final verdict that acknowledges trade-offs but gives a clear recommendation."
}

Be specific, insightful, and reference the actual criteria and scores. Return ONLY the JSON.`;

  const text = await callGemini(apiKey, model, prompt);

  const jsonStr = extractJSON(text);
  if (!jsonStr) throw new Error('Could not parse debate response. Please retry.');

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('AI returned malformed debate JSON. Please retry.');
  }

  // Validate shape — ensure arrays exist
  return {
    forPoints: Array.isArray(parsed.forPoints) ? parsed.forPoints : [],
    againstPoints: Array.isArray(parsed.againstPoints) ? parsed.againstPoints : [],
    verdict: typeof parsed.verdict === 'string' ? parsed.verdict : '',
  };
}
