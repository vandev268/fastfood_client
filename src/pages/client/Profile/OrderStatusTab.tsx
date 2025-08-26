import { OrderStatus, OrderType } from '@/constants/order'
import { useQuery } from '@/hooks/useQuery'
import classNames from 'classnames'
import { createSearchParams, Link, useLocation } from 'react-router'

const orderTabs = [
  { status: 'All', name: 'Tất cả', type: [OrderType.Delivery, OrderType.DineIn] },
  { status: OrderStatus.Pending, name: 'Chờ xác nhận', type: [OrderType.Delivery, OrderType.DineIn] },
  { status: OrderStatus.Confirmed, name: 'Xác nhận', type: [OrderType.Delivery, OrderType.DineIn] },
  { status: OrderStatus.OutForDelivery, name: 'Đang giao', type: [OrderType.Delivery] },
  { status: OrderStatus.Preparing, name: 'Đang chuẩn bị', type: [OrderType.DineIn] },
  { status: OrderStatus.Ready, name: 'Sẵn sàng', type: [OrderType.DineIn] },
  { status: OrderStatus.Served, name: 'Đã phục vụ', type: [OrderType.DineIn] },
  { status: OrderStatus.Completed, name: 'Hoàn thành', type: [OrderType.Delivery, OrderType.DineIn] },
  { status: OrderStatus.Cancelled, name: 'Đã hủy', type: [OrderType.Delivery, OrderType.DineIn] }
]

export default function OrderStatusTab() {
  const query = useQuery()
  const location = useLocation()

  const status = query.get('status') || 'All'
  const orderType = location.pathname.includes('online') ? OrderType.Delivery : OrderType.DineIn

  return (
    <div className='min-w-[700px] flex rounded-t-sm'>
      {orderTabs
        .filter((tab) => tab.type.includes(orderType))
        .map((tab) => (
          <Link
            key={tab.status}
            to={{
              pathname: `/profile/orders-history/${orderType === OrderType.Delivery ? 'online' : 'dine-in'}`,
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
