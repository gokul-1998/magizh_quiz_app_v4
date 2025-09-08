import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

interface Card {
  id: number
  question: string
  question_type: 'mcq' | 'multi_select' | 'fill_blank'
  options: string[]
  correct_answers: string[]
  explanation: string
}

export default function StudyMode() {
  const { deckId } = useParams()
  const [cards, setCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)

  // Sample cards for demo
  useEffect(() => {
    const sampleCards: Card[] = [
      {
        id: 1,
        question: "What does 'var' keyword do in JavaScript?",
        question_type: "mcq",
        options: ["Declares a variable", "Creates a function", "Imports a module", "Exports a value"],
        correct_answers: ["Declares a variable"],
        explanation: "The 'var' keyword is used to declare variables in JavaScript."
      },
      {
        id: 2,
        question: "Which of the following are JavaScript data types?",
        question_type: "multi_select",
        options: ["string", "number", "boolean", "array", "decimal"],
        correct_answers: ["string", "number", "boolean"],
        explanation: "JavaScript has primitive types: string, number, boolean, undefined, null, symbol, and bigint."
      },
      {
        id: 3,
        question: "How do you declare a constant in JavaScript?",
        question_type: "mcq",
        options: ["const", "let", "var", "final"],
        correct_answers: ["const"],
        explanation: "The 'const' keyword is used to declare constants that cannot be reassigned."
      }
    ]
    setCards(sampleCards)
  }, [deckId])

  const currentCard = cards[currentIndex]
  const isLastCard = currentIndex === cards.length - 1

  const handleAnswerSelect = (answer: string) => {
    if (currentCard.question_type === 'multi_select') {
      setSelectedAnswers(prev => 
        prev.includes(answer) 
          ? prev.filter(a => a !== answer)
          : [...prev, answer]
      )
    } else {
      setSelectedAnswers([answer])
    }
  }

  const handleSubmit = () => {
    setShowAnswer(true)
    
    // Check if answer is correct
    const isCorrect = currentCard.question_type === 'multi_select'
      ? selectedAnswers.sort().join(',') === currentCard.correct_answers.sort().join(',')
      : selectedAnswers[0] === currentCard.correct_answers[0]
    
    if (isCorrect) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    if (isLastCard) {
      // Study session complete
      return
    }
    
    setCurrentIndex(prev => prev + 1)
    setSelectedAnswers([])
    setShowAnswer(false)
  }

  if (cards.length === 0) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <p>Loading cards...</p>
        </div>
      </div>
    )
  }

  if (isLastCard && showAnswer) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="text-3xl">🎉 Study Session Complete!</h2>
          <p style={{ fontSize: '1.25rem', margin: '1.5rem 0' }}>
            You scored <span style={{ color: '#10b981', fontWeight: 'bold' }}>{score}</span> out of <span style={{ fontWeight: 'bold' }}>{cards.length}</span>
          </p>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Accuracy: {Math.round((score / cards.length) * 100)}%
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Study Again
            </button>
            <Link to="/decks" className="btn" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
              Back to Decks
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-3xl">📚 Study Mode</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#6b7280' }}>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <div style={{ 
            width: '200px', 
            height: '8px', 
            backgroundColor: '#e5e7eb', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((currentIndex + 1) / cards.length) * 100}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          {currentCard.question}
        </h2>

        <div style={{ marginBottom: '2rem' }}>
          {currentCard.options.map((option, index) => (
            <label
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                margin: '0.5rem 0',
                border: '2px solid',
                borderColor: selectedAnswers.includes(option) ? '#3b82f6' : '#e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                backgroundColor: selectedAnswers.includes(option) ? '#eff6ff' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <input
                type={currentCard.question_type === 'multi_select' ? 'checkbox' : 'radio'}
                name="answer"
                value={option}
                checked={selectedAnswers.includes(option)}
                onChange={() => handleAnswerSelect(option)}
                style={{ marginRight: '0.75rem', accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: '1rem' }}>{option}</span>
            </label>
          ))}
        </div>

        {showAnswer && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            borderLeft: '4px solid #3b82f6',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1e40af' }}>
              💡 Explanation:
            </h4>
            <p style={{ color: '#1e40af' }}>{currentCard.explanation}</p>
            <p style={{ marginTop: '0.5rem', fontWeight: '500', color: '#1e40af' }}>
              Correct answer(s): {currentCard.correct_answers.join(', ')}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/decks" className="btn" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
            ← Back to Decks
          </Link>
          
          {!showAnswer ? (
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={selectedAnswers.length === 0}
              style={{ 
                opacity: selectedAnswers.length === 0 ? 0.5 : 1,
                cursor: selectedAnswers.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Submit Answer
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              {isLastCard ? 'Finish' : 'Next Card →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}