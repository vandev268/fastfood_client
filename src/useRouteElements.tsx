import { Navigate, Outlet, useLocation, useRoutes } from 'react-router'
import NotFound from './components/NotFound'
import { RoleName } from './constants/role'
import { useAppContext } from './components/AppProvider'
import AuthLayout from './layouts/auth'
import ManageLayout from './layouts/manage'
import ManageLogin from './pages/manage/Login'
import ManageRole from './pages/manage/Role'
import ManageUser from './pages/manage/User'
import ManageTag from './pages/manage/Tag'
import ManageCategory from './pages/manage/Category'
import ManageProduct from './pages/manage/Product'
import ManageTable from './pages/manage/Table'
import ManageCoupon from './pages/manage/Coupon'
import ManageSetting from './pages/manage/Setting'
import ManageOrderHistory from './pages/manage/Order'
import ManageReservationHistory from './pages/manage/Reservation'
import ClientLayout from './layouts/client'
import ForgotPassword from './pages/client/ForgotPassword'
import Login from './pages/client/Login'
import OAuth from './pages/client/OAuth'
import Register from './pages/client/Register'
import Product from './pages/client/Product'
import ProductDetail from './pages/client/ProductDetail'
import Cart from './pages/client/Cart'
import PaymentCallback from './pages/client/PaymentCallback'
import Checkout from './pages/client/Checkout'
import Reservation from './pages/client/Reservation'
import ProfileLayout from './pages/client/Profile'
import Information from './pages/client/Profile/pages/Information'
import ChangePassword from './pages/client/Profile/pages/ChangePassword'
import ReservationHistory from './pages/client/Profile/pages/ReservationHistory'
import OrderHistory from './pages/client/Profile/pages/OrderHistory'
import Home from './pages/client/Home'
import EmployeeLayout from './layouts/employee'
import EmployeeTable from './pages/employee/Table'
import EmployeeReservation from './pages/employee/Reservation'

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
      element: <ClientLayout />,
      children: [
        {
          path: 'oauth-google-callback',
          element: <OAuth />
        },
        {
          path: '',
          index: true,
          element: <Home />
        },
        {
          path: 'products',
          element: <Product />
        },
        {
          path: 'products/:productName',
          element: <ProductDetail />
        },
        {
          path: 'reservation',
          element: <Reservation />
        }
      ]
    },
    {
      path: '',
      element: <RejectedRoute />,
      children: [
        {
          path: '',
          element: <ClientLayout />,
          children: [
            {
              path: 'login',
              element: <Login />
            },
            {
              path: 'register',
              element: <Register />
            },
            {
              path: 'forgot-password',
              element: <ForgotPassword />
            }
          ]
        }
      ]
    },
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
              element: <ManageProduct />
            },
            {
              path: 'categories',
              element: <ManageCategory />
            },
            {
              path: 'tags',
              element: <ManageTag />
            },
            {
              path: 'coupons',
              element: <ManageCoupon />
            },
            {
              path: 'tables',
              element: <ManageTable />
            },
            {
              path: 'reservations',
              element: <ManageReservationHistory />
            },
            {
              path: 'orders',
              element: <ManageOrderHistory />
            },
            {
              path: 'users',
              element: <ManageUser />
            },
            {
              path: 'roles',
              element: <ManageRole />
            },
            {
              path: 'setting',
              element: <ManageSetting />
            }
          ]
        },
        {
          path: '',
          element: <ClientLayout />,
          children: [
            {
              path: 'cart',
              element: <Cart />
            },
            {
              path: 'checkout',
              element: <Checkout />
            },
            {
              path: 'profile',
              element: <ProfileLayout />,
              children: [
                {
                  path: '',
                  element: <Information />
                },
                {
                  path: 'change-password',
                  element: <ChangePassword />
                },
                {
                  path: 'reservations',
                  element: <ReservationHistory />
                },
                {
                  path: 'orders-history/online',
                  element: <OrderHistory orderType='Delivery' />
                },
                {
                  path: 'orders-history/dine-in',
                  element: <OrderHistory orderType='DineIn' />
                }
              ]
            }
          ]
        },
        {
          path: 'employee',
          element: <EmployeeLayout />,
          children: [
            {
              path: '',
              index: true,
              element: <h1>Order</h1>
            },
            {
              path: 'orders',
              element: <h1>Order</h1>
            },
            {
              path: 'deliveries',
              element: <h1>Delivery</h1>
            },
            {
              path: 'kitchen',
              element: <h1>Kitchen</h1>
            },
            {
              path: 'tables',
              element: <EmployeeTable />
            },
            {
              path: 'reservations',
              element: <EmployeeReservation />
            },
            {
              path: 'profile',
              element: <h1>Profile</h1>
            }
          ]
        }
      ]
    },
    {
      path: 'payment-callback',
      element: <PaymentCallback />
    },
    {
      path: '*',
      element: <NotFound />
    }
  ])

  return routeElements
}
