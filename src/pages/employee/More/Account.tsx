import { useAppContext } from '@/components/AppProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRoleNameWithPrefix, formatUserStatusColor, formatUserStatusText } from '@/lib/format'
import { User } from 'lucide-react'

export default function Account() {
  const { profile } = useAppContext()

  if (!profile) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          <CardTitle className='text-lg'>Tài khoản</CardTitle>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm'>Mã</span>
          <span className='text-sm font-bold'>
            {formatRoleNameWithPrefix(profile.role.name)}
            {profile.id}
          </span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Vai trò</span>
          <span className='text-sm font-bold'>{profile.role.name}</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Trạng thái</span>
          <span className={formatUserStatusColor({ status: profile.status })}>
            {formatUserStatusText(profile.status)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
