import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, Check, Flame, LoaderCircle, LockKeyhole, Plus, Trash2, X } from 'lucide-react'

type Task = { id: number; title: string; subject: string; priority: 'High' | 'Medium'; done: boolean }
type Question = { question: string; options: string[]; answer: number; explanation: string }
type Quiz = { taskId: number; taskTitle: string; questions: Question[] }
type Book = { id: number; name: string; subject: string; bring: boolean }
type TimeBlock = { id: number; time: string; subject: string; duration: string }
type Persisted = { dayKey: string; tasks: Task[]; books: Book[]; blocks: TimeBlock[]; streak: number; saver: boolean; reflection: string; bestStreak: number }

const todayKey = () => new Date().toLocaleDateString('en-CA')
const freshTasks: Task[] = [
  { id: 1, title: 'Complete Physics numericals', subject: 'Physics · Gravitation', priority: 'High', done: false },
  { id: 2, title: 'Revise Organic Chemistry reactions', subject: 'Chemistry · Organic reactions', priority: 'High', done: false },
  { id: 3, title: 'Solve 20 Maths examples', subject: 'Mathematics · Quadratic equations', priority: 'Medium', done: false },
]
const freshBooks: Book[] = [
  { id: 1, name: 'NCERT Physics', subject: 'Physics', bring: true },
  { id: 2, name: 'Class 11 Maths', subject: 'Mathematics', bring: false },
  { id: 3, name: 'Chemistry Notebook', subject: 'Chemistry', bring: true },
]
const freshBlocks: TimeBlock[] = [
  { id: 1, time: '16:00', subject: 'Physics', duration: '45 min' },
  { id: 2, time: '17:00', subject: 'Break', duration: '15 min' },
  { id: 3, time: '17:15', subject: 'Chemistry', duration: '60 min' },
]
const initialData = (): Persisted => {
  const today = todayKey()
  try {
    const saved = localStorage.getItem('justtoday:v1')
    if (saved) {
      const data = JSON.parse(saved) as Persisted
      if (data.dayKey !== today) {
        const achieved = data.tasks.length > 0 && data.tasks.filter(task => task.done).length / data.tasks.length >= 0.85
        const streak = achieved ? data.streak + 1 : data.saver ? data.streak : 1
        return { ...data, dayKey: today, tasks: freshTasks, streak, saver: achieved ? data.saver : false }
      }
      return data
    }
  } catch { /* start with the demo data if stored data is invalid */ }
  return { dayKey: today, tasks: freshTasks, books: freshBooks, blocks: freshBlocks, streak: 1, saver: false, reflection: '', bestStreak: 1 }
}

