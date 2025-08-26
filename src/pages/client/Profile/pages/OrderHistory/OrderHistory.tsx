import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { OrderStatus, OrderType } from '@/constants/order'
import { PaymentMethod } from '@/constants/payment'
import { useQuery } from '@/hooks/useQuery'
import { handleError } from '@/lib/utils'
import { useCreatePaymentLinkMutation } from '@/queries/usePayment'
import { Eye, MoreVertical, CreditCard, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import OrderDetail from './OrderDetail'
import { useProfileOrdersQuery } from '@/queries/useProfile'
import { orderSocket, reviewSocket } from '@/lib/sockets'
import { useAppContext } from '@/components/AppProvider'
import { useChangeOrderStatusMutation } from '@/queries/useOrder'
import { toast } from 'sonner'
import {
  formatCurrency,
  formatDateTimeToLocaleString,
  formatOrderStatusColor,
  formatOrderStatusText
} from '@/lib/format'

export default function OrderHistory({ orderType }: { orderType: keyof typeof OrderType }) {
  const { isAuth } = useAppContext()
  const query = useQuery()
  const status = query.get('status') || 'All'

  const { data, refetch } = useProfileOrdersQuery()
  const orders = useMemo(() => data?.data.orders || [], [data?.data.orders])

  useEffect(() => {
    if (isAuth) {
      reviewSocket.connect()
      orderSocket.connect()
    } else {
      reviewSocket.disconnect()
      orderSocket.disconnect()
      return
    }

    reviewSocket.on('recieved-review', () => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    orderSocket.on('changed-order-status', () => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    return () => {
      reviewSocket.off('recieved-review')
      orderSocket.off('changed-order-status')
      reviewSocket.disconnect()
      orderSocket.disconnect()
    }
  }, [isAuth, refetch])

  const filteredOrders = useMemo(() => {
    if (status === 'All') {
      return orders.filter((order) => order.orderType === orderType)
    }
    return orders.filter((order) => order.orderType === orderType && order.status === status)
  }, [orders, orderType, status])

  const createPaymentLink = useCreatePaymentLinkMutation()
  const changeOrderStatusMutation = useChangeOrderStatusMutation()

  const handlePaymentAgain = async (orderId: number) => {
    if (createPaymentLink.isPending) return
    try {
      const result = await createPaymentLink.mutateAsync({ orderId })
      window.location.href = result.data.url
    } catch (error) {
      handleError(error)
    }
  }

  const handleCancelOrder = async (orderId: number) => {
    if (changeOrderStatusMutation.isPending) return
    try {
      await changeOrderStatusMutation.mutateAsync({
        orderId,
        body: {
          status: OrderStatus.Cancelled
        }
      })
      toast.success('Đã hủy đơn hàng thành công')
      refetch()
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[700px]'>
        <div>
          {filteredOrders?.map((order) => (
            <div key={order.id} className='mt-4 rounded-sm border border-gray-200 bg-white p-6 text-gray-800 shadow-sm'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <h2 className='text-lg font-semibold mb-1'>Đơn hàng #{order.id}</h2>
                  <div className='flex items-center gap-4'>
                    <span className={formatOrderStatusColor({ status: order.status })}>
                      {formatOrderStatusText(order.status)}
                    </span>
                    <span className='text-sm text-gray-500'>
                      Đặt lúc: {formatDateTimeToLocaleString(order.createdAt)}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <OrderDetail order={order}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Eye className='mr-2 h-4 w-4' />
                        Xem chi tiết
                      </DropdownMenuItem>
                    </OrderDetail>
                    {(order.payment.paymentMethod === PaymentMethod.MOMO ||
                      order.payment.paymentMethod === PaymentMethod.VNPay) &&
                      order.payment.paidAt === null && (
                        <DropdownMenuItem
                          onClick={() => handlePaymentAgain(order.id)}
                          disabled={createPaymentLink.isPending}
                        >
                          <CreditCard className='mr-2 h-4 w-4' />
                          Thanh toán
                        </DropdownMenuItem>
                      )}
                    {(order.status === OrderStatus.Pending || order.status === OrderStatus.Confirmed) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className='text-destructive focus:text-destructive'
                          >
                            <X className='mr-2 h-4 w-4' />
                            Hủy đơn hàng
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận hủy đơn hàng?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn hủy đơn hàng #
                              <span className='font-bold text-primary rounded'>{order.id}</span>? Hành động này không
                              thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Không</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={changeOrderStatusMutation.isPending}
                              className=''
                            >
                              {changeOrderStatusMutation.isPending ? 'Đang hủy...' : 'Hủy đơn hàng'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  {order.orderType === OrderType.Delivery && order.deliveryAddress && (
                    <div className='p-3 rounded-lg border border-dashed'>
                      <h4 className='font-medium text-blue-900 mb-2 flex items-center'>
                        <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                        Thông tin giao hàng
                      </h4>
                      <div className='text-sm space-y-1'>
                        <p>
                          <span className='font-medium'>Người nhận:</span> {order.deliveryAddress.recipientName}
                        </p>
                        <p>
                          <span className='font-medium'>SĐT:</span> {order.deliveryAddress.recipientPhone}
                        </p>
                        <p>
                          <span className='font-medium'>Địa chỉ:</span> {order.deliveryAddress.detailAddress},{' '}
                          {order.deliveryAddress.ward.name && `${order.deliveryAddress.ward.name}, `}
                          {order.deliveryAddress.district.name}, {order.deliveryAddress.province.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.orderType === OrderType.DineIn && (
                    <div className='border border-dashed p-3 rounded-lg'>
                      <h4 className='font-medium text-green-900 mb-2 flex items-center'>
                        <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
                        Thông tin dine-in
                      </h4>
                      <div className='text-sm space-y-1'>
                        {order.tables && order.tables.length > 0 && (
                          <p>
                            <span className='font-medium'>Bàn:</span>{' '}
                            {order.tables.map((table) => table.code).join(', ')}
                          </p>
                        )}
                        {order.reservation && (
                          <>
                            <p>
                              <span className='font-medium'>Đặt bàn:</span> {order.reservation.guestName}
                            </p>
                            <p>
                              <span className='font-medium'>SĐT:</span> {order.reservation.guestPhone}
                            </p>
                            <p>
                              <span className='font-medium'>Số khách:</span> {order.reservation.numberOfGuest} người
                            </p>
                            <p>
                              <span className='font-medium'>Thời gian đặt:</span>{' '}
                              {formatDateTimeToLocaleString(order.reservation.reservationTime)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className='space-y-3'>
                  <div className='p-3 rounded-lg border border-dashed'>
                    <h4 className='font-medium text-gray-900 mb-2 flex items-center'>
                      <span className='w-2 h-2 bg-gray-500 rounded-full mr-2'></span>
                      Thông tin thanh toán
                    </h4>
                    <div className='text-sm text-gray-700 space-y-1'>
                      <p>
                        <span className='font-medium'>Phương thức:</span> {order.payment.paymentMethod}
                      </p>
                      {order.payment.paidAt && (
                        <p>
                          <span className='font-medium'>Thanh toán lúc:</span>{' '}
                          {formatDateTimeToLocaleString(order.payment.paidAt)}
                        </p>
                      )}
                      <div className='mt-3 pt-2 border-t border-gray-200'>
                        <p className='text-lg font-semibold text-primary'>
                          Tổng tiền: {formatCurrency(order.finalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
