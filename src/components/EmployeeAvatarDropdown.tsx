import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router'
import { useLogoutMutation } from '@/queries/useAuth'
import { clearLocalStorage, getRefreshTokenFromLocalStorage } from '@/lib/utils'
import { useAppContext } from '@/components/AppProvider'
import { toast } from 'sonner'
import Config from '@/constants/config'

export default function EmployeeAvatarDropdown() {
  const { profile, setProfile } = useAppContext()

  const logoutMutation = useLogoutMutation()
  const refreshToken = getRefreshTokenFromLocalStorage()

  const reset = () => {
    setProfile(null)
    clearLocalStorage()
    toast.success('Đăng xuất thành công')
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync({ refreshToken })
      reset()
    } catch {
      reset()
    }
  }

  if (!profile) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='overflow-hidden rounded-full cursor-pointer'>
          <Avatar>
            <AvatarImage src={profile?.avatar || Config.ImageBaseUrl} />
            <AvatarFallback>{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{profile?.name}</p>
            <p className='text-xs leading-none text-muted-foreground'>{profile?.role?.name}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to='/' className='cursor-pointer'>
            Trang khách hàng
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to='/employee/profile' className='cursor-pointer'>
            Tài khoản cá nhân
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className='text-red-600 focus:text-red-600'>
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