export default function App() {
  const [data, setData] = useState<Persisted>(initialData)
  const [screen, setScreen] = useState<'today' | 'tasks' | 'streak'>('today')
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [pendingTask, setPendingTask] = useState<Task | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [quizError, setQuizError] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [bookName, setBookName] = useState('')
  const [bookSubject, setBookSubject] = useState('')
  const [blockTime, setBlockTime] = useState('18:00')
  const [blockSubject, setBlockSubject] = useState('')
  const [blockDuration, setBlockDuration] = useState('45 min')
  const [reflectionSaved, setReflectionSaved] = useState(false)

  useEffect(() => { localStorage.setItem('justtoday:v1', JSON.stringify(data)) }, [data])

  const completeCount = data.tasks.filter(task => task.done).length
  const progress = data.tasks.length ? Math.round(completeCount / data.tasks.length * 100) : 0
  const lit = data.tasks.length > 0 && completeCount / data.tasks.length >= 0.85
  const activeQuestion = quiz?.questions[questionIndex]
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  function updateBooks(update: (books: Book[]) => Book[]) { setData(current => ({ ...current, books: update(current.books) })) }
  function updateBlocks(update: (blocks: TimeBlock[]) => TimeBlock[]) { setData(current => ({ ...current, blocks: update(current.blocks) })) }

  async function beginQuiz(task: Task) {
    if (task.done || loadingId !== null) return
    setPendingTask(task); setQuiz(null); setQuizError(''); setLoadingId(task.id)
    try {
      const response = await fetch('/api/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: { title: task.title, subject: task.subject }, questionCount: 3 }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Gemini quiz generation failed. Please retry.')
      if (!Array.isArray(body.questions) || body.questions.length !== 3) throw new Error('Gemini did not return a complete quiz. Please retry.')
      setQuiz({ taskId: task.id, taskTitle: task.title, questions: body.questions })
      setQuestionIndex(0); setSelected(null); setAnswered(false); setScore(0)
    } catch (reason) {
      setQuizError(reason instanceof Error ? reason.message : 'Quiz generation failed. Please retry.')
    } finally { setLoadingId(null) }
  }

  function checkAnswer() {
    if (!quiz || !activeQuestion || selected === null || answered) return
    const correct = selected === activeQuestion.answer
    setAnswered(true)
    if (correct) setScore(value => value + 1)
  }

  function advanceQuiz() {
    if (!quiz || !answered) return
    if (questionIndex < quiz.questions.length - 1) { setQuestionIndex(value => value + 1); setSelected(null); setAnswered(false); return }
    const finalScore = score
    setData(current => {
      const tasks = current.tasks.map(task => task.id === quiz.taskId ? { ...task, done: true } : task)
      const perfect = finalScore === quiz.questions.length
      const streak = perfect && !current.saver ? current.streak : current.streak
      return { ...current, tasks, saver: current.saver || perfect, streak, bestStreak: Math.max(current.bestStreak, streak) }
    })
    setQuiz(null); setPendingTask(null); setQuizError('')
  }

  function cancelQuiz() {
    // Do not allow dismissal of the required quiz; the student can leave the tab, but task remains incomplete.
    if (!quiz && !loadingId) { setPendingTask(null); setQuizError('') }
  }

  function addBook(event: React.FormEvent) {
    event.preventDefault()
    const name = bookName.trim(); const subject = bookSubject.trim()
    if (!name) return
    updateBooks(items => [...items, { id: Date.now(), name, subject: subject || 'General', bring: true }])
    setBookName(''); setBookSubject('')
  }

  function addBlock(event: React.FormEvent) {
    event.preventDefault()
    const subject = blockSubject.trim()
    if (!subject) return
    updateBlocks(items => [...items, { id: Date.now(), time: blockTime, subject, duration: blockDuration }].sort((a, b) => a.time.localeCompare(b.time)))
    setBlockSubject('')
  }

  return <main className="app-shell">
    <header><div className="brand"><span>JT</span><strong>JustToday</strong></div><div className={`streak ${lit ? 'streak-lit' : ''}`}><Flame size={18}/>{data.streak} day streak</div></header>

    {screen === 'today' && <section>
      <div className="hero"><div><p>{dateLabel.toUpperCase()}</p><h1>Today at school</h1></div><div className={`streak ${lit ? 'streak-lit' : ''}`}><Flame size={18}/>{progress}% done</div></div>
      <div className="grid">
        <article className="card packing"><div className="card-title"><div><p>PACKING CHECKLIST</p><h2>Physical books</h2></div><BookOpen size={22}/></div>
          {data.books.map(book => <div className="book-row" key={book.id}><label className="book-toggle"><input type="checkbox" checked={book.bring} onChange={() => updateBooks(items => items.map(item => item.id === book.id ? { ...item, bring: !item.bring } : item))}/><span className="custom-check"><Check size={14}/></span></label><span className="book-label"><strong>{book.name}</strong><small>{book.subject}</small></span><em className={book.bring ? '' : 'leave'}>{book.bring ? 'BRING' : 'LEAVE'}</em><button className="remove-button" title="Remove book" onClick={() => updateBooks(items => items.filter(item => item.id !== book.id))}><Trash2 size={15}/></button></div>)}
          <form className="inline-form" onSubmit={addBook}><input aria-label="Book or notebook name" placeholder="Book or notebook" value={bookName} onChange={event => setBookName(event.target.value)} required/><input aria-label="Subject" placeholder="Subject" value={bookSubject} onChange={event => setBookSubject(event.target.value)}/><button type="submit" aria-label="Add book"><Plus size={18}/></button></form>
        </article>
        <article className="card schedule"><div className="card-title"><div><p>TODAY'S LESSONS</p><h2>School schedule</h2></div></div><div className="lesson"><time>08:00</time><div><strong>Physics</strong><span>Gravitation & escape velocity</span></div></div><div className="lesson"><time>09:00</time><div><strong>Chemistry</strong><span>Organic reactions</span></div></div><div className="lesson"><time>10:00</time><div><strong>Mathematics</strong><span>Quadratic equations</span></div></div></article>
      </div>
      <article className="card time-blocks"><div className="card-title"><div><p>FOCUS PLAN</p><h2>Time blocks</h2></div></div><div className="blocks">{data.blocks.map(block => <div className="time-block" key={block.id}><time>{new Date(`2000-01-01T${block.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time><strong>{block.subject}</strong><span>{block.duration}</span><button className="remove-button" aria-label={`Remove ${block.subject} time block`} onClick={() => updateBlocks(items => items.filter(item => item.id !== block.id))}><Trash2 size={14}/></button></div>)}</div>
        <form className="block-form" onSubmit={addBlock}><label>Start time<input type="time" value={blockTime} onChange={event => setBlockTime(event.target.value)} required/></label><label>Subject / activity<input placeholder="e.g. Biology revision" value={blockSubject} onChange={event => setBlockSubject(event.target.value)} required/></label><label>Duration<select value={blockDuration} onChange={event => setBlockDuration(event.target.value)}><option>25 min</option><option>45 min</option><option>60 min</option><option>90 min</option></select></label><button type="submit"><Plus size={16}/> Add time block</button></form>
      </article>
    </section>}

    {screen === 'tasks' && <section><div className="hero"><div><p>85% DAILY TARGET · MIDNIGHT DEADLINE</p><h1>Today's priorities</h1></div><div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}>{progress}%</div></div>
      <aside className="persistent-alert"><LockKeyhole size={20}/><div><strong>Quiz required to complete each task</strong><span>Finish its Gemini MCQ. Get every answer right to earn a streak saver.</span></div></aside>
      <div className="task-stack">{data.tasks.map((task, index) => <article className={`task-card ${task.done ? 'done' : ''}`} key={task.id}><span className="task-number">0{index + 1}</span><span className="task-info"><small>{task.subject} · {task.priority} priority</small><strong>{task.title}</strong></span>{task.done ? <span className="task-completed"><Check size={17}/> Quiz complete</span> : <button className="task-start" disabled={loadingId !== null} onClick={() => void beginQuiz(task)}>{loadingId === task.id ? <><LoaderCircle className="spin" size={17}/> Generating</> : 'Complete + quiz'}</button>}</article>)}</div>
      {quizError && !pendingTask && <p className="quiz-error">{quizError}</p>}
      {lit && <aside className="streak-celebration"><SparkleIcon/><div><strong>85% goal reached!</strong><span>Your study streak is glowing. Keep going!</span></div></aside>}
    </section>}

    {screen === 'streak' && <section><div className="hero"><div><p>CONSISTENCY COUNTS</p><h1>Study streak</h1></div><div className={`streak ${lit ? 'streak-lit' : ''}`}><Flame size={18}/>{data.streak} days</div></div><article className="card streak-card"><div className="streak-stat"><Flame size={34}/><div><strong>{data.streak} days</strong><span>Best: {data.bestStreak} days</span></div></div><p>Reach at least 85% of today's tasks to extend your streak at day rollover.</p><div className={`saver-status ${data.saver ? 'has-saver' : ''}`}><LockKeyhole size={18}/><span>{data.saver ? 'Streak saver ready — earn it by getting every answer correct in a task quiz.' : 'No streak saver yet. Get every answer correct in a task quiz to earn one.'}</span></div><p className="saver-rule">If you miss the 85% target for a day, a saved streak saver protects your streak once. Without one, the streak resets to 1.</p></article><article className="card weekly"><h2>Weekly reflection</h2><p>What helped you stay consistent this week?</p><textarea value={data.reflection} onChange={event => { setData(current => ({ ...current, reflection: event.target.value })); setReflectionSaved(false) }} placeholder="My biggest win was..."/><button onClick={() => setReflectionSaved(true)}>Save reflection</button>{reflectionSaved && <p className="saved-note">Reflection saved on this device.</p>}</article></section>}

    <nav><button className={screen === 'today' ? 'active' : ''} onClick={() => setScreen('today')}><BookOpen size={19}/><span>Today</span></button><button className={screen === 'tasks' ? 'active' : ''} onClick={() => setScreen('tasks')}><Check size={19}/><span>Tasks</span></button><button className={screen === 'streak' ? 'active' : ''} onClick={() => setScreen('streak')}><Flame size={19}/><span>Streak</span></button></nav>

    {pendingTask && <div className="quiz-backdrop"><section className="quiz-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-title"><div className="quiz-top"><div><p>REQUIRED · GEMINI MCQ</p><h2 id="quiz-title">{pendingTask.title}</h2></div><span className="required-chip"><LockKeyhole size={14}/> Required</span></div>
      {loadingId !== null && <div className="quiz-loading"><LoaderCircle className="spin" size={30}/><strong>Gemini is preparing your quiz…</strong><span>Your task stays incomplete until you finish all questions.</span></div>}
      {quizError && <div className="quiz-failure" role="alert"><AlertTriangle/><strong>Could not generate the required quiz.</strong><p>{quizError}</p><button className="quiz-primary" onClick={() => void beginQuiz(pendingTask)}>Retry Gemini quiz</button><button className="quiz-secondary" onClick={cancelQuiz}>Close for now (task remains incomplete)</button></div>}
      {quiz && activeQuestion && <><div className="quiz-progress">Question {questionIndex + 1} of {quiz.questions.length}<span>All correct = streak saver</span></div><h3 className="quiz-question">{activeQuestion.question}</h3><div className="quiz-options">{activeQuestion.options.map((option, index) => <button key={`${questionIndex}-${option}`} className={`${selected === index ? 'selected ' : ''}${answered && index === activeQuestion.answer ? 'correct' : ''}${answered && selected === index && index !== activeQuestion.answer ? 'incorrect' : ''}`} disabled={answered} onClick={() => setSelected(index)}>{String.fromCharCode(65 + index)}<span>{option}</span></button>)}</div>{answered && <p className="quiz-explanation">{selected === activeQuestion.answer ? 'Correct! ' : 'Not quite. '}{activeQuestion.explanation}</p>}<button className="quiz-primary" disabled={selected === null} onClick={answered ? advanceQuiz : checkAnswer}>{answered ? questionIndex + 1 === quiz.questions.length ? 'Finish quiz and complete task' : 'Next question' : 'Check answer'}</button></>}
    </section></div>}
  </main>
}

function SparkleIcon() { return <span className="celebration-sparkle" aria-hidden="true">✦</span> }
