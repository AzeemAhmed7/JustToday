import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, Check, Flame, LoaderCircle, LockKeyhole, Plus } from 'lucide-react'

type Difficulty = 'easy' | 'moderate' | 'hard'
type Task = { id: number; title: string; subject: string; priority: 'High' | 'Medium'; done: boolean }
type Question = { question: string; options: string[]; answer: number; explanation: string; difficulty: Difficulty }
type Quiz = { taskId: number; taskTitle: string; questions: Question[] }
type Book = { id: number; name: string; subject: string; bring: boolean }
type TimeBlock = { id: number; time: string; subject: string; duration: string }
type StoredProgress = { streak: number; lastStreakDate: string | null; saverCount: number; celebratedDate: string | null }

const todayKey = () => new Date().toLocaleDateString('en-CA')
const startingTasks: Task[] = [
  { id: 1, title: 'Complete Physics numericals', subject: 'Physics · Gravitation', priority: 'High', done: false },
  { id: 2, title: 'Revise Organic Chemistry reactions', subject: 'Chemistry · Organic reactions', priority: 'High', done: false },
  { id: 3, title: 'Solve 20 Maths examples', subject: 'Mathematics · Quadratic equations', priority: 'Medium', done: false },
]
const defaultBooks: Book[] = [
  { id: 1, name: 'NCERT Physics', subject: 'Physics', bring: true },
  { id: 2, name: 'Class 11 Maths', subject: 'Mathematics', bring: false },
  { id: 3, name: 'Chemistry Notebook', subject: 'Chemistry', bring: true },
]
const defaultBlocks: TimeBlock[] = [
  { id: 1, time: '16:00', subject: 'Physics', duration: '45 min' },
  { id: 2, time: '17:00', subject: 'Break', duration: '15 min' },
  { id: 3, time: '17:15', subject: 'Chemistry', duration: '60 min' },
]
const progressKey = 'justtoday-streak-progress-v1'
function loadProgress(): StoredProgress {
  const empty: StoredProgress = { streak: 0, lastStreakDate: null, saverCount: 0, celebratedDate: null }
  try {
    const saved = JSON.parse(localStorage.getItem(progressKey) || 'null') as StoredProgress | null
    if (!saved) return empty
    const today = todayKey()
    if (saved.lastStreakDate && saved.lastStreakDate !== today) {
      const daysSince = Math.floor((new Date(`${today}T00:00:00`).getTime() - new Date(`${saved.lastStreakDate}T00:00:00`).getTime()) / 86400000)
      if (daysSince > 1) {
        if (saved.saverCount > 0) return { ...saved, saverCount: saved.saverCount - 1, lastStreakDate: today, celebratedDate: null }
        return { ...empty, lastStreakDate: null }
      }
    }
    return saved
  } catch { return empty }
}

