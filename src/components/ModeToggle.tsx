import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
import { useTheme } from './ThemeProvider'

export function ModeToggle({
  variant = 'outline'
}: {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}) {
  const { theme, setTheme } = useTheme()
  return (
    <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant={variant} size='icon'>
      {theme === 'dark' ? (
        <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all' />
      ) : (
        <Moon className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all' />
      )}
    </Button>
  )
}
