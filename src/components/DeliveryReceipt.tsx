import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Printer, Clock } from 'lucide-react'
import { handleError, parseVariantInfo } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { OrderDetailType } from '@/schemaValidations/order.schema'
import { formatCurrency, formatDateTimeToLocaleString, formatPaymentMethodText } from '@/lib/format'
import { PaymentMethod } from '@/constants/payment'
import { OrderFee, OrderStatus } from '@/constants/order'
import { CouponDiscountType } from '@/constants/coupon'
import { useChangeOrderStatusMutation } from '@/queries/useOrder'
import { TypeProduct } from '@/constants/product'

export default function DeliveryReceipt({
  order,
  onPrint,
  setShowReceipt
}: {
  order: OrderDetailType
  onPrint?: () => void
  setShowReceipt?: (show: boolean) => void
}) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const receiptContent = document.getElementById('delivery-receipt-print')
    if (!receiptContent) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Phiếu Giao Hàng</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: black;
              background: white;
              padding: 20px;
            }
            h1, h2, h3 {
              color: black;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-2xl { font-size: 24px; }
            .text-xl { font-size: 20px; }
            .text-lg { font-size: 18px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .pb-4 { padding-bottom: 16px; }
            .p-4 { padding: 16px; }
            .space-y-3 > * + * { margin-top: 12px; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .gap-6 { gap: 24px; }
            .border-b-2 { border-bottom: 2px solid #333; }
            .border { border: 1px solid #ccc; }
            .rounded-lg { border-radius: 8px; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .font-semibold { font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
      onPrint?.()
    }
  }

  const changeOrderStatusMutation = useChangeOrderStatusMutation()
  const handleChangeStatus = async () => {
    if (changeOrderStatusMutation.isPending) return
    try {
      await changeOrderStatusMutation.mutateAsync({
        orderId: order.id,
        body: { status: OrderStatus.OutForDelivery }
      })
      handlePrint()
      setShowReceipt?.(false)
    } catch (error) {
      handleError(error)
    }
  }

  if (!order.deliveryAddress) return null
  return (
    <>
      <ScrollArea className='max-h-[80vh] overflow-auto'>
        <div id='delivery-receipt-print' className='delivery-receipt-container max-w-4xl mx-auto bg-white p-6'>
          <div className='text-center border-b-2 border-gray-300 pb-4 mb-6'>
            <h1 className='text-2xl font-bold mb-2'>PHIẾU GIAO HÀNG</h1>
            <p className='text-gray-600'>FASTFOOD RESTAURANT</p>
            <p className='text-gray-600'>123, Định Thành, Thoại Sơn, An Giang</p>
            <p className='text-gray-600'>Hotline: 0123 456 789</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>Thông tin đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='font-medium'>Mã đơn hàng:</span>
                  <span className='font-bold'>#{order.id}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium'>Ngày đặt:</span>
                  <span>{formatDateTimeToLocaleString(order.createdAt)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium'>Thanh toán:</span>
                  <span>{formatPaymentMethodText(order.payment.paymentMethod)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium'>Thanh toán tại:</span>
                  <span>
                    {order.payment.paidAt ? formatDateTimeToLocaleString(order.payment.paidAt) : 'Chưa thanh toán'}
                  </span>
                </div>
                {order.payment.paymentMethod === PaymentMethod.MOMO ||
                  (order.payment.paymentMethod === PaymentMethod.VNPay && (
                    <div className='flex justify-between'>
                      <span>Mã giao dịch:</span>
                      <span>{order.payment.transactionId}</span>
                    </div>
                  ))}
                <div className='flex items-start gap-2'>
                  <div>
                    <span className='font-medium'>Lưu ý đơn hàng:</span>
                    <p className='text-gray-700'>{order.note || 'Không có'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>Thông tin nhận hàng</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='font-medium'>Người nhận:</span>
                  <span>{order.deliveryAddress.recipientName}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium'>Số điện thoại:</span>
                  <span>{order.deliveryAddress.recipientPhone}</span>
                </div>
                <div className='flex items-start gap-2'>
                  <div>
                    <span className='font-medium'>Địa chỉ giao hàng:</span>
                    <p className='text-gray-700'>
                      {order.deliveryAddress.detailAddress},{' '}
                      {order.deliveryAddress.ward.name && `${order.deliveryAddress.ward.name}, `}
                      {order.deliveryAddress.district.name}, {order.deliveryAddress.province.name}
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-2'>
                  <div>
                    <span className='font-medium'>Ghi chú:</span>
                    <p className='text-gray-700'>{order.deliveryAddress.deliveryNote || 'Không có'}</p>
                  </div>
                </div>
                {order.deliveryAddress.deliveryNote && (
                  <div className='flex items-start gap-2'>
                    <Clock className='w-4 h-4 mt-1 text-gray-500' />
                    <div>
                      <span className='font-medium'>Ghi chú:</span>
                      <p className='text-gray-700'>{order.deliveryAddress.deliveryNote}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <Separator className='my-6' />
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='grid grid-cols-12 gap-4 font-bold text-sm border-b pb-2'>
                  <div className='col-span-6'>Tên món</div>
                  <div className='col-span-2 text-center'>Số lượng</div>
                  <div className='col-span-2 text-right'>Đơn giá</div>
                  <div className='col-span-2 text-right'>Thành tiền</div>
                </div>

                {order.orderItems.map((item, index) => (
                  <div key={index} className='grid grid-cols-12 gap-4 py-2 border-b border-gray-100'>
                    <div className='col-span-6 font-medium'>
                      <div className='mt-1 flex flex-col'>
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
                                  </div>
                                  {item.variant.value !== 'default' && (
                                    <span className='text-sm text-gray-600'>Type: {item.variant.value}</span>
                                  )}
                                </div>
                              )
                            }
                            const variantInfo = parseVariantInfo(
                              item.variant.value,
                              item.variant.product.variantsConfig
                            )
                            if (!variantInfo || variantInfo.length === 0) {
                              return (
                                <div>
                                  <div className='flex items-center justify-between gap-2'>
                                    <p className='text-sm text-gray-800 font-semibold'>
                                      x{item.quantity} {item.productName}
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
                    </div>
                    <div className='col-span-2 text-center'>x{item.quantity}</div>
                    <div className='col-span-2 text-right'>{formatCurrency(item.price)}</div>
                    <div className='col-span-2 text-right font-medium'>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}

                <div className='space-y-2 pt-4 border-t'>
                  <div className='flex justify-between'>
                    <span>Tạm tính:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>
                      Phí ({formatCurrency(OrderFee.Delivery)} Ship + {OrderFee.TaxRate * 100}% VAT):
                    </span>
                    <span>{formatCurrency(order.feeAmount)}</span>
                  </div>
                  {order.coupon ? (
                    <div className='flex justify-between'>
                      <span>
                        Giảm giá (-
                        {order.coupon.discountType === CouponDiscountType.Amount
                          ? formatCurrency(order.coupon.discountValue)
                          : order.coupon.discountValue + '%'}
                        ):
                      </span>
                      <span>{formatCurrency(order.discountAmount)}</span>
                    </div>
                  ) : (
                    <div className='flex justify-between'>
                      <span>Giảm giá:</span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className='flex justify-between font-bold text-lg'>
                    <span>Thanh toán:</span>
                    <span className='text-primary'>{formatCurrency(order.finalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='text-center border-t-2 border-gray-300 pt-6 mt-6'>
            <p className='mb-2 font-medium'>Cảm ơn quý khách đã sử dụng dịch vụ giao hàng!</p>
            <p className='text-gray-600'>Chúc quý khách dùng bữa ngon miệng!</p>
          </div>

          <div className='mt-6 print-hidden'>
            <Button onClick={handleChangeStatus} className='w-full'>
              <Printer className='w-4 h-4 mr-2' />
              In phiếu và Giao hàng
            </Button>
          </div>
        </div>
      </ScrollArea>
    </>
  )
}
