# JustToday

A daily school planner for Class 11 and 12 students. Each task is locked as complete only after the student finishes its required Gemini-generated multiple-choice quiz.

## Run the interface locally

```bash
npm install
npm run dev
```

The Gemini endpoint is a Vercel serverless function (`/api/quiz`). For local testing of that endpoint, use Vercel CLI (`npx vercel dev`) after setting `GEMINI_API_KEY` in your local Vercel environment. Plain `vite dev` serves the UI but does not execute Vercel API routes.

## Deploy on Vercel

Import `AzeemAhmed7/JustToday` from GitHub. Use the Vite preset, build command `npm run build`, output directory `dist`.

In Vercel → Project → Settings → Environment Variables, create:

```text
GEMINI_API_KEY=your_Gemini_API_key
```

Do not use the `VITE_` prefix: the key is used only by the serverless function and must not be exposed in browser code. Redeploy after adding it. Every task needs its own generated MCQ quiz; if Gemini cannot generate one, the task stays incomplete and the app offers a retry.
