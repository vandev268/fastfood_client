import { Outlet } from 'react-router'
import SideNav from './SideNav'

export default function EmployeeLayout() {
  return (
    <div className='flex flex-col h-screen bg-gray-50 overflow-hidden'>
      <main className='flex-1 overflow-y-auto'>
        <Outlet />
      </main>
      <SideNav />
    </div>
  )
}
