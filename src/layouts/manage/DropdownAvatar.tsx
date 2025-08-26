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

export default function DropdownAvatar() {
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
      logoutMutation.mutateAsync({ refreshToken })
      reset()
    } catch {
      reset()
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='overflow-hidden rounded-full cursor-pointer'>
          <Avatar>
            <AvatarImage src={profile?.avatar || Config.ImageBaseUrl} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>{profile?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={'/manage/setting'} className='cursor-pointer'>
            Tài khoản cá nhân
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
