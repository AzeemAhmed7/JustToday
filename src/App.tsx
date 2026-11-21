import { useState } from 'react'
import { AlertTriangle, BookOpen, Check, Flame, LoaderCircle, LockKeyhole, X } from 'lucide-react'

type Task = { id: number; title: string; subject: string; priority: 'High' | 'Medium'; done: boolean }
type Question = { question: string; options: string[]; answer: number; explanation: string }
type Quiz = { taskId: number; taskTitle: string; questions: Question[] }

const startingTasks: Task[] = [
  { id: 1, title: 'Complete Physics numericals', subject: 'Physics · Gravitation', priority: 'High', done: false },
  { id: 2, title: 'Revise Organic Chemistry reactions', subject: 'Chemistry · Organic reactions', priority: 'High', done: false },
  { id: 3, title: 'Solve 20 Maths examples', subject: 'Mathematics · Quadratic equations', priority: 'Medium', done: false },
]
const initialBooks = [
  { id: 1, name: 'NCERT Physics', bring: true, subject: 'Physics' },
  { id: 2, name: 'Class 11 Maths', bring: false, subject: 'Mathematics' },
  { id: 3, name: 'Chemistry Notebook', bring: true, subject: 'Chemistry' },
]

export default function App() {
  const [screen, setScreen] = useState<'today' | 'tasks' | 'streak'>('today')
  const [tasks, setTasks] = useState(startingTasks)
  const [books, setBooks] = useState(initialBooks)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [pendingTask, setPendingTask] = useState<Task | null>(null)
  const [loadingTaskId, setLoadingTaskId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [reflection, setReflection] = useState('')
  const [savedReflection, setSavedReflection] = useState(false)

  const completed = tasks.filter(task => task.done).length
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0

  async function beginTaskQuiz(task: Task) {
    if (task.done || loadingTaskId !== null) return
    setError('')
    setPendingTask(task)
    setLoadingTaskId(task.id)
    setQuiz(null)
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: { title: task.title, subject: task.subject }, questionCount: 3 }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gemini could not generate the quiz. Please retry.')
      if (!Array.isArray(data.questions) || data.questions.length < 1) throw new Error('Gemini returned no quiz questions. Please retry.')
      setQuiz({ taskId: task.id, taskTitle: task.title, questions: data.questions })
      setQuestionIndex(0)
      setSelectedAnswer(null)
      setAnswered(false)
      setScore(0)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Quiz generation failed. Please retry.')
    } finally {
      setLoadingTaskId(null)
    }
  }

  function answerQuestion() {
    if (!quiz || selectedAnswer === null || answered) return
    setAnswered(true)
    if (selectedAnswer === quiz.questions[questionIndex].answer) setScore(value => value + 1)
  }

  function nextQuestion() {
    if (!quiz || !answered) return
    if (questionIndex + 1 < quiz.questions.length) {
      setQuestionIndex(index => index + 1)
      setSelectedAnswer(null)
      setAnswered(false)
      return
    }
    setTasks(current => current.map(task => task.id === quiz.taskId ? { ...task, done: true } : task))
    setQuiz(null)
    setPendingTask(null)
    setError('')
  }

  function retryQuiz() {
    if (pendingTask) void beginTaskQuiz(pendingTask)
  }

  return (
    <main className="app-shell">
      <header><div className="brand"><span>JT</span><strong>JustToday</strong></div><div className="streak"><Flame size={18}/>{completed} tasks cleared</div></header>

      {screen === 'today' && <section>
        <div className="hero"><div><p>YOUR SCHOOL DAY</p><h1>Today at school</h1></div><div className="streak"><Flame size={18}/> Keep your streak</div></div>
        <div className="grid">
          <article className="card packing"><div className="card-title"><div><p>PACKING CHECKLIST</p><h2>Physical books to bring</h2></div><BookOpen size={22}/></div>
            {books.map(book => <label className="book-row" key={book.id}><input type="checkbox" checked={book.bring} onChange={() => setBooks(current => current.map(item => item.id === book.id ? { ...item, bring: !item.bring } : item))}/><span className="custom-check"><Check size={14}/></span><span><strong>{book.name}</strong><small>{book.subject}</small></span>{book.bring ? <em>BRING</em> : <em className="leave">LEAVE</em>}</label>)}
          </article>
          <article className="card schedule"><div className="card-title"><div><p>TODAY'S LESSONS</p><h2>School schedule</h2></div></div>
            <div className="lesson"><time>08:00</time><div><strong>Physics</strong><span>Gravitation & escape velocity</span></div></div><div className="lesson"><time>09:00</time><div><strong>Chemistry</strong><span>Organic reactions</span></div></div><div className="lesson"><time>10:00</time><div><strong>Mathematics</strong><span>Quadratic equations</span></div></div>
          </article>
        </div>
        <article className="card time-blocks"><div className="card-title"><div><p>FOCUS PLAN</p><h2>Time blocks</h2></div></div><div className="blocks"><div><time>4:00 PM</time><strong>Physics</strong><span>45 min</span></div><div><time>5:00 PM</time><strong>Break</strong><span>15 min</span></div><div><time>5:15 PM</time><strong>Chemistry</strong><span>60 min</span></div></div></article>
      </section>}

      {screen === 'tasks' && <section>
        <div className="hero"><div><p>COMPLETE A TASK, THEN PASS ITS QUIZ</p><h1>Today's priorities</h1></div><div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}>{progress}%</div></div>
        <aside className="persistent-alert"><LockKeyhole size={20}/><div><strong>Quiz required for every task</strong><span>Tasks lock as complete after their Gemini MCQ quiz is finished.</span></div></aside>
        {error && !quiz && <aside className="quiz-error" role="alert"><AlertTriangle size={19}/><span>{error}</span><button onClick={retryQuiz}>Retry quiz</button></aside>}
        <div className="task-stack">{tasks.map((task, index) => <article className={`task-card ${task.done ? 'done' : ''}`} key={task.id}>
          <span className="task-number">0{index + 1}</span><span className="task-info"><small>{task.subject} · {task.priority} priority</small><strong>{task.title}</strong></span>
          {task.done ? <span className="task-completed"><Check size={17}/> Quiz passed</span> : <button className="task-start" disabled={loadingTaskId !== null} onClick={() => void beginTaskQuiz(task)}>{loadingTaskId === task.id ? <><LoaderCircle className="spin" size={17}/> Generating</> : 'Complete + quiz'}</button>}
        </article>)}</div>
        {completed === tasks.length && <aside className="study-action"><Check/><div><strong>All tasks completed</strong><span>You finished and passed a quiz for each task. Great work!</span></div></aside>}
      </section>}

      {screen === 'streak' && <section><div className="hero"><div><p>THIS WEEK</p><h1>Study streak</h1></div><div className="streak"><Flame size={18}/>{completed} tasks</div></div><article className="card weekly"><h2>Weekly reflection</h2><p>What helped you stay consistent this week?</p><textarea value={reflection} onChange={event => { setReflection(event.target.value); setSavedReflection(false) }} placeholder="My biggest win was..."/><button onClick={() => setSavedReflection(true)}>Save reflection</button>{savedReflection && <p className="saved-note">Reflection saved for this session.</p>}</article></section>}

      <nav><button className={screen === 'today' ? 'active' : ''} onClick={() => setScreen('today')}><BookOpen size={19}/><span>Today</span></button><button className={screen === 'tasks' ? 'active' : ''} onClick={() => setScreen('tasks')}><Check size={19}/><span>Tasks</span></button><button className={screen === 'streak' ? 'active' : ''} onClick={() => setScreen('streak')}><Flame size={19}/><span>Streak</span></button></nav>

      {(pendingTask && (quiz || error || loadingTaskId !== null)) && <div className="quiz-backdrop"><section className="quiz-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-title"><div className="quiz-top"><div><p>REQUIRED · GEMINI MCQ</p><h2 id="quiz-title">{pendingTask.title}</h2></div><span className="required-chip"><LockKeyhole size={14}/> Required</span></div>
        {loadingTaskId !== null && <div className="quiz-loading"><LoaderCircle className="spin" size={30}/><strong>Gemini is preparing your quiz…</strong><span>Your task will remain incomplete until you finish it.</span></div>}
        {error && <div className="quiz-failure" role="alert"><AlertTriangle/><strong>Could not generate the required quiz.</strong><p>{error}</p><button className="quiz-primary" onClick={retryQuiz}>Retry Gemini quiz</button></div>}
        {quiz && <><div className="quiz-progress">Question {questionIndex + 1} of {quiz.questions.length}<span>Task stays locked until finished</span></div><h3 className="quiz-question">{quiz.questions[questionIndex].question}</h3><div className="quiz-options">{quiz.questions[questionIndex].options.map((option, index) => <button key={`${questionIndex}-${option}`} className={`${selectedAnswer === index ? 'selected ' : ''}${answered && index === quiz.questions[questionIndex].answer ? 'correct' : ''}${answered && selectedAnswer === index && index !== quiz.questions[questionIndex].answer ? 'incorrect' : ''}`} disabled={answered} onClick={() => setSelectedAnswer(index)}>{String.fromCharCode(65 + index)}<span>{option}</span></button>)}</div>{answered && <p className="quiz-explanation">{selectedAnswer === quiz.questions[questionIndex].answer ? 'Correct! ' : 'Review this one: '}{quiz.questions[questionIndex].explanation}</p>}<button className="quiz-primary" disabled={selectedAnswer === null || !answered} onClick={answered ? nextQuestion : answerQuestion}>{answered ? questionIndex + 1 === quiz.questions.length ? 'Finish quiz and complete task' : 'Next question' : 'Check answer'}</button></>}
      </section></div>}
    </main>
  )
}
