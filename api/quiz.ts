type Difficulty = 'easy' | 'moderate' | 'hard'
type Question = { question: string; options: string[]; answer: number; explanation: string; difficulty: Difficulty }

function send(res: any, status: number, payload: Record<string, unknown>) {
  return res.status(status).json(payload)
}

function parseJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(cleaned)
}

function isQuestion(value: any): value is Question {
  return value && typeof value.question === 'string' && Array.isArray(value.options) && value.options.length === 4 &&
    value.options.every((option: unknown) => typeof option === 'string') && Number.isInteger(value.answer) &&
    value.answer >= 0 && value.answer < 4 && typeof value.explanation === 'string' &&
    ['easy', 'moderate', 'hard'].includes(value.difficulty)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST to generate a quiz.' })
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return send(res, 503, { error: 'Gemini API key is missing. In Vercel, add GEMINI_API_KEY (without a VITE_ prefix) under Project → Settings → Environment Variables, then redeploy.' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const task = body?.task
    if (!task || typeof task.title !== 'string' || typeof task.subject !== 'string') return send(res, 400, { error: 'A task title and subject are required to make its quiz.' })

    const prompt = `Create exactly 10 distinct multiple-choice questions for an Indian Class 11/12 student, testing the completed task below. Task: ${task.title}. Subject and topic: ${task.subject}. Difficulty distribution: exactly 3 easy, exactly 4 moderate, and exactly 3 hard questions. All questions must be directly relevant to the task. Each question must have exactly four answer options and exactly one correct option. Return only JSON in this shape: {"questions":[{"question":"...","options":["A","B","C","D"],"answer":0,"explanation":"...","difficulty":"easy"}]}. answer is the zero-based correct option index. difficulty must be exactly easy, moderate, or hard. Include concise explanations. No markdown.`
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`
    const geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 8192 },
      }),
    })
    const payload = await geminiResponse.json() as any
    if (!geminiResponse.ok) {
      const providerMessage = String(payload?.error?.message || '')
      const status = geminiResponse.status
      console.error('Gemini API rejected quiz request:', status, providerMessage)
      if (status === 400 || status === 401 || status === 403) return send(res, 502, { error: `Gemini rejected the API key or request (${status}). Verify that GEMINI_API_KEY is a valid Gemini API key with Generative Language API access. ${providerMessage}` })
      if (status === 404) return send(res, 502, { error: `Gemini model endpoint was not found. Check model availability for this API key. ${providerMessage}` })
      if (status === 429) return send(res, 502, { error: `Gemini quota or rate limit reached. Check the API project's quota/billing and try again later. ${providerMessage}` })
      return send(res, 502, { error: `Gemini API request failed (${status}). ${providerMessage || 'Please try again.'}` })
    }

    const text = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || ''
    if (!text) {
      const reason = payload?.candidates?.[0]?.finishReason
      return send(res, 502, { error: `Gemini returned no quiz text${reason ? ` (finish reason: ${reason})` : ''}. Please retry.` })
    }
    let parsed: any
    try { parsed = parseJson(text) } catch {
      console.error('Gemini quiz returned invalid JSON:', text.slice(0, 1000))
      return send(res, 502, { error: 'Gemini returned an unreadable quiz. Please retry.' })
    }
    const questions = Array.isArray(parsed.questions) ? parsed.questions.filter(isQuestion) : []
    const counts = questions.reduce((acc: Record<Difficulty, number>, question: Question) => { acc[question.difficulty] += 1; return acc }, { easy: 0, moderate: 0, hard: 0 })
    if (questions.length !== 10 || counts.easy !== 3 || counts.moderate !== 4 || counts.hard !== 3) {
      console.error('Gemini quiz structure or difficulty distribution invalid:', { total: questions.length, counts })
      return send(res, 502, { error: 'Gemini did not return 10 valid questions with the requested 3 easy, 4 moderate, and 3 hard split. Retry to generate a new quiz.' })
    }
    return send(res, 200, { questions })
  } catch (error) {
    console.error('Gemini quiz handler error:', error)
    return send(res, 500, { error: 'The quiz service encountered an internal error. Check Vercel → Deployments → Functions logs for details, then retry.' })
  }
}
