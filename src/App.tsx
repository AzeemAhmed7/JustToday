import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, BookOpen, Check, ChevronRight, Flame, Plus, RefreshCw, Sparkles } from 'lucide-react'

const demoTasks = [
  { id: 1, title: 'Complete Physics numericals', subject: 'Physics', priority: 'High', done: false },
  { id: 2, title: 'Revise Organic Chemistry reactions', subject: 'Chemistry', priority: 'High', done: false },
  { id: 3, title: 'Solve 20 Maths examples', subject: 'Mathematics', priority: 'Medium', done: false },
]

const initialBooks = [
  { id: 1, name: 'NCERT Physics', bring: true, subject: 'Physics' },
  { id: 2, name: 'Class 11 Maths', bring: false, subject: 'Mathematics' },
  { id: 3, name: 'Chemistry Notebook', bring: true, subject: 'Chemistry' },
]

export default function App() {
  const [screen, setScreen] = useState<'today' | 'tasks' | 'streak'>('today')
  const [tasks, setTasks] = useState(demoTasks)
  const [books, setBooks] = useState(initialBooks)
  const [reminder, setReminder] = useState(true)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
  }, [])

  const completed = tasks.filter(task => task.done).length
  const progress = Math.round((completed / tasks.length) * 100)
  const toggleTask = (id: number) => setTasks(current => current.map(task => task.id === id ? { ...task, done: !task.done } : task))

  return (
    <main className="app-shell">
      <header>
        <div className="brand"><span>JT</span><strong>JustToday</strong></div>
        <button className="icon-button" aria-label="Notifications" onClick={() => setReminder(true)}><Bell size={20}/></button>
      </header>

      {screen === 'today' && <section>
        <div className="hero"><div><p>MONDAY · 21 NOVEMBER</p><h1>Today at school</h1></div><div className="streak"><Flame size={18}/> 6 day streak</div></div>
        <div className="grid">
          <article className="card packing">
            <div className="card-title"><div><p>PACKING CHECKLIST</p><h2>Physical books to bring</h2></div><BookOpen size={22}/></div>
            {books.map(book => <label className="book-row" key={book.id}>
              <input type="checkbox" checked={book.bring} onChange={() => setBooks(current => current.map(item => item.id === book.id ? { ...item, bring: !item.bring } : item))}/>
              <span className="custom-check"><Check size={14}/></span>
              <span><strong>{book.name}</strong><small>{book.subject}</small></span>
              {book.bring ? <em>BRING</em> : <em className="leave">LEAVE</em>}
            </label>)}
          </article>
          <article className="card schedule">
            <div className="card-title"><div><p>TODAY'S LESSONS</p><h2>School schedule</h2></div><span className="date-badge">21</span></div>
            <div className="lesson"><time>08:00</time><div><strong>Physics</strong><span>Gravitation & escape velocity</span></div></div>
            <div className="lesson"><time>09:00</time><div><strong>Chemistry</strong><span>Organic reactions</span></div></div>
            <div className="lesson"><time>10:00</time><div><strong>Mathematics</strong><span>Quadratic equations</span></div></div>
          </article>
        </div>
        <article className="card time-blocks">
          <div className="card-title"><div><p>FOCUS PLAN</p><h2>Time blocks</h2></div><button className="add-button"><Plus size={16}/> Add block</button></div>
          <div className="blocks"><div><time>4:00 PM</time><strong>Physics</strong><span>45 min</span></div><div><time>5:00 PM</time><strong>Break</strong><span>15 min</span></div><div><time>5:15 PM</time><strong>Chemistry</strong><span>60 min</span></div></div>
        </article>
      </section>}

      {screen === 'tasks' && <section>
        <div className="hero"><div><p>BEFORE MIDNIGHT</p><h1>Today's priorities</h1></div><div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}>{progress}%</div></div>
        {reminder && completed < tasks.length && <aside className="persistent-alert"><AlertTriangle size={20}/><div><strong>Finish every task</strong><span>{tasks.length - completed} tasks remain for today.</span></div><button onClick={() => setReminder(false)}>Snooze once</button></aside>}
        <div className="task-stack">{tasks.map((task, index) => <button className={`task-card ${task.done ? 'done' : ''}`} key={task.id} onClick={() => toggleTask(task.id)}>
          <span className="task-number">0{index + 1}</span><span className="task-info"><small>{task.subject} · {task.priority} priority</small><strong>{task.title}</strong></span><span className="task-check">{task.done ? <Check size={20}/> : <ChevronRight size={20}/>}</span>
        </button>)}</div>
        {completed === tasks.length && <aside className="study-action"><Sparkles/><div><strong>All tasks complete</strong><span>Take an AI quiz before closing your day.</span></div><button><RefreshCw size={16}/> Start quiz</button></aside>}
      </section>}

      {screen === 'streak' && <section>
        <div className="hero"><div><p>THIS WEEK</p><h1>Study streak</h1></div><div className="streak"><Flame size={18}/> 6 days</div></div>
        <article className="card weekly"><h2>Weekly reflection</h2><p>What helped you stay consistent this week?</p><textarea placeholder="My biggest win was..."/><button>Save reflection</button></article>
      </section>}

      <nav><button className={screen === 'today' ? 'active' : ''} onClick={() => setScreen('today')}><BookOpen size={19}/><span>Today</span></button><button className={screen === 'tasks' ? 'active' : ''} onClick={() => setScreen('tasks')}><Check size={19}/><span>Tasks</span></button><button className={screen === 'streak' ? 'active' : ''} onClick={() => setScreen('streak')}><Flame size={19}/><span>Streak</span></button></nav>
    </main>
  )
}
