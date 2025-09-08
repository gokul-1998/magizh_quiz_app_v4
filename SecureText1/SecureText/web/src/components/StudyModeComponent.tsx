import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Card {
  id: number
  question: string
  question_type: 'mcq' | 'multi_select' | 'fill_blank'
  options: string[]
  correct_answers: string[]
  explanation?: string
}

interface StudySession {
  id: number
  mode: 'study' | 'exam' | 'review'
  cards: Card[]
  currentCardIndex: number
  answers: Record<number, string[]>
  showFeedback: boolean
  completed: boolean
  score: number
  startTime: Date
}

export default function StudyModeComponent() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [session, setSession] = useState<StudySession | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  const mockCards: Card[] = [
    {
      id: 1,
      question: "What is the primary purpose of React hooks?",
      question_type: "mcq",
      options: [
        "To replace class components entirely",
        "To enable state and lifecycle features in functional components",
        "To improve React performance",
        "To handle routing in React applications"
      ],
      correct_answers: ["To enable state and lifecycle features in functional components"],
      explanation: "React hooks allow you to use state and other React features in functional components, making them more powerful and reducing the need for class components."
    },
    {
      id: 2,
      question: "Which of the following are valid React hooks?",
      question_type: "multi_select",
      options: ["useState", "useEffect", "useRouter", "useContext", "useMemo"],
      correct_answers: ["useState", "useEffect", "useContext", "useMemo"],
      explanation: "useState, useEffect, useContext, and useMemo are all built-in React hooks. useRouter is not a built-in React hook."
    },
    {
      id: 3,
      question: "What does the useEffect hook do?",
      question_type: "mcq",
      options: [
        "Manages component state",
        "Handles side effects in functional components",
        "Creates context for data sharing",
        "Memoizes expensive calculations"
      ],
      correct_answers: ["Handles side effects in functional components"],
      explanation: "useEffect is used for performing side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM."
    }
  ]

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Initialize study session
    const newSession: StudySession = {
      id: Date.now(),
      mode: 'study',
      cards: mockCards,
      currentCardIndex: 0,
      answers: {},
      showFeedback: false,
      completed: false,
      score: 0,
      startTime: new Date()
    }
    setSession(newSession)
    setLoading(false)
  }, [user, navigate, deckId])

  useEffect(() => {
    // Timer for tracking study time
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (answer: string) => {
    if (!session || session.showFeedback) return

    const currentCard = session.cards[session.currentCardIndex]
    
    if (currentCard.question_type === 'multi_select') {
      setSelectedAnswers(prev => {
        if (prev.includes(answer)) {
          return prev.filter(a => a !== answer)
        } else {
          return [...prev, answer]
        }
      })
    } else {
      setSelectedAnswers([answer])
    }
  }

  const submitAnswer = () => {
    if (!session || selectedAnswers.length === 0) return

    const currentCard = session.cards[session.currentCardIndex]
    const isCorrect = JSON.stringify(selectedAnswers.sort()) === JSON.stringify(currentCard.correct_answers.sort())
    
    // Update session with answer
    const updatedSession = {
      ...session,
      answers: {
        ...session.answers,
        [currentCard.id]: selectedAnswers
      },
      showFeedback: true,
      score: isCorrect ? session.score + 1 : session.score
    }
    
    setSession(updatedSession)
  }

  const nextCard = () => {
    if (!session) return

    const nextIndex = session.currentCardIndex + 1
    
    if (nextIndex >= session.cards.length) {
      // Complete the session
      setSession({
        ...session,
        completed: true
      })
    } else {
      setSession({
        ...session,
        currentCardIndex: nextIndex,
        showFeedback: false
      })
      setSelectedAnswers([])
    }
  }

  const retryCard = () => {
    if (!session) return
    
    setSession({
      ...session,
      showFeedback: false
    })
    setSelectedAnswers([])
  }

  const restartSession = () => {
    const newSession: StudySession = {
      id: Date.now(),
      mode: 'study',
      cards: mockCards,
      currentCardIndex: 0,
      answers: {},
      showFeedback: false,
      completed: false,
      score: 0,
      startTime: new Date()
    }
    setSession(newSession)
    setSelectedAnswers([])
    setTimeElapsed(0)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 className="text-3xl">🔄 Loading Study Session...</h2>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 className="text-3xl">❌ Error Loading Session</h2>
          <button onClick={() => navigate('/decks')} className="btn btn-primary">
            Back to Decks
          </button>
        </div>
      </div>
    )
  }

  if (session.completed) {
    const accuracy = Math.round((session.score / session.cards.length) * 100)
    
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h1 className="text-3xl">🎉 Session Complete!</h1>
          
          <div className="grid grid-cols-3" style={{ margin: '2rem 0', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {session.score}/{session.cards.length}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {accuracy}%
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Accuracy</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                {formatTime(timeElapsed)}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Time</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button onClick={restartSession} className="btn btn-primary">
              🔄 Study Again
            </button>
            <button onClick={() => navigate('/decks')} className="btn">
              📚 Back to Decks
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentCard = session.cards[session.currentCardIndex]
  const progress = ((session.currentCardIndex + 1) / session.cards.length) * 100
  const isCorrect = session.showFeedback && 
    JSON.stringify(selectedAnswers.sort()) === JSON.stringify(currentCard.correct_answers.sort())

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-3xl">📖 Study Mode</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ color: '#6b7280' }}>⏱️ {formatTime(timeElapsed)}</div>
          <div style={{ color: '#6b7280' }}>
            Card {session.currentCardIndex + 1} of {session.cards.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: '#e5e7eb', 
        borderRadius: '4px',
        marginBottom: '2rem',
        overflow: 'hidden'
      }}>
        <div 
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Card Content */}
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          {currentCard.question}
        </h2>

        {/* Answer Options */}
        <div style={{ marginBottom: '2rem' }}>
          {currentCard.options.map((option, index) => {
            const isSelected = selectedAnswers.includes(option)
            const isCorrectAnswer = currentCard.correct_answers.includes(option)
            
            let buttonStyle: React.CSSProperties = {
              width: '100%',
              padding: '1rem',
              marginBottom: '0.5rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              cursor: session.showFeedback ? 'default' : 'pointer',
              transition: 'all 0.2s ease'
            }

            if (session.showFeedback) {
              if (isCorrectAnswer) {
                buttonStyle.backgroundColor = '#dcfce7'
                buttonStyle.borderColor = '#16a34a'
              } else if (isSelected && !isCorrectAnswer) {
                buttonStyle.backgroundColor = '#fef2f2'
                buttonStyle.borderColor = '#dc2626'
              }
            } else if (isSelected) {
              buttonStyle.backgroundColor = '#dbeafe'
              buttonStyle.borderColor = '#3b82f6'
            }

            return (
              <button
                key={index}
                style={buttonStyle}
                onClick={() => handleAnswerSelect(option)}
                disabled={session.showFeedback}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    minWidth: '1.5rem', 
                    height: '1.5rem', 
                    border: '2px solid currentColor', 
                    borderRadius: currentCard.question_type === 'multi_select' ? '0.25rem' : '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isSelected && (currentCard.question_type === 'multi_select' ? '✓' : '●')}
                  </span>
                  <span style={{ textAlign: 'left' }}>{option}</span>
                  {session.showFeedback && isCorrectAnswer && (
                    <span style={{ marginLeft: 'auto', color: '#16a34a' }}>✓</span>
                  )}
                  {session.showFeedback && isSelected && !isCorrectAnswer && (
                    <span style={{ marginLeft: 'auto', color: '#dc2626' }}>✗</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Feedback Section */}
        {session.showFeedback && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '0.5rem',
            backgroundColor: isCorrect ? '#dcfce7' : '#fef2f2',
            border: `2px solid ${isCorrect ? '#16a34a' : '#dc2626'}`,
            marginBottom: '2rem'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              color: isCorrect ? '#166534' : '#dc2626',
              marginBottom: '0.5rem'
            }}>
              {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
            </div>
            {currentCard.explanation && (
              <div style={{ color: isCorrect ? '#166534' : '#dc2626' }}>
                {currentCard.explanation}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {!session.showFeedback ? (
            <button
              onClick={submitAnswer}
              disabled={selectedAnswers.length === 0}
              className="btn btn-primary"
              style={{ 
                opacity: selectedAnswers.length === 0 ? 0.5 : 1,
                cursor: selectedAnswers.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Submit Answer
            </button>
          ) : (
            <>
              {!isCorrect && (
                <button onClick={retryCard} className="btn">
                  🔄 Try Again
                </button>
              )}
              <button onClick={nextCard} className="btn btn-primary">
                {session.currentCardIndex === session.cards.length - 1 ? '🏁 Finish' : '➡️ Next Card'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}