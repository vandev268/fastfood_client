import React from 'react'
import { Link } from 'react-router'

interface MobileMenuProps {
  isOpen: boolean
  onToggle: () => void
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onToggle }) => {
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Reservation', href: '/reservation' }
  ]

  return (
    <>
      <button onClick={onToggle} className='md:hidden p-2 text-gray-700 transition-colors duration-200 cursor-pointer'>
        <div className='w-6 h-6 flex flex-col justify-center items-center'>
          <span
            className={`bg-current h-0.5 w-6 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-0.5' : ''}`}
          ></span>
          <span className={`bg-current h-0.5 w-6 transition-all duration-300 my-1 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span
            className={`bg-current h-0.5 w-6 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-0.5' : ''}`}
          ></span>
        </div>
      </button>

      {isOpen && (
        <div className='md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50'>
          <nav className='px-4 py-4 space-y-3'>
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className='block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200'
                onClick={onToggle}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}

export default MobileMenu
