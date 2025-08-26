import { useRoutes } from 'react-router'
import NotFound from './components/NotFound'
import AuthLayout from './layouts/auth'
import ManageLogin from './pages/manage/Login'

export default function useRouteElements() {
  const routeElements = useRoutes([
    {
      path: '',
      element: <AuthLayout />,
      children: [
        {
          path: 'manage/login',
          element: <ManageLogin />
        }
      ]
    },
    {
      path: '*',
      element: <NotFound />
    }
  ])

  return routeElements
}
