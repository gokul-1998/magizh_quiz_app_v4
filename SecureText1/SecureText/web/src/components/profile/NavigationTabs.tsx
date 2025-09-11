import type { TabConfig } from '../../types/user'

interface NavigationTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  tabs: TabConfig[]
}

export default function NavigationTabs({ activeTab, onTabChange, tabs }: NavigationTabsProps) {
  return (
    <div style={{ 
      borderBottom: '1px solid #e5e7eb', 
      marginBottom: '2rem',
      display: 'flex',
      gap: '2rem'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            background: 'none',
            border: 'none',
            padding: '1rem 0',
            cursor: 'pointer',
            borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === tab.id ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '1rem',
              minWidth: '1.5rem',
              textAlign: 'center'
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
