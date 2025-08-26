import { PaymentStatus } from '@/constants/payment'
import { CircleCheck, CircleX } from 'lucide-react'
import { Link, useLocation } from 'react-router'

export default function PaymentCallback() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const paymentStatus = searchParams.get('status')
  const orderId = searchParams.get('orderId')

  return paymentStatus === PaymentStatus.Failed ? (
    <div className='flex flex-col items-center justify-center min-h-[100dvh] px-4 md:px-6 py-12 md:py-24 lg:py-32'>
      <div className='max-w-md text-center space-y-4'>
        <div className='bg-red-100 dark:bg-red-900 rounded-full p-4 inline-flex'>
          <CircleX className='h-8 w-8 text-red-500 dark:text-red-400' />
        </div>
        <h1 className='text-2xl font-semibold tracking-tighter sm:text-3xl md:text-4xl'>Thanh Toán Thất Bại</h1>
        <p className='text-gray-500 dark:text-gray-400 md:text-xl mb-8'>
          Vui lòng kiểm tra lại đơn hàng{' '}
          <Link to='/profile/orders-history/online'>
            <span className='underline text-primary font-bold text-xl'>#{orderId}</span>
          </Link>{' '}
          và tiến hành thanh toán lại.
        </p>
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center min-h-[100dvh] px-4 md:px-6 py-12 md:py-24 lg:py-32'>
      <div className='max-w-md text-center space-y-4'>
        <div className='bg-primary/10 dark:bg-primary rounded-full p-4 inline-flex'>
          <CircleCheck className='h-8 w-8 text-primary dark:text-primary/40' />
        </div>
        <h1 className='text-2xl font-semibold tracking-tighter sm:text-3xl md:text-4xl'>Đặt Hàng Thành Công</h1>
        <p className='text-gray-500 dark:text-gray-400 md:text-xl mb-8'>Cảm ơn bạn đã mua hàng!</p>
        <div className='flex items-center gap-4'>
          <Link
            to='/profile/orders-history/online'
            className='px-4 py-3 rounded-md font-semibold border-1 border-primary/90 text-gray-800 hover:text-white hover:bg-primary'
          >
            Xem đơn hàng <span className='font-bold'>#{orderId}</span>
          </Link>
          <Link
            to='/'
            className='px-4 py-3 rounded-md font-semibold border-1 border-primary/90 text-gray-800 hover:text-white hover:bg-primary'
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  )
}
