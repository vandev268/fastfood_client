import { Link, useLocation } from 'react-router'

export default function NavItems() {
  const location = useLocation()

  const navItems = [
    { name: 'Sản phẩm', href: '/products' },
    { name: 'Đặt bàn', href: '/reservation' }
  ]

  return (
    <nav className='hidden md:flex items-center space-x-8'>
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={`font-medium transition-colors duration-200 relative group ${
            location.pathname === item.href ? 'text-gray-800' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {item.name}
          <span
            className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
              location.pathname === item.href ? 'w-full' : 'w-0 group-hover:w-full'
            }`}
          ></span>
        </Link>
      ))}
    </nav>
  )
}
