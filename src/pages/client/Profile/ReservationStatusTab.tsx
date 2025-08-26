import { ReservationStatus } from '@/constants/reservation'
import { useQuery } from '@/hooks/useQuery'
import classNames from 'classnames'
import { createSearchParams, Link } from 'react-router'
const ReservationTabs = [
  { status: 'All', name: 'Tất cả' },
  { status: ReservationStatus.Pending, name: 'Chờ xử lý' },
  { status: ReservationStatus.Confirmed, name: 'Xác nhận' },
  { status: ReservationStatus.Arrived, name: 'Đã đến' },
  { status: ReservationStatus.Completed, name: 'Hoàn thành' },
  { status: ReservationStatus.Cancelled, name: 'Đã hủy' }
]

export default function ReservationStatusTab() {
  const query = useQuery()
  const status = query.get('status') || 'All'

  return (
    <div className='min-w-[700px] flex rounded-t-sm'>
      {ReservationTabs.map((tab) => (
        <Link
          key={tab.status}
          to={{
            pathname: '/profile/reservations',
            search: createSearchParams({
              status: String(tab.status)
            }).toString()
          }}
          className={classNames('flex flex-1 items-center justify-center border-b-2 bg-white py-4 text-center', {
            'border-b-primary text-priborder-b-primary': status === tab.status,
            'border-b-black/10 text-gray-900': status !== tab.status
          })}
        >
          {tab.name}
        </Link>
      ))}
    </div>
  )
}
