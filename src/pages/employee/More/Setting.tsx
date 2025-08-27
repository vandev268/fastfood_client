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

export default function Setting({
  view,
  setView
}: {
  view: string
  setView: (view: 'profile' | 'changePassword') => void
}) {
  const { theme, setTheme } = useTheme()
  const { setProfile } = useAppContext()
  const refreshToken = getRefreshTokenFromLocalStorage()

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
          <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
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
  )
}
