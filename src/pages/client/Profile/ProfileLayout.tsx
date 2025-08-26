import { Outlet, useLocation } from 'react-router'
import UserSideNav from './UserSideNav'
import OrderStatusTab from './OrderStatusTab'
import ReservationStatusTab from './ReservationStatusTab'

export default function ProfileLayout() {
  const location = useLocation()
  return (
    <div className='bg-neutral-100 py-4 text-sm text-gray-600'>
      <div className='max-w-6xl px-4 mx-auto'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-12 items-start'>
          <div className='md:col-span-4 lg:col-span-3 sticky top-18'>
            <UserSideNav />
          </div>
          <div className='md:col-span-8 lg:col-span-9'>
            {location.pathname.includes('orders-history') && (
              <div className='sticky top-16 z-10 bg-neutral-100'>
                <div className='overflow-x-auto'>
                  <OrderStatusTab />
                </div>
              </div>
            )}
            {location.pathname.includes('reservations') && (
              <div className='sticky top-16 z-10 bg-neutral-100'>
                <div className='overflow-x-auto'>
                  <ReservationStatusTab />
                </div>
              </div>
            )}
            <div>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
