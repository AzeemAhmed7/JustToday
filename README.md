# JustToday

A focused daily planner for Class 11 and 12 students.

## Features

- Daily school schedule and physical-book checklist
- Priority-ordered tasks with midnight deadlines
- Editable subject time blocks
- Persistent completion reminders
- Gemini-generated quizzes and flashcards
- Supabase email/password and Google authentication
- Study streaks and end-of-week reflection

## Development

```bash
npm install
npm run dev
```

## Environment variables

Create `.env.local` with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```
