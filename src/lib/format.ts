import { UserStatus } from '@/constants/user'

const LANGUAGE = 'vi'

export const formatRoleStatusText = (isActive: boolean) => {
  switch (isActive) {
    case true:
      return LANGUAGE === 'vi' ? 'Hoạt động' : 'Active'
    case false:
      return LANGUAGE === 'vi' ? 'Dừng hoạt động' : 'Inactive'
  }
}

export const formatUserStatusText = (status: string) => {
  switch (status) {
    case UserStatus.Active:
      return LANGUAGE === 'vi' ? 'Hoạt động' : 'Active'
    case UserStatus.Inactive:
      return LANGUAGE === 'vi' ? 'Dừng hoạt động' : 'Inactive'
    case UserStatus.Blocked:
      return LANGUAGE === 'vi' ? 'Bị chặn' : 'Blocked'
    default:
      return LANGUAGE === 'vi' ? 'Không xác định' : 'Unknown'
  }
}

export const formatUserStatusColor = ({
  className = 'text-xs font-medium me-2 px-2.5 py-0.5 rounded-full',
  status
}: {
  className?: string
  status: string
}) => {
  switch (status) {
    case UserStatus.Active:
      return `${className} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`
    case UserStatus.Inactive:
      return `${className} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`
    case UserStatus.Blocked:
      return `${className} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`
    default:
      return `${className} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
  }
}
