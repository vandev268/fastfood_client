import { useState } from 'react'
import MobileMenu from './MobileMenu'
import SearchInput from './SearchInput'
import UserActions from './UserActions'
import NavItems from './NavItems'
import { Link } from 'react-router'
import Config from '@/constants/config'
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className='bg-white sticky top-0 z-40 shadow-sm'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between gap-2 h-16'>
          <div className='flex-shrink-0'>
            <Link to='/' className='flex items-center space-x-2'>
              <img alt='logo' src={Config.LogoBaseUrl} className='w-10 h-10 flex items-center justify-center' />
              <span className='font-bold text-xl text-gray-900 hidden sm:block'>FaFo</span>
            </Link>
          </div>
          <NavItems />

          <div className='hidden sm:block flex-1 max-w-md mx-8'>
            <SearchInput />
          </div>

          <div className='flex items-center space-x-2'>
            <UserActions />
            <MobileMenu isOpen={isMobileMenuOpen} onToggle={toggleMobileMenu} />
          </div>
        </div>

        <div className='sm:hidden pb-4'>
          <SearchInput />
        </div>
      </div>
    </header>
  )
}

export default Header
