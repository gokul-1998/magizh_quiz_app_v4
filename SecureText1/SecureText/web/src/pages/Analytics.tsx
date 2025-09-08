import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function Analytics() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="text-3xl">🔒 Authentication Required</h2>
          <p style={{ color: '#6b7280', margin: '1rem 0' }}>
            Please login to view your analytics.
          </p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  // Mock analytics data
  const analyticsData = {
    totalStudyTime: 142, // minutes
    averageScore: 87.5,
    cardsStudied: 342,
    weeklyProgress: [65, 72, 78, 84, 89, 87, 92], // 7 days
    topicBreakdown: [
      { topic: 'JavaScript', accuracy: 92, cardsStudied: 45 },
      { topic: 'Python', accuracy: 84, cardsStudied: 38 },
      { topic: 'React', accuracy: 89, cardsStudied: 29 },
    ],
    recentSessions: [
      { deck: 'JavaScript Basics', score: 14, total: 15, date: '2025-09-07', duration: 12 },
      { deck: 'Python Data Structures', score: 18, total: 20, date: '2025-09-06', duration: 15 },
      { deck: 'React Hooks', score: 11, total: 12, date: '2025-09-05', duration: 8 },
    ]
  }

  return (
    <div className="container">
      <h1 className="text-3xl">📊 Learning Analytics</h1>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-3" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3 className="text-lg">Study Time</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {Math.floor(analyticsData.totalStudyTime / 60)}h {analyticsData.totalStudyTime % 60}m
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total study time</p>
        </div>
        <div className="card">
          <h3 className="text-lg">Average Score</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {analyticsData.averageScore}%
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Across all sessions</p>
        </div>
        <div className="card">
          <h3 className="text-lg">Cards Studied</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {analyticsData.cardsStudied}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total cards reviewed</p>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          📈 Weekly Progress
        </h3>
        <div style={{ display: 'flex', alignItems: 'end', gap: '0.5rem', height: '200px', padding: '1rem 0' }}>
          {analyticsData.weeklyProgress.map((score, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#3b82f6',
                  height: `${(score / 100) * 150}px`,
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  paddingBottom: '0.25rem'
                }}
              >
                {score}%
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Topic Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            🎯 Topic Performance
          </h3>
          {analyticsData.topicBreakdown.map((topic, index) => (
            <div key={index} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '500' }}>{topic.topic}</span>
                <span style={{ color: '#3b82f6', fontWeight: '600' }}>{topic.accuracy}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#e5e7eb', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    width: `${topic.accuracy}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {topic.cardsStudied} cards studied
              </p>
            </div>
          ))}
        </div>

        {/* Recent Sessions */}
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            🕐 Recent Sessions
          </h3>
          {analyticsData.recentSessions.map((session, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              marginBottom: '0.75rem' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{session.deck}</span>
                <span style={{ 
                  color: session.score === session.total ? '#10b981' : session.score / session.total >= 0.8 ? '#3b82f6' : '#f59e0b',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  {session.score}/{session.total}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
                <span>{session.date}</span>
                <span>{session.duration} min</span>
                <span>{Math.round((session.score / session.total) * 100)}% accuracy</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Insights */}
      <div className="card" style={{ marginTop: '2rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#166534' }}>
          💡 Learning Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h4 style={{ fontWeight: '500', color: '#166534', marginBottom: '0.5rem' }}>Strengths:</h4>
            <ul style={{ color: '#166534', fontSize: '0.875rem', paddingLeft: '1rem' }}>
              <li>Excellent performance in JavaScript concepts</li>
              <li>Consistent daily study habits</li>
              <li>Strong improvement trend this week</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: '500', color: '#166534', marginBottom: '0.5rem' }}>Areas to Focus:</h4>
            <ul style={{ color: '#166534', fontSize: '0.875rem', paddingLeft: '1rem' }}>
              <li>Python data structures need more practice</li>
              <li>Consider longer study sessions</li>
              <li>Review incorrectly answered cards</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}