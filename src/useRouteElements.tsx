import { Navigate, Outlet, useLocation, useRoutes } from 'react-router'
import NotFound from './components/NotFound'
import { RoleName } from './constants/role'
import { useAppContext } from './components/AppProvider'
import AuthLayout from './layouts/auth'
import ManageLayout from './layouts/manage'
import ManageLogin from './pages/manage/Login'
import ManageRole from './pages/manage/Role'

const MANAGE_ROLE = [RoleName.Admin, RoleName.Manager] as string[]
const EMPLOYEE_ROLE = [RoleName.Admin, RoleName.Manager, RoleName.Employee] as string[]
function ProtectedRoute() {
  const { isAuth, profile } = useAppContext()
  const location = useLocation()
  if (location.pathname.startsWith('/manage')) {
    if (profile && MANAGE_ROLE.includes(profile.role.name)) {
      return isAuth ? <Outlet /> : <Navigate to='/manage/login' />
    } else {
      return isAuth ? <Navigate to='/' /> : <Navigate to='/login' />
    }
  } else if (location.pathname.startsWith('/employee')) {
    if (profile && EMPLOYEE_ROLE.includes(profile.role.name)) {
      return isAuth ? <Outlet /> : <Navigate to='/login' />
    } else {
      return isAuth ? <Navigate to='/' /> : <Navigate to='/login' />
    }
  } else {
    return isAuth ? <Outlet /> : <Navigate to='/login' />
  }
}
function RejectedRoute() {
  const { isAuth, profile } = useAppContext()
  if (isAuth && profile) {
    const lastPath = sessionStorage.getItem('last-path')
    let fallbackPath = '/'
    if (MANAGE_ROLE.includes(profile.role.name) && profile.role.name !== RoleName.Employee) {
      fallbackPath = '/manage/dashboard'
    } else if (profile.role.name === RoleName.Employee) {
      fallbackPath = '/employee'
    }
    return <Navigate to={lastPath || fallbackPath} />
  } else {
    return <Outlet />
  }
}

export default function useRouteElements() {
  const routeElements = useRoutes([
    {
      path: '',
      element: <RejectedRoute />,
      children: [
        {
          path: '',
          element: <AuthLayout />,
          children: [
            {
              path: 'manage/login',
              element: <ManageLogin />
            }
          ]
        }
      ]
    },
    {
      path: '',
      element: <ProtectedRoute />,
      children: [
        {
          path: 'manage',
          element: <ManageLayout />,
          children: [
            {
              path: 'dashboard',
              element: <h1>Dashboard</h1>
            },
            {
              path: 'products',
              element: <h1>Products</h1>
            },
            {
              path: 'categories',
              element: <h1>Categories</h1>
            },
            {
              path: 'tags',
              element: <h1>Tags</h1>
            },
            {
              path: 'coupons',
              element: <h1>Coupons</h1>
            },
            {
              path: 'tables',
              element: <h1>Tables</h1>
            },
            {
              path: 'reservations',
              element: <h1>Reservations</h1>
            },
            {
              path: 'orders',
              element: <h1>Orders</h1>
            },
            {
              path: 'users',
              element: <h1>Users</h1>
            },
            {
              path: 'roles',
              element: <ManageRole />
            },
            {
              path: 'setting',
              element: <h1>Setting</h1>
            }
          ]
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
