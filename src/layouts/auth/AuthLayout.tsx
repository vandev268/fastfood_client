import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <div className='flex min-h-screen w-full flex-col relative'>
      <div className='min-h-screen flex items-center justify-center'>
        <Outlet />
      </div>
    </div>
  )
}
