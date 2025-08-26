import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Package, Clock, UserPen, MapPin, Calendar } from 'lucide-react'
import { OrderStatus, OrderType } from '@/constants/order'
import classNames from 'classnames'
import { parseVariantInfo } from '@/lib/utils'
import { PaymentMethod } from '@/constants/payment'
import Config from '@/constants/config'
import { CouponDiscountType } from '@/constants/coupon'
import type { OrderDetailType } from '@/schemaValidations/order.schema'
import AddReview from './AddReview'
import EditReview from './EditReview'
import {
  formatCurrency,
  formatDateTimeToLocaleString,
  formatOrderStatusColor,
  formatOrderStatusText
} from '@/lib/format'

export default function OrderDetail({ order, children }: { order: OrderDetailType; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const productNameSet = new Set(order.orderItems.map((item) => item.productName))

  const renderCustomerInfo = () => {
    if (order.orderType === OrderType.Takeaway) {
      return (
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Clock className='w-5 h-5 text-muted-foreground' />
            <h3 className='font-semibold'>Thông Tin Khách Hàng</h3>
          </div>
          <div className='flex flex-col items-start gap-3 p-4 border rounded-lg'>
            <div className='text-sm text-gray-800'>
              <h2>
                Khách hàng: <span className='font-semibold'>{order.customerName}</span>
              </h2>
              <p>
                Ghi chú: <span className='font-semibold'>{order.note || 'Không có ghi chú'}</span>
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (order.orderType === OrderType.DineIn) {
      return (
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Clock className='w-5 h-5 text-muted-foreground' />
            <h3 className='font-semibold'>Thông Tin Khách Hàng & Bàn</h3>
          </div>
          <div className='flex flex-col items-start gap-3 p-4 border rounded-lg'>
            {order.user ? (
              <div className='flex items-center gap-3 w-full'>
                <Avatar>
                  <AvatarImage src={order.user.avatar || ''} alt={order.customerName} />
                  <AvatarFallback>{order.customerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <p className='font-medium'>{order.user.name}</p>
                  <p className='text-sm text-muted-foreground'>{order.user.email}</p>
                </div>
              </div>
            ) : (
              <div className='text-sm text-gray-800'>
                <h2>
                  Khách hàng: <span className='font-semibold'>{order.customerName}</span>
                </h2>
              </div>
            )}

            {order.tables && order.tables.length > 0 && (
              <div className='text-sm text-gray-800 w-full mt-3'>
                <div className='flex items-center gap-2 mb-2'>
                  <MapPin className='w-4 h-4' />
                  <span className='font-semibold'>Thông tin bàn:</span>
                </div>
                <div className='space-y-1'>
                  {order.tables.map((table) => (
                    <p key={table.id}>
                      Bàn {table.code} - Sức chứa: {table.capacity} người - Vị trí: {table.location}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {order.reservation && (
              <div className='text-sm text-gray-800 w-full mt-3'>
                <div className='flex items-center gap-2 mb-2'>
                  <Calendar className='w-4 h-4' />
                  <span className='font-semibold'>Thông tin đặt bàn:</span>
                </div>
                <div className='space-y-1'>
                  <p>Tên khách: {order.reservation.guestName}</p>
                  <p>Số điện thoại: {order.reservation.guestPhone}</p>
                  <p>Số khách: {order.reservation.numberOfGuest} người</p>
                  <p>Thời gian đặt: {formatDateTimeToLocaleString(order.reservation.reservationTime)}</p>
                  {order.reservation.note && <p>Ghi chú đặt bàn: {order.reservation.note}</p>}
                </div>
              </div>
            )}

            <div className='text-sm text-gray-800 w-full mt-3'>
              <p>
                Ghi chú đơn hàng: <span className='font-semibold'>{order.note || 'Không có ghi chú'}</span>
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (order.orderType === OrderType.Delivery) {
      return (
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Clock className='w-5 h-5 text-muted-foreground' />
            <h3 className='font-semibold'>Thông Tin Khách Hàng & Giao Hàng</h3>
          </div>
          <div className='flex flex-col items-start gap-3 p-4 border rounded-lg'>
            {order.user ? (
              <div className='flex items-center gap-3'>
                <Avatar>
                  <AvatarImage src={order.user.avatar || ''} alt={order.customerName} />
                  <AvatarFallback>{order.customerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <p className='font-medium'>{order.user.name}</p>
                  <p className='text-sm text-muted-foreground'>{order.user.email}</p>
                </div>
              </div>
            ) : (
              <div className='text-sm text-gray-800'>
                <h2>
                  Khách hàng: <span className='font-semibold'>{order.customerName}</span>
                </h2>
              </div>
            )}

            {order.deliveryAddress && (
              <div className='text-sm text-gray-800 w-full mt-3'>
                <div className='flex items-center gap-2 mb-2'>
                  <MapPin className='w-4 h-4' />
                  <span className='font-semibold'>Thông tin giao hàng:</span>
                </div>
                <div className='space-y-1'>
                  <p>Người nhận: {order.deliveryAddress.recipientName}</p>
                  <p>Số điện thoại: {order.deliveryAddress.recipientPhone}</p>
                  <p>
                    Địa chỉ: {order.deliveryAddress.detailAddress},{' '}
                    {order.deliveryAddress.ward.name && `${order.deliveryAddress.ward.name}, `}
                    {order.deliveryAddress.district.name}, {order.deliveryAddress.province.name}
                  </p>
                  {order.deliveryAddress.deliveryNote && <p>Ghi chú giao hàng: {order.deliveryAddress.deliveryNote}</p>}
                </div>
              </div>
            )}

            <div className='text-sm text-gray-800 w-full mt-3'>
              <p>
                Ghi chú đơn hàng: <span className='font-semibold'>{order.note || 'Không có ghi chú'}</span>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='min-w-[55vw] min-h-[80vh] max-h-[100vh] overflow-y-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>Chi Tiết Đơn Hàng #{order.id}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {renderCustomerInfo()}

            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Package className='w-5 h-5 text-muted-foreground' />
                <h3 className='font-semibold'>Trạng Thái Đơn Hàng</h3>
              </div>
              <div className='p-4 border rounded-lg space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Trạng thái:</span>
                  <span className={formatOrderStatusColor({ status: order.status })}>
                    {formatOrderStatusText(order.status)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Ngày đặt:</span>
                  <span className='text-sm font-medium'>{formatDateTimeToLocaleString(order.createdAt)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Phương thức thanh toán:</span>
                  <span className='text-sm font-medium'>{order.payment.paymentMethod}</span>
                </div>
                {(order.payment.paymentMethod === PaymentMethod.MOMO ||
                  order.payment.paymentMethod === PaymentMethod.VNPay) && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Mã thanh toán:</span>
                    <span className='text-sm font-medium'>{order.payment.transactionId}</span>
                  </div>
                )}
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Thời gian thanh toán:</span>
                  <span className='text-sm font-medium'>
                    {order.payment.paidAt ? formatDateTimeToLocaleString(order.payment.paidAt) : 'Chưa thanh toán'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Tổng tiền:</span>
                  <span className='text-md font-bold text-primary'>{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col'>
                    <span className='text-sm text-muted-foreground'>Phí:</span>
                    <span className='text-sm text-muted-foreground'>
                      {order.orderType === OrderType.Delivery
                        ? `(${formatCurrency(30000)} Ship + 10% VAT)`
                        : order.orderType === OrderType.DineIn
                          ? '(10% VAT)'
                          : '(10% VAT)'}
                    </span>
                  </div>
                  <span className='text-md font-bold text-primary'>{formatCurrency(order.feeAmount)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Giảm giá:{' '}
                    {order.coupon
                      ? `(${order.coupon.discountType === CouponDiscountType.Amount ? `-${formatCurrency(order.coupon.discountValue)}` : `-${order.coupon.discountValue}%`})`
                      : ''}
                  </span>
                  <span className='text-md font-bold text-primary'>{formatCurrency(order.discountAmount)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Thanh toán:</span>
                  <span className='text-lg font-bold text-primary'>{formatCurrency(order.finalAmount)}</span>
                </div>
                <span className='text-gray-800 text-xs'>
                  Note: Nếu giảm giá trên %, 10% VAT = Tổng tiền x % Giảm x 0.1
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className='space-y-4'>
            <h3 className='font-semibold flex items-center gap-2'>
              <Package className='w-5 h-5 text-muted-foreground' />
              Sản Phẩm Trong Đơn Hàng
            </h3>

            <Accordion type='single' collapsible className='space-y-2'>
              {Array.from(productNameSet).map((productName) => {
                const itemsForProduct = order.orderItems.filter((item) => item.productName === productName)
                const firstItem = itemsForProduct[0]
                const review = order.reviews.find((review) => review.productId === firstItem.productId)

                return (
                  <AccordionItem key={productName} value={productName} className='border rounded-lg px-4 last:border-b'>
                    <div className='flex items-center justify-between'>
                      <AccordionTrigger hasIcon={false}>
                        <div className='flex items-center gap-4 flex-1'>
                          <img
                            src={
                              (firstItem.variant && firstItem.variant?.product?.images[0]) ||
                              firstItem.thumbnail ||
                              Config.ImageBaseUrl
                            }
                            alt={firstItem.productName}
                            className='w-12 h-12 rounded-md object-cover border'
                          />
                          <div className='flex-1 text-left'>
                            <p className='font-medium'>{firstItem.productName}</p>
                            <div className='flex items-center gap-4 text-sm text-muted-foreground font-normal'>
                              <span>Số lượng: {itemsForProduct.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      {order.status === OrderStatus.Completed && (
                        <>
                          {review ? (
                            <EditReview reviewId={review.id}>
                              <Button variant='ghost' type='button' title='Chỉnh sửa đánh giá'>
                                <UserPen className='w-5 h-5' />
                              </Button>
                            </EditReview>
                          ) : (
                            <AddReview productId={firstItem.productId as number} orderId={order.id}>
                              <Button variant='ghost' type='button' title='Chỉnh sửa đánh giá'>
                                <UserPen className='w-5 h-5' />
                              </Button>
                            </AddReview>
                          )}
                        </>
                      )}
                    </div>
                    <AccordionContent className='pt-4'>
                      <div className='space-y-6'>
                        <div className='space-y-3'>
                          <h4 className='font-medium text-sm flex items-center gap-2'>
                            <Package className='w-4 h-4' />
                            Tùy Chọn Đã Mua:
                          </h4>
                          <div className='w-full flex flex-col gap-3'>
                            {itemsForProduct.map((item) => (
                              <div
                                key={item.id}
                                className='flex items-center justify-between p-3 bg-muted/60 rounded-md'
                              >
                                <div>
                                  <div className='mt-1 flex flex-col items-start'>
                                    {(() => {
                                      const variantInfo = parseVariantInfo(
                                        item.variantValue,
                                        item.variant?.product?.variantsConfig || []
                                      )
                                      if (!variantInfo || variantInfo.length === 0) {
                                        return (
                                          <span className='text-[0.8rem] text-gray-600'>
                                            Type: {item.variant?.value}
                                          </span>
                                        )
                                      }
                                      return variantInfo.map((info) => (
                                        <span key={info.type} className='text-[0.8rem] text-gray-600'>
                                          {info.type}: {info.value}
                                        </span>
                                      ))
                                    })()}
                                  </div>
                                  <p className='text-xs text-muted-foreground'>Số lượng: {item.quantity}</p>
                                </div>
                                <div className='text-right'>
                                  <p className='text-sm font-medium text-primary'>{formatCurrency(item.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
