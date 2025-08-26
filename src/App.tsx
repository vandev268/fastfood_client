import { Toaster } from 'sonner'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <h1>Fast Food Website</h1>
      <Toaster closeButton />
    </ThemeProvider>
  )
}

export default App
