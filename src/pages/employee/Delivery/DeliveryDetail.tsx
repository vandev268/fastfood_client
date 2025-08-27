import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PackageCheck } from 'lucide-react'
import type { OrderDetailType } from '@/schemaValidations/order.schema'
import { OrderStatus, type OrderStatusType } from '@/constants/order'
import { handleError, parseVariantInfo } from '@/lib/utils'
import { PaymentMethod } from '@/constants/payment'
import { TypeProduct } from '@/constants/product'
import { CouponDiscountType } from '@/constants/coupon'
import { useChangeOrderStatusMutation } from '@/queries/useOrder'
import {
  formatCurrency,
  formatDateTimeToLocaleString,
  formatDateToLocaleString,
  formatOrderStatusColor,
  formatOrderStatusText,
  formatOrderTypeText,
  formatPaymentMethodText
} from '@/lib/format'
import { toast } from 'sonner'

export function DeliveryDetail({
  order,
  setOrder
}: {
  order: OrderDetailType | null
  setOrder: (order: OrderDetailType | null) => void
}) {
  const changeOrderStatusMutation = useChangeOrderStatusMutation()
  const handleChangeStatus = async (status: OrderStatusType) => {
    if (changeOrderStatusMutation.isPending || !order) return
    try {
      await changeOrderStatusMutation.mutateAsync({
        orderId: order.id,
        body: {
          status
        }
      })
      toast.success('Cập nhật trạng thái đơn hàng thành công')
      setOrder(null)
    } catch (error) {
      handleError(error)
    }
  }

  if (!order) return null
  return (
    <Dialog
      open={Boolean(order)}
      onOpenChange={() => {
        setOrder(null)
      }}
    >
      <DialogContent className='sm:max-w-[900px] max-h-screen p-6 gap-0 overflow-x-auto' aria-describedby={undefined}>
        <DialogHeader className='pb-4'>
          <DialogTitle className='text-xl font-semibold'>Chi tiết đơn hàng #{order.id}</DialogTitle>
        </DialogHeader>

        <div className='flex flex-wrap gap-4'>
          <div className='flex flex-[50] flex-col gap-4'>
            <div className='p-4 border rounded-lg border-gray-200'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium'>Thông tin đơn hàng</h3>
                <span className={formatOrderStatusColor({ status: order.status })}>
                  {formatOrderStatusText(order.status)}
                </span>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm text-gray-800'>Mã đơn hàng:</span>
                  <span className='font-sm'>#{order.id}</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm text-gray-800'>Loại:</span>
                  <span className='font-sm'>{formatOrderTypeText(order.orderType)}</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm text-gray-800'>Đặt hàng:</span>
                  <span className='font-sm'>{formatDateTimeToLocaleString(order.createdAt)}</span>
                </div>

                {order.payment.paymentMethod === PaymentMethod.COD ||
                order.payment.paymentMethod === PaymentMethod.Cash ? (
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-sm text-gray-800'>Thanh toán:</span>
                    <span className='font-sm'>{formatPaymentMethodText(order.payment.paymentMethod)}</span>
                  </div>
                ) : (
                  <div>
                    <p className='font-sm'>Thanh toán:</p>
                    <div className='pl-4'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='font-sm text-gray-800'>Phương thức:</span>
                        <span className='font-sm'>{formatPaymentMethodText(order.payment.paymentMethod)}</span>
                      </div>
                      {order.payment.paidAt ? (
                        <div className='flex items-center justify-between gap-2'>
                          <span className='font-sm text-gray-800'>Thời gian:</span>
                          <span className='font-sm'>{formatDateToLocaleString(order.payment.paidAt)}</span>
                        </div>
                      ) : (
                        <div className='flex items-center justify-between gap-2'>
                          <span className='font-sm text-gray-800'>Thời gian:</span>
                          <span className='font-sm'>Chưa thanh toán</span>
                        </div>
                      )}
                      {order.payment.transactionId && (
                        <div className='flex items-center justify-between gap-2'>
                          <span className='font-sm text-gray-800'>Mã giao dịch:</span>
                          <span className='font-sm'>{order.payment.transactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className='p-4 border rounded-lg border-gray-200'>
              <h3 className='text-lg font-medium mb-4'>Thông tin người nhận</h3>
              {order.deliveryAddress ? (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-sm text-gray-800'>Họ và tên:</span>
                    <span className='font-sm'>{order.deliveryAddress.recipientName}</span>
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-sm text-gray-800'>Số điện thoại:</span>
                    <span className='font-sm'>{order.deliveryAddress.recipientPhone}</span>
                  </div>
                  <div>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-sm text-gray-800'>Địa chỉ:</span>
                      <span className='font-sm'>
                        {order.deliveryAddress.detailAddress},{' '}
                        {order.deliveryAddress.ward.name && `${order.deliveryAddress.ward.name}, `}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span></span>
                      <span className='font-sm'>
                        {order.deliveryAddress.district.name}, {order.deliveryAddress.province.name}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between gap-2 bg-gray-100 p-2 rounded-lg mt-2'>
                    <span className='font-sm text-gray-800'>Ghi chú:</span>
                    <span className='font-sm'>{order.note || ''}</span>
                  </div>
                </div>
              ) : (
                <p className='text-gray-500'>Đơn hàng chưa có thông tin người nhận</p>
              )}
            </div>
          </div>

          <div className='flex flex-col flex-[50] gap-4'>
            <div className='p-4 border rounded-lg border-gray-200'>
              <h3 className='text-lg font-medium mb-4'>Danh sách sản phẩm</h3>

              <div className='space-y-2'>
                {order.orderItems.map((item) => (
                  <div className='mt-1 flex flex-col' key={item.id}>
                    {(() => {
                      if (!item.variant) {
                        return (
                          <div className='flex items-center justify-between gap-2'>
                            <p className='text-sm text-gray-800 font-semibold'>
                              x{item.quantity} {item.productName}
                            </p>
                            <p className='text-sm text-gray-800 font-semibold'>{formatCurrency(item.price)}</p>
                          </div>
                        )
                      } else {
                        if (!item.variant.product) {
                          return (
                            <div>
                              <div className='flex items-center justify-between gap-2'>
                                <p className='text-sm text-gray-800 font-semibold'>
                                  x{item.quantity} {item.productName}
                                </p>
                                <p className='text-sm text-gray-800 font-semibold'>
                                  {formatCurrency(item.variant.price)}
                                </p>
                              </div>
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
                              <div className='flex items-center justify-between gap-2'>
                                <p className='text-sm text-gray-800 font-semibold'>
                                  x{item.quantity} {item.productName}
                                </p>
                                <p className='text-sm text-gray-800 font-semibold'>
                                  {formatCurrency(item.variant.price)}
                                </p>
                              </div>

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
                            <div className='flex items-center justify-between gap-2'>
                              <p className='text-sm text-gray-800 font-semibold'>
                                x{item.quantity} {item.productName}
                              </p>
                              <p className='text-sm text-gray-800 font-semibold'>
                                {formatCurrency(item.variant.price)}
                              </p>
                            </div>
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
              </div>

              <div className='mt-8 pt-4 border-t border-gray-100 space-y-2'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-sm text-muted-foreground'>Tổng tiền:</span>
                  <span className='text-sm font-semibold text-gray-800'>{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex flex-col'>
                    <span className='text-sm text-muted-foreground'>Phí:</span>
                    <span className='text-sm text-muted-foreground'>({formatCurrency(30000)} Ship + 10% VAT)</span>
                  </div>
                  <span className='text-sm font-semibold text-gray-800'>{formatCurrency(order.feeAmount)}</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-sm text-muted-foreground'>
                    Giảm giá:{' '}
                    {order.coupon
                      ? `(${order.coupon.discountType === CouponDiscountType.Amount ? `-${formatCurrency(order.coupon.discountValue)}` : `-${order.coupon.discountValue}%`})`
                      : ''}
                  </span>
                  <span className='text-sm font-semibold text-gray-800'>{formatCurrency(order.discountAmount)}</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-md font-semibold text-gray-800'>Thanh toán:</span>
                  <span className='text-lg font-semibold text-primary'>{formatCurrency(order.finalAmount)}</span>
                </div>
              </div>
            </div>
            {(order.status === OrderStatus.Pending ||
              order.status === OrderStatus.Confirmed ||
              order.status === OrderStatus.Preparing) && (
              <div className='p-4 border rounded-lg border-gray-200'>
                <h3 className='text-lg font-medium mb-4'>Cài đặt</h3>
                <div className='flex items-center gap-3'>
                  <Button
                    className='flex-[50] bg-red-600 hover:bg-red-800 cursor-pointer'
                    onClick={() => handleChangeStatus(OrderStatus.Cancelled)}
                  >
                    <PackageCheck className='h-5 w-5' />
                    Hủy đơn hàng
                  </Button>
                  <Button
                    className='flex-[50] bg-green-600 hover:bg-green-800 cursor-pointer'
                    onClick={() => handleChangeStatus(OrderStatus.Confirmed)}
                  >
                    <PackageCheck className='h-5 w-5' />
                    Xác nhận đơn hàng
                  </Button>
                </div>
              </div>
            )}
            {order.status === OrderStatus.OutForDelivery && (
              <div className='p-4 border rounded-lg border-gray-200'>
                <h3 className='text-lg font-medium mb-4'>Cài đặt</h3>
                <div className='flex items-center gap-3'>
                  <Button
                    className='flex-[50] bg-red-600 hover:bg-red-800 cursor-pointer'
                    onClick={() => handleChangeStatus(OrderStatus.Cancelled)}
                  >
                    <PackageCheck className='h-5 w-5' />
                    Khách không nhận hàng
                  </Button>
                  <Button
                    className='flex-[50] bg-green-600 hover:bg-green-800 cursor-pointer'
                    onClick={() => handleChangeStatus(OrderStatus.Completed)}
                  >
                    <PackageCheck className='h-5 w-5' />
                    Khách đã nhận hàng
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
