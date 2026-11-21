export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST to generate a quiz.' })
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'Gemini is not configured. Add GEMINI_API_KEY in Vercel project settings, then redeploy.' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const task = body?.task
    if (!task || typeof task.title !== 'string' || typeof task.subject !== 'string') return res.status(400).json({ error: 'A task title and subject are required.' })
    const questionCount = Math.min(5, Math.max(2, Number(body.questionCount) || 3))
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash', generationConfig: { responseMimeType: 'application/json', temperature: 0.4 } })
    const prompt = `Generate exactly ${questionCount} distinct, age-appropriate multiple-choice questions for an Indian Class 11/12 student to test understanding of the just-completed study task. Task: ${task.title}. Subject/topic: ${task.subject}. Return only valid JSON with this shape: {"questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}. Each question must have exactly four plausible options; answer is a zero-based index of the single correct option. Make questions specific to the task, with concise explanations. Do not include markdown.`
    const result = await model.generateContent(prompt)
    const parsed = JSON.parse(result.response.text())
    const questions = Array.isArray(parsed.questions) ? parsed.questions.filter((q: any) =>
      q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4 &&
      q.options.every((option: unknown) => typeof option === 'string') && Number.isInteger(q.answer) &&
      q.answer >= 0 && q.answer < 4 && typeof q.explanation === 'string'
    ).slice(0, questionCount) : []
    if (questions.length !== questionCount) return res.status(502).json({ error: 'Gemini returned an incomplete quiz. Retry to generate a complete one.' })
    return res.status(200).json({ questions })
  } catch (error) {
    console.error('Task quiz generation failed:', error)
    return res.status(502).json({ error: 'Gemini quiz generation failed. Check your API key/quota and retry.' })
  }
}
