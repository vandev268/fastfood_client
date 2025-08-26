import { useState } from 'react'
import { useAppContext } from '@/components/AppProvider'
import { useTheme } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { clearLocalStorage, getRefreshTokenFromLocalStorage } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { LogOut, Moon, Settings, Sun } from 'lucide-react'
import { toast } from 'sonner'
import Account from './Account'
import ProfileForm from './ProfileForm'
import ChangePassword from './ChangePassword'

export default function Setting() {
  const { setProfile } = useAppContext()
  const refreshToken = getRefreshTokenFromLocalStorage()

  const [view, setView] = useState<'profile' | 'changePassword'>('profile')
  const { theme, setTheme } = useTheme()

  const handleViewChange = (view: 'profile' | 'changePassword') => {
    setView(view)
  }

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
      toast.success('Đăng xuất thành công')
    }
  }

  return (
    <div className='min-h-screen bg-background p-4 md:p-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='grid grid-cols-1 lg:grid-cols-10 gap-6'>
          {view === 'profile' ? <ProfileForm /> : <ChangePassword />}

          <div className='lg:col-span-3'>
            <div className='space-y-6'>
              <Account />

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Settings className='h-5 w-5' />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {theme === 'dark' ? <Moon className='h-4 w-4' /> : <Sun className='h-4 w-4' />}
                      <span className='text-sm font-medium'>Dark Mode</span>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                  </div>

                  <Separator />

                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Change Password</span>
                    <Switch
                      checked={view === 'changePassword'}
                      onCheckedChange={(checked) => handleViewChange(checked ? 'changePassword' : 'profile')}
                    />
                  </div>
                  <Separator />
                  <Button
                    variant='destructive'
                    className='w-full flex items-center gap-2 bg-primary hover:bg-primary/80 cursor-pointer'
                    onClick={handleLogout}
                  >
                    <LogOut className='h-4 w-4' />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
