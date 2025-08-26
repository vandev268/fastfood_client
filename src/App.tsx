import { Toaster } from 'sonner'
import { ThemeProvider } from './components/ThemeProvider'
import useRouteElements from './useRouteElements'

function App() {
  const routeElements = useRouteElements()

  return (
    <ThemeProvider>
      {routeElements}
      <Toaster closeButton />
    </ThemeProvider>
  )
}

export default App
