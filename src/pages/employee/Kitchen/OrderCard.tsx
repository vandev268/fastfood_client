import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ChefHat, ClipboardCheck, RotateCcw } from 'lucide-react'
import { subMinutes, isAfter, formatDistanceToNow } from 'date-fns'
import { handleError, parseVariantInfo } from '@/lib/utils'
import type { OrderDetailType } from '@/schemaValidations/order.schema'
import { KitchenOrderStatus, OrderStatus, type OrderStatusType } from '@/constants/order'
import { TypeProduct } from '@/constants/product'
import { useChangeOrderStatusMutation } from '@/queries/useOrder'
import { toast } from 'sonner'
import {
  formatDateTimeToLocaleString,
  formatOrderStatusColor,
  formatOrderStatusText,
  formatOrderTypeText
} from '@/lib/format'

export function OrderCard({ order }: { order: OrderDetailType }) {
  const timeAgo = formatDistanceToNow(order.createdAt, { addSuffix: true })
  const isNewOrder = (createdAt: Date) => {
    const now = new Date()
    const threshold = subMinutes(now, 30)
    return isAfter(createdAt, threshold)
  }

  const changeOrderStatusMutation = useChangeOrderStatusMutation()
  const handleChangeStatus = async (status: OrderStatusType) => {
    if (changeOrderStatusMutation.isPending) return
    try {
      await changeOrderStatusMutation.mutateAsync({ orderId: order.id, body: { status } })
      toast.success(`Order status updated to ${formatOrderStatusText(status)}`)
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <Card className='w-full max-w-xs shadow-sm'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>#{order.id}</CardTitle>
          <div className='flex items-center gap-1'>
            {isNewOrder(order.createdAt) && (
              <span className='bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-30 text-xs font-medium px-2.5 py-0.5 rounded-full'>
                New
              </span>
            )}
            <span className={formatOrderStatusColor({ status: order.status })}>
              {formatOrderStatusText(order.status)}
            </span>
          </div>
        </div>
        <p className='text-xs text-gray-500 mt-1'>
          {formatDateTimeToLocaleString(order.createdAt)} ({timeAgo})
        </p>
      </CardHeader>
      <CardContent className='text-sm text-gray-700'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between gap-2'>
            <span className='font-sm'>Loại đơn hàng:</span>
            <span className='font-medium'>{formatOrderTypeText(order.orderType)}</span>
          </div>
          <div className='flex items-center justify-between gap-2'>
            <span className='font-sm'>Khách hàng:</span>
            <span className='font-medium'>{order.customerName || 'Khách hàng'}</span>
          </div>
        </div>

        <h3 className='font-semibold my-2'>Sản phẩm ({order.orderItems.length})</h3>
        <ul className='space-y-1'>
          {order.orderItems.map((item) => (
            <div className='mt-1 flex flex-col items-start' key={item.id}>
              {(() => {
                if (!item.variant) {
                  return (
                    <span className='text-sm text-gray-800 font-semibold'>
                      x{item.quantity} {item.productName}
                    </span>
                  )
                } else {
                  if (!item.variant.product) {
                    return (
                      <div>
                        <span className='text-sm text-gray-800 font-semibold'>
                          x{item.quantity} {item.productName}
                        </span>
                        {item.variant.value !== 'default' && (
                          <span className='text-sm text-gray-600'>Type: {item.variant.value}</span>
                        )}
                      </div>
                    )
                  }
                  const variantInfo = parseVariantInfo(item.variant.value, item.variant.product.variantsConfig)
                  if (!variantInfo || variantInfo.length === 0) {
                    return (
                      <div>
                        <p className='text-sm text-gray-800 font-semibold'>
                          x{item.quantity} {item.productName}
                        </p>
                        {item.variant.product.type === TypeProduct.FixedCombo ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: item.variant.product.shortDescription }}
                            className='text-sm text-gray-600 ml-4'
                          />
                        ) : (
                          <>
                            {item.variant.value !== 'default' && (
                              <span className='text-sm text-gray-600'>Type: {item.variant.value}</span>
                            )}
                          </>
                        )}
                      </div>
                    )
                  }
                  return (
                    <>
                      <p className='text-sm text-gray-800 font-semibold'>
                        x{item.quantity} {item.productName}
                      </p>
                      {variantInfo.map((info) => (
                        <div className='pl-4'>
                          <span key={info.type} className='text-sm text-gray-600'>
                            {info.type}: {info.value}
                          </span>
                        </div>
                      ))}
                    </>
                  )
                }
              })()}
            </div>
          ))}
        </ul>
      </CardContent>
      <CardFooter className='flex flex-col gap-2'>
        {order.status === KitchenOrderStatus.Pending && (
          <div className='text-sm text-gray-500 text-center'>Đang chờ xác nhận • Chỉ xem</div>
        )}
        {order.status === KitchenOrderStatus.Confirmed && (
          <Button
            className='w-full bg-blue-600 hover:bg-blue-800 cursor-pointer'
            onClick={() => handleChangeStatus(OrderStatus.Preparing)}
          >
            <ChefHat className='h-5 w-5' /> Bắt đầu nấu
          </Button>
        )}
        {order.status === KitchenOrderStatus.Preparing && (
          <Button
            className='w-full bg-green-600 hover:bg-green-800 cursor-pointer'
            onClick={() => handleChangeStatus(OrderStatus.Ready)}
          >
            <ClipboardCheck className='h-4 w-4 mr-2' /> Hoàn tất
          </Button>
        )}
        {(order.status === KitchenOrderStatus.Confirmed || order.status === KitchenOrderStatus.Preparing) && (
          <Button
            variant='outline'
            className='w-full text-red-600 border-red-200 hover:text-red-700 hover:border-red-300 hover:bg-white cursor-pointer'
            onClick={() => handleChangeStatus(OrderStatus.CancelledByKitchen)}
          >
            <XCircle className='h-5 w-5' /> Bếp hủy
          </Button>
        )}
        {(order.status === KitchenOrderStatus.Ready || order.status === KitchenOrderStatus.CancelledByKitchen) && (
          <>
            <Button
              variant='outline'
              className='w-full border-gray-300 cursor-pointer'
              onClick={() => handleChangeStatus(OrderStatus.Confirmed)}
            >
              <RotateCcw className='h-5 w-5' /> Mở lại
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
