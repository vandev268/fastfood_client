import { useAppContext } from '@/components/AppProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import classNames from 'classnames'
import { Link, NavLink } from 'react-router'

export default function UserSideNav() {
  const { profile } = useAppContext()

  if (!profile) return null
  return (
    <div className='bg-white w-full px-4 rounded-md shadow-sm sticky top-4'>
      <div className='flex items-center border-b border-b-gray-200 py-4'>
        <Link to='/profile' className='h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-black/10'>
          <Avatar className='h-full w-full'>
            <AvatarImage src={profile.avatar ? profile.avatar : undefined} />
            <AvatarFallback className='uppercase'>{profile.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className='flex-grow pl-4'>
          <div className='mb-1 truncate font-semibold text-gray-600'>{profile?.name}</div>
          <Link to='/profile' className='flex items-center capitalize text-gray-500'>
            <svg
              width={12}
              height={12}
              viewBox='0 0 12 12'
              xmlns='http://www.w3.org/2000/svg'
              style={{ marginRight: 4 }}
            >
              <path
                d='M8.54 0L6.987 1.56l3.46 3.48L12 3.48M0 8.52l.073 3.428L3.46 12l6.21-6.18-3.46-3.48'
                fill='#9B9B9B'
                fillRule='evenodd'
              />
            </svg>
            Sửa hồ sơ
          </Link>
        </div>
      </div>
      <div className='mt-7 pb-4'>
        <NavLink
          to='/profile'
          className={({ isActive }) =>
            classNames('flex items-center capitalize  transition-colors', {
              'text-orange': isActive,
              'text-gray-600': !isActive
            })
          }
        >
          <div className='mr-3 h-[22px] w-[22px]'>
            <img src='https://cf.shopee.vn/file/ba61750a46794d8847c3f463c5e71cc4' alt='' className='h-full w-full' />
          </div>
          Tài khoản của tôi
        </NavLink>
        <NavLink
          to='/profile/change-password'
          className={({ isActive }) =>
            classNames('mt-4 flex items-center capitalize transition-colors', {
              'text-orange': isActive,
              'text-gray-600': !isActive
            })
          }
        >
          <div className='mr-3 h-[22px] w-[22px]'>
            <img src='https://cf.shopee.vn/file/ba61750a46794d8847c3f463c5e71cc4' alt='' className='h-full w-full' />
          </div>
          Đổi mật khẩu
        </NavLink>

        <NavLink
          to='/profile/reservations'
          className={({ isActive }) =>
            classNames('mt-4 flex items-center capitalize transition-colors', {
              'text-orange': isActive,
              'text-gray-600': !isActive
            })
          }
        >
          <div className='mr-3 h-[22px] w-[22px]'>
            <img src='https://cf.shopee.vn/file/f0049e9df4e536bc3e7f140d071e9078' alt='' className='h-full w-full' />
          </div>
          Đặt bàn
        </NavLink>

        <Accordion type='single' collapsible className='mt-4'>
          <AccordionItem value='orders'>
            <AccordionTrigger className='text-gray-600 hover:text-orange transition-colors py-2'>
              <div className='flex items-center'>
                <div className='mr-3 h-[22px] w-[22px]'>
                  <img
                    src='https://cf.shopee.vn/file/f0049e9df4e536bc3e7f140d071e9078'
                    alt=''
                    className='h-full w-full'
                  />
                </div>
                Đơn mua
              </div>
            </AccordionTrigger>
            <AccordionContent className='pl-8 space-y-2'>
              <NavLink
                to='/profile/orders-history/online'
                className={({ isActive }) =>
                  classNames('block py-2 capitalize transition-colors', {
                    'text-orange': isActive,
                    'text-gray-600': !isActive
                  })
                }
              >
                Trực tuyến
              </NavLink>
              <NavLink
                to='/profile/orders-history/dine-in'
                className={({ isActive }) =>
                  classNames('block py-2 capitalize transition-colors', {
                    'text-orange': isActive,
                    'text-gray-600': !isActive
                  })
                }
              >
                Tại chỗ
              </NavLink>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
