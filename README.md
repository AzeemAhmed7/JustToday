# JustToday

A daily school planner for Class 11 and 12 students with editable packing lists and time blocks. Each task is marked complete only after its required Gemini-generated MCQ quiz is finished. Completing at least 85% of tasks earns the day's streak and triggers a short celebration. Perfect quiz scores earn a streak saver that automatically protects a missed day.

## Run the interface locally

```bash
npm install
npm run dev
```

The Gemini endpoint is a Vercel serverless function (`/api/quiz`). For local Gemini testing, add `GEMINI_API_KEY` to your Vercel environment and run `npx vercel dev`; plain `vite dev` does not run Vercel API routes.

## Deploy

Import `AzeemAhmed7/JustToday` from GitHub in Vercel. Use the Vite preset, build command `npm run build`, and output directory `dist`. Add this server-side environment variable in Vercel Project Settings, then redeploy:

```text
GEMINI_API_KEY=your_Gemini_API_key
```

Do not use the `VITE_` prefix; this secret must not be exposed in browser code. Quiz interaction requires a valid Gemini API key and quota. Tasks remain incomplete if Gemini quiz generation fails.