export default function App() {
  const [screen, setScreen] = useState<'today' | 'tasks' | 'streak'>('today')
  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('justtoday-tasks-v1') || 'null') || startingTasks)
  const [books, setBooks] = useState<Book[]>(() => JSON.parse(localStorage.getItem('justtoday-books-v1') || 'null') || defaultBooks)
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => JSON.parse(localStorage.getItem('justtoday-blocks-v1') || 'null') || defaultBlocks)
  const [progress, setProgress] = useState<StoredProgress>(loadProgress)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [pendingTask, setPendingTask] = useState<Task | null>(null)
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [allCorrect, setAllCorrect] = useState(true)
  const [celebrate, setCelebrate] = useState(false)
  const [reflection, setReflection] = useState(localStorage.getItem('justtoday-reflection-v1') || '')
  const [bookName, setBookName] = useState('')
  const [bookSubject, setBookSubject] = useState('')
  const [blockTime, setBlockTime] = useState('18:00')
  const [blockSubject, setBlockSubject] = useState('')
  const [blockDuration, setBlockDuration] = useState('45 min')

  const doneCount = tasks.filter(task => task.done).length
  const completionPercent = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0
  const today = todayKey()

  useEffect(() => { localStorage.setItem('justtoday-tasks-v1', JSON.stringify(tasks)) }, [tasks])
  useEffect(() => { localStorage.setItem('justtoday-books-v1', JSON.stringify(books)) }, [books])
  useEffect(() => { localStorage.setItem('justtoday-blocks-v1', JSON.stringify(blocks)) }, [blocks])
  useEffect(() => { localStorage.setItem(progressKey, JSON.stringify(progress)) }, [progress])
  const topics = useMemo(() => tasks.map(task => `${task.subject}: ${task.title}`), [tasks])

  function recordDayIfEarned(nextTasks: Task[], perfectQuiz: boolean) {
    const nextDone = nextTasks.filter(task => task.done).length
    let nextProgress = progress
    if (perfectQuiz) nextProgress = { ...nextProgress, saverCount: Math.max(nextProgress.saverCount, 1) }
    if (nextTasks.length > 0 && nextDone / nextTasks.length >= 0.85 && nextProgress.celebratedDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')
      const continues = nextProgress.lastStreakDate === yesterday || nextProgress.lastStreakDate === today
      nextProgress = { ...nextProgress, streak: continues ? nextProgress.streak + (nextProgress.lastStreakDate === today ? 0 : 1) : 1, lastStreakDate: today, celebratedDate: today }
      setCelebrate(true)
      window.setTimeout(() => setCelebrate(false), 2200)
    }
    setProgress(nextProgress)
  }

  async function beginTaskQuiz(task: Task) {
    if (task.done || loadingTaskId !== null) return
    setError(''); setPendingTask(task); setLoadingTaskId(task.id); setQuiz(null)
    try {
      const response = await fetch('/api/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: { title: task.title, subject: task.subject }, questionCount: 10 }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Quiz service failed (${response.status}).`)
      if (!Array.isArray(data.questions) || data.questions.length !== 10) throw new Error('Gemini did not return all 10 questions. Please retry.')
      setQuiz({ taskId: task.id, taskTitle: task.title, questions: data.questions })
      setQuestionIndex(0); setSelectedAnswer(null); setAnswered(false); setAllCorrect(true)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Quiz generation failed. Please retry.') }
    finally { setLoadingTaskId(null) }
  }

  function submitAnswer() {
    if (!quiz || selectedAnswer === null || answered) return
    setAllCorrect(value => value && selectedAnswer === quiz.questions[questionIndex].answer)
    setAnswered(true)
  }
  function nextQuestion() {
    if (!quiz || !answered) return
    if (questionIndex + 1 < quiz.questions.length) { setQuestionIndex(index => index + 1); setSelectedAnswer(null); setAnswered(false); return }
    const perfect = allCorrect && selectedAnswer === quiz.questions[questionIndex].answer
    const nextTasks = tasks.map(task => task.id === quiz.taskId ? { ...task, done: true } : task)
    setTasks(nextTasks); recordDayIfEarned(nextTasks, perfect); setQuiz(null); setPendingTask(null); setError('')
  }
  function retryQuiz() { if (pendingTask) void beginTaskQuiz(pendingTask) }
  function addBook(event: React.FormEvent) {
    event.preventDefault()
    if (!bookName.trim()) return
    setBooks(current => [...current, { id: Date.now(), name: bookName.trim(), subject: bookSubject.trim() || 'Other', bring: true }])
    setBookName(''); setBookSubject('')
  }
  function addBlock(event: React.FormEvent) {
    event.preventDefault()
    if (!blockSubject.trim()) return
    setBlocks(current => [...current, { id: Date.now(), time: blockTime, subject: blockSubject.trim(), duration: blockDuration }].sort((a, b) => a.time.localeCompare(b.time)))
    setBlockSubject('')
  }

  return <main className="app-shell">
    <header><div className="brand"><span>JT</span><strong>JustToday</strong></div><div className="streak"><Flame size={18}/>{progress.streak} day streak {progress.saverCount > 0 && <small className="saver-badge">· {progress.saverCount} saver</small>}</div></header>
    {screen === 'today' && <section>
      <div className="hero"><div><p>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</p><h1>Today at school</h1></div><div className="streak"><Flame size={18}/> {completionPercent}% complete</div></div>
      <div className="grid">
        <article className="card packing"><div className="card-title"><div><p>PACKING CHECKLIST</p><h2>Physical books</h2></div><BookOpen size={22}/></div>
          {books.map(book => <label className="book-row" key={book.id}><input type="checkbox" checked={book.bring} onChange={() => setBooks(current => current.map(item => item.id === book.id ? { ...item, bring: !item.bring } : item))}/><span className="custom-check"><Check size={14}/></span><span><strong>{book.name}</strong><small>{book.subject}</small></span><em className={book.bring ? '' : 'leave'}>{book.bring ? 'BRING' : 'LEAVE'}</em></label>)}
          <form className="inline-add" onSubmit={addBook}><input value={bookName} onChange={event => setBookName(event.target.value)} placeholder="Add book / notebook" aria-label="Book or notebook name" required/><input value={bookSubject} onChange={event => setBookSubject(event.target.value)} placeholder="Subject" aria-label="Book subject"/><button aria-label="Add book"><Plus size={18}/></button></form>
        </article>
        <article className="card schedule"><div className="card-title"><div><p>TODAY'S LESSONS</p><h2>School schedule</h2></div></div><div className="lesson"><time>08:00</time><div><strong>Physics</strong><span>Gravitation & escape velocity</span></div></div><div className="lesson"><time>09:00</time><div><strong>Chemistry</strong><span>Organic reactions</span></div></div><div className="lesson"><time>10:00</time><div><strong>Mathematics</strong><span>Quadratic equations</span></div></div></article>
      </div>
      <article className="card time-blocks"><div className="card-title"><div><p>FOCUS PLAN</p><h2>Time blocks</h2></div></div><div className="blocks">{blocks.map(block => <div key={block.id}><time>{new Date(`2000-01-01T${block.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time><strong>{block.subject}</strong><span>{block.duration}</span></div>)}</div><form className="block-form" onSubmit={addBlock}><label>Time<input type="time" value={blockTime} onChange={event => setBlockTime(event.target.value)} required/></label><label>Subject<input value={blockSubject} onChange={event => setBlockSubject(event.target.value)} placeholder="e.g. Biology" required/></label><label>Duration<select value={blockDuration} onChange={event => setBlockDuration(event.target.value)}><option>25 min</option><option>45 min</option><option>60 min</option><option>90 min</option></select></label><button className="add-button"><Plus size={16}/> Add time block</button></form></article>
    </section>}
    {screen === 'tasks' && <section><div className="hero"><div><p>85% COMPLETE TO EARN TODAY'S STREAK</p><h1>Today's priorities</h1></div><div className="progress-ring" style={{ '--progress': `${completionPercent * 3.6}deg` } as React.CSSProperties}>{completionPercent}%</div></div>
      <aside className="persistent-alert"><LockKeyhole size={20}/><div><strong>Every task requires its own Gemini quiz</strong><span>Complete 10 MCQs: 3 easy, 4 moderate, and 3 hard. Tasks lock when done.</span></div></aside>
      {progress.saverCount > 0 && <aside className="saver-note"><Flame size={18}/> Streak saver ready: get all 10 answers correct to earn a saver for a missed day.</aside>}
      {error && !quiz && <aside className="quiz-error" role="alert"><AlertTriangle size={19}/><span>{error}</span><button onClick={retryQuiz}>Retry quiz</button></aside>}
      <div className="task-stack">{tasks.map((task, index) => <article className={`task-card ${task.done ? 'done' : ''}`} key={task.id}><span className="task-number">0{index + 1}</span><span className="task-info"><small>{task.subject} · {task.priority} priority</small><strong>{task.title}</strong></span>{task.done ? <span className="task-completed"><Check size={17}/> Quiz passed · locked</span> : <button className="task-start" disabled={loadingTaskId !== null} onClick={() => void beginTaskQuiz(task)}>{loadingTaskId === task.id ? <><LoaderCircle className="spin" size={17}/> Generating</> : 'Complete + quiz'}</button>}</article>)}</div>
      {completionPercent >= 85 && <aside className="study-action"><Check/><div><strong>Streak earned today!</strong><span>{progress.streak} day streak is now active.</span></div></aside>}
    </section>}
    {screen === 'streak' && <section><div className="hero"><div><p>PROGRESS THAT ADDS UP</p><h1>Study streak</h1></div><div className="streak"><Flame size={18}/>{progress.streak} days</div></div><article className="card weekly"><h2>Weekly reflection</h2><p>What helped you stay consistent this week?</p><textarea value={reflection} onChange={event => { setReflection(event.target.value); localStorage.setItem('justtoday-reflection-v1', event.target.value) }} placeholder="My biggest win was..."/><p className="saver-note">Streak savers earned by getting every answer correct can protect one missed day.</p></article><article className="card"><h2>Streak saver</h2><p>{progress.saverCount ? `${progress.saverCount} saver available` : 'Get all 10 answers correct in a task quiz to earn a saver.'}</p><p className="muted">A saver is used automatically if you miss a day, keeping your streak alive. Reach 85% task completion to count the day.</p></article></section>}
    <nav><button className={screen === 'today' ? 'active' : ''} onClick={() => setScreen('today')}><BookOpen size={19}/><span>Today</span></button><button className={screen === 'tasks' ? 'active' : ''} onClick={() => setScreen('tasks')}><Check size={19}/><span>Tasks</span></button><button className={screen === 'streak' ? 'active' : ''} onClick={() => setScreen('streak')}><Flame size={19}/><span>Streak</span></button></nav>
    {celebrate && <div className="streak-celebration" role="status"><span className="confetti">✦</span><div><Flame size={30}/><strong>85% — streak kept alive!</strong><span>{progress.streak} day study streak</span></div><span className="confetti">✦</span></div>}
    {pendingTask && (quiz || error || loadingTaskId !== null) && <div className="quiz-backdrop"><section className="quiz-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-title"><div className="quiz-top"><div><p>REQUIRED · GEMINI MCQ</p><h2 id="quiz-title">{pendingTask.title}</h2></div><span className="required-chip"><LockKeyhole size={14}/> Required</span></div>
      {loadingTaskId !== null && <div className="quiz-loading"><LoaderCircle className="spin" size={30}/><strong>Gemini is preparing 10 questions…</strong><span>3 easy · 4 moderate · 3 hard. Task remains incomplete until finished.</span></div>}
      {error && <div className="quiz-failure" role="alert"><AlertTriangle/><strong>Could not generate Gemini quiz.</strong><p>{error}</p><button className="quiz-primary" onClick={retryQuiz}>Retry quiz</button></div>}
      {quiz && <><div className="quiz-progress">Question {questionIndex + 1} of {quiz.questions.length}<span className={`difficulty-chip ${quiz.questions[questionIndex].difficulty}`}>{quiz.questions[questionIndex].difficulty}</span></div><h3 className="quiz-question">{quiz.questions[questionIndex].question}</h3><div className="quiz-options">{quiz.questions[questionIndex].options.map((option, index) => <button key={`${questionIndex}-${option}`} className={`${selectedAnswer === index ? 'selected ' : ''}${answered && index === quiz.questions[questionIndex].answer ? 'correct' : ''}${answered && selectedAnswer === index && index !== quiz.questions[questionIndex].answer ? 'incorrect' : ''}`} disabled={answered} onClick={() => setSelectedAnswer(index)}>{String.fromCharCode(65 + index)}<span>{option}</span></button>)}</div>{answered && <p className="quiz-explanation">{selectedAnswer === quiz.questions[questionIndex].answer ? 'Correct! ' : 'Not quite. '}{quiz.questions[questionIndex].explanation}</p>}<button className="quiz-primary" disabled={selectedAnswer === null} onClick={answered ? nextQuestion : submitAnswer}>{answered ? questionIndex + 1 === quiz.questions.length ? 'Finish quiz and complete task' : 'Next question' : 'Check answer'}</button></>}
    </section></div>}
  </main>
}
