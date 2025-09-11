import EmptyState from '../common/EmptyState'

interface GenericEmptyTabProps {
  icon: string
  title: string
  message: string
  isOwnProfile: boolean
}

export default function GenericEmptyTab({ 
  icon, 
  title, 
  message, 
  isOwnProfile 
}: GenericEmptyTabProps) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      message={isOwnProfile 
        ? `You ${message.toLowerCase()}`
        : `This user ${message.toLowerCase()}`
      }
    />
  )
}
