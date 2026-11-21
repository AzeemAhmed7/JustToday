# JustToday

A daily planner for Class 11 and 12 students: school packing checklist, lessons, editable focus blocks, task quizzes, and streak tracking.

## Run the UI

```bash
npm install
npm run dev
```

The app stores demo planner data in this browser's local storage. Time blocks and books can be added, removed, and edited in the UI. On a new calendar day, streak progress is evaluated: complete at least 85% of tasks to advance the streak. A perfect score on a task's Gemini quiz earns one streak saver; if the 85% target is missed, a saved streak saver preserves the streak once. Without one, it resets to day 1.

## Gemini quizzes

Every task can only be completed by finishing its required, task-specific Gemini multiple-choice quiz. A perfect quiz earns a streak saver. The quiz API is a Vercel serverless function; the Gemini API key stays on the server.

In Vercel Project Settings → Environment Variables, add:

```text
GEMINI_API_KEY=your_Gemini_API_key
```

Redeploy after setting the key. For local API route testing, run with Vercel CLI (`npx vercel dev`) and set the same server-only environment variable. Plain `npm run dev` starts the Vite UI but does not execute Vercel API functions.
