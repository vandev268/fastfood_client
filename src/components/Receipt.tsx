import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Printer } from 'lucide-react'
import type { OrderDetailType } from '@/schemaValidations/order.schema'
import { OrderType, type OrderTypeType } from '@/constants/order'
import { formatCurrency, formatDateTimeToLocaleString } from '@/lib/format'

export default function Receipt({
  order,
  orderType,
  onPrint
}: {
  order: OrderDetailType
  orderType?: OrderTypeType
  onPrint?: () => void
}) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const receiptContent = document.querySelector('.receipt-container')
    if (!receiptContent) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${orderType === OrderType.Takeaway ? 'Phiếu Mang Đi' : 'Hóa Đơn Thanh Toán'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              color: black;
              background: white;
              padding: 20px;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-xl { font-size: 20px; }
            .text-lg { font-size: 18px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .pb-4 { padding-bottom: 16px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .border-b-2 { border-bottom: 2px dashed #666; }
            .border-t-2 { border-top: 2px dashed #666; }
            .pt-4 { padding-top: 16px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .font-medium { font-weight: 500; }
            .text-gray-600 { color: #666; }
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

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-container,
          .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 20px;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      <ScrollArea className='max-h-[70vh] overflow-auto'>
        <div className='receipt-container max-w-md mx-auto bg-white p-6 font-mono text-sm'>
          <div className='text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4'>
            <h1 className='text-xl font-bold mb-2'>
              {orderType === OrderType.Takeaway ? 'PHIẾU MANG ĐI' : 'HÓA ĐƠN THANH TOÁN'}
            </h1>
            <h2 className='text-lg font-semibold mb-2'>FASTFOOD RESTAURANT</h2>
            <p className='text-gray-600'>123, Định Thành, Thoại Sơn, An Giang</p>
            <p className='text-gray-600'>Hotline: 0123 456 789</p>
          </div>

          <div className='mb-4 space-y-1'>
            <div className='flex justify-between'>
              <span>Ngày đặt:</span>
              <span>{formatDateTimeToLocaleString(order.createdAt)}</span>
            </div>

            <div className='flex justify-between'>
              <span>Khách hàng:</span>
              <span>{order.customerName || 'Khách lẻ'}</span>
            </div>

            {orderType === OrderType.DineIn && order.tables && order.tables.length > 0 && (
              <div className='flex justify-between'>
                <span>{order.tables.length > 1 ? 'Bàn ghép:' : 'Bàn số:'}</span>
                <span>
                  {order.tables.map((table) => `#${table.code}`).join(', ')}
                  {order.tables.length > 1 && <span className='text-gray-600'> ({order.tables.length} bàn)</span>}
                </span>
              </div>
            )}

            {orderType === OrderType.Takeaway && (
              <div className='flex justify-between'>
                <span>Loại:</span>
                <span>Mang đi</span>
              </div>
            )}
          </div>

          <div className='mb-4'>
            <div className='flex justify-between font-bold mb-2'>
              <span>Món</span>
              <span>SL x Giá = Thành tiền</span>
            </div>
            {order.orderItems.map((item, index) => (
              <div key={index} className='mb-2'>
                <div className='font-medium'>{item.productName}</div>
                <div className='flex justify-between text-gray-600'>
                  <span></span>
                  <span>
                    {item.quantity} x {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className='border-b border-dashed border-gray-400 mb-4'></div>

          <div className='mb-4 space-y-1'>
            <div className='flex justify-between'>
              <span>Tạm tính:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className='flex justify-between font-bold text-lg'>
              <span>TỔNG CỘNG:</span>
              <span>{formatCurrency(order.finalAmount)}</span>
            </div>
          </div>

          <div className='text-center border-t-2 border-dashed border-gray-400 pt-4 mt-4'>
            <p className='mb-2'>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
            <p className='text-gray-600'>Hẹn gặp lại quý khách lần sau!</p>
          </div>

          <div className='mt-6 print-hidden'>
            <Button onClick={handlePrint} className='w-full'>
              <Printer className='w-4 h-4 mr-2' />
              In hóa đơn
            </Button>
          </div>
        </div>
      </ScrollArea>
    </>
  )
}
