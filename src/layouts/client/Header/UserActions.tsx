import { ShoppingCart, UserCog } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router'
import { ModeToggle } from '@/components/ModeToggle'
import { useAppContext } from '@/components/AppProvider'
import { clearLocalStorage, getFirstNameClient, getRefreshTokenFromLocalStorage } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { toast } from 'sonner'
import { RoleName } from '@/constants/role'

const MANAGE_ROLE = [RoleName.Admin, RoleName.Manager] as string[]
const EMPLOYEE_ROLE = [RoleName.Admin, RoleName.Manager, RoleName.Employee] as string[]

export default function UserActions() {
  const { isAuth, profile, setProfile } = useAppContext()
  const refreshToken = getRefreshTokenFromLocalStorage()

  const logoutMutation = useLogoutMutation()
  const handleLogout = async () => {
    if (logoutMutation.isPending) return
    try {
      await logoutMutation.mutateAsync({ refreshToken })
      setProfile(null)
      clearLocalStorage()
      toast.success('Đăng xuất thành công')
    } catch (error) {
      setProfile(null)
      clearLocalStorage()
    }
  }

  return (
    <div className='flex items-center gap-3'>
      {isAuth && (
        <Link
          to='cart'
          className='relative p-2 text-gray-700 transition-colors duration-200 hover:bg-gray-100 rounded-lg'
        >
          <ShoppingCart className='h-6 w-6' />
          <span className='absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
            0
          </span>
        </Link>
      )}
      <button className='p-2 text-gray-700 transition-colors duration-200 hover:bg-gray-100 rounded-lg'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <UserCog className='h-6 w-6' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <div className='flex items-center justify-between'>
              <DropdownMenuLabel>{profile ? getFirstNameClient(profile.name) : 'Client'}</DropdownMenuLabel>
              <div className='mr-2'>
                <ModeToggle variant='outline' />
              </div>
            </div>
            <DropdownMenuSeparator />
            {isAuth ? (
              <>
                {profile && MANAGE_ROLE.includes(profile.role.name) && (
                  <DropdownMenuItem asChild>
                    <Link to={'/manage/dashboard'} className='cursor-pointer'>
                      Trang quản trị
                    </Link>
                  </DropdownMenuItem>
                )}
                {profile && EMPLOYEE_ROLE.includes(profile.role.name) && (
                  <DropdownMenuItem asChild>
                    <Link to={'/employee'} className='cursor-pointer'>
                      Trang nhân viên
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to={'profile'} className='cursor-pointer'>
                    Tài khoản của tôi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Đăng xuất</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link to={'login'} className='cursor-pointer'>
                    Đăng nhập
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to={'register'} className='cursor-pointer'>
                    Đăng ký
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </button>
    </div>
  )
}
