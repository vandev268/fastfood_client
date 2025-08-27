import { Link, useLocation } from 'react-router'
import { ChefHat, Table2, Calendar, ChevronUp, ConciergeBell, PackageCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

const navigationItems = [
  {
    name: 'Giao Hàng',
    href: '/employee/deliveries',
    icon: PackageCheck
  },
  {
    name: 'Đặt Bàn',
    href: '/employee/reservations',
    icon: Calendar
  },
  {
    name: 'Đơn Hàng',
    href: '/employee/orders',
    icon: ConciergeBell
  },
  {
    name: 'Nhà Bếp',
    href: '/employee/kitchen',
    icon: ChefHat
  },
  {
    name: 'Duyệt Bàn',
    href: '/employee/tables',
    icon: Table2
  }
]

export default function SideNav() {
  const location = useLocation()
  const [visible, setVisible] = useState(true)
  const [showToggleButton, setShowToggleButton] = useState(!visible)
  const navRef = useRef<HTMLDivElement>(null)

  const toggleVisibility = () => {
    setVisible(!visible)
  }

  useEffect(() => {
    if (visible) {
      setShowToggleButton(false)
    } else {
      const timer = setTimeout(() => {
        setShowToggleButton(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [visible])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (visible && navRef.current && !navRef.current.contains(event.target as Node)) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, setVisible])

  return (
    <>
      {showToggleButton && (
        <div className='fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300'>
          <button
            onClick={toggleVisibility}
            className={cn(
              'bg-white border-t border-l border-r border-gray-200 shadow-lg hover:bg-gray-50 transition-all duration-300 cursor-pointer',
              'flex items-center justify-center w-12 h-6 rounded-t-md',
              'transform hover:scale-105 active:scale-95'
            )}
            aria-label='Show navigation'
          >
            <div className='transition-transform duration-300 rotate-0'>
              <ChevronUp className='h-5 w-5 text-gray-600' />
            </div>
          </button>
        </div>
      )}

      <div
        ref={navRef}
        className={cn(
          'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out w-full max-w-md',
          visible ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]'
        )}
      >
        <nav className='bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden'>
          <div className='flex flex-wrap justify-center gap-3 p-3'>
            {navigationItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/employee' && location.pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center space-y-1 transition-colors duration-200',
                    'hover:bg-yellow-5 active:bg-gray-100 rounded-lg p-2 min-w-[60px]',
                    isActive ? 'text-yellow-600 bg-yellow-50' : 'text-gray-600 hover:text-yellow-600'
                  )}
                >
                  <div className='relative'>
                    <item.icon className={'h-6 w-6'} />
                  </div>
                  <span className={'text-xs font-medium'}>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
