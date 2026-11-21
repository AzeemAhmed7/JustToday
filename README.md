# JustToday

A colorful daily planner for Class 11 and 12. Every task requires a Gemini-generated quiz with 10 MCQs: 3 easy, 4 moderate, and 3 hard.

## Gemini quiz setup

In Vercel, open **Project → Settings → Environment Variables** and add:

```text
GEMINI_API_KEY=your_Google_AI_Studio_API_key
```

Do not use a `VITE_` prefix. Select Production (and Preview if desired), save, and redeploy the latest deployment. The API key must be a valid Google AI Studio Gemini key with the Generative Language API enabled and available quota. The app now reports specific provider errors (invalid key/access, quota, model, or server error) instead of hiding them behind one generic message. Keep the key secret; never paste it into frontend code or public chat.

## Deployment

Vercel automatically deploys commits pushed to the connected GitHub repository. To run locally:

```bash
npm install
npm run dev
```

The Gemini endpoint is a Vercel serverless function. For full local API testing use `npx vercel dev` with `GEMINI_API_KEY` set in the local environment.
