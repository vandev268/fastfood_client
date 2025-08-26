import { useRoutes } from 'react-router'
import NotFound from './components/NotFound'

export default function useRouteElements() {
  const routeElements = useRoutes([
    {
      path: '',
      element: <h1>Fast Food Website</h1>
    },
    {
      path: '*',
      element: <NotFound />
    }
  ])

  return routeElements
}
