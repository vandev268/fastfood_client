import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Package, Clock, Eye, Printer, X } from 'lucide-react'
import { cn, handleError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'
import { OrderStatus, OrderStatusValues, OrderType, type OrderStatusType } from '@/constants/order'
import { useAllOrdersQuery, useChangeOrderStatusMutation } from '@/queries/useOrder'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useNavigate } from 'react-router'
import { useQuery } from '@/hooks/useQuery'
import type { OrderDetailType } from '@/schemaValidations/order.schema'
import { orderSocket } from '@/lib/sockets'
import type { MessageResType } from '@/schemaValidations/response.schema'
import { DeliveryDetail } from './DeliveryDetail'
import { Input } from '@/components/ui/input'
import {
  formatCurrency,
  formatDateToLocaleString,
  formatOrderStatusColor,
  formatOrderStatusText,
  formatTimeToLocaleString
} from '@/lib/format'
import DeliveryReceipt from '@/components/DeliveryReceipt'
import EmployeeAvatarDropdown from '@/components/EmployeeAvatarDropdown'

export default function Delivery() {
  const navigate = useNavigate()

  const query = useQuery()
  const selectedStatus = query.get('status') || ''
  const [searchTerm, setSearchTerm] = useState('')

  const [viewOrder, setViewOrder] = useState<OrderDetailType | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<OrderDetailType | null>(null)

  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const { data, refetch } = useAllOrdersQuery()

  useEffect(() => {
    orderSocket.connect()

    orderSocket.on('recieved-order', (data: MessageResType) => {
      refetch()
    })

    orderSocket.on('changed-order-status', (data: MessageResType) => {
      refetch()
    })
  }, [refetch])

  const orders = useMemo(() => data?.data.data || [], [data?.data.data])
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const deliveryOrders = order.orderType === OrderType.Delivery
      const matchesStatus = !selectedStatus || order.status === selectedStatus
      const matchesSearch = !searchTerm || order.id.toString().toLowerCase().includes(searchTerm.toLowerCase())

      const orderDate = new Date(order.createdAt)
      const matchesDateRange =
        !dateRange?.from || !dateRange?.to || (orderDate >= dateRange.from && orderDate <= dateRange.to)

      return deliveryOrders && matchesStatus && matchesDateRange && matchesSearch
    })
  }, [selectedStatus, dateRange, orders, searchTerm])

  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    const deliveryOrders = orders.filter((order) => order.orderType === OrderType.Delivery)

    OrderStatusValues.forEach((status) => {
      if (status === 'All') {
        counts[status] = deliveryOrders.filter((order) => {
          const orderDate = new Date(order.createdAt)
          const matchesDateRange =
            !dateRange?.from || !dateRange?.to || (orderDate >= dateRange.from && orderDate <= dateRange.to)
          const matchesSearch = !searchTerm || order.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
          return matchesDateRange && matchesSearch
        }).length
      } else {
        counts[status] = deliveryOrders.filter((order) => {
          const orderDate = new Date(order.createdAt)
          const matchesDateRange =
            !dateRange?.from || !dateRange?.to || (orderDate >= dateRange.from && orderDate <= dateRange.to)
          const matchesSearch = !searchTerm || order.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
          return order.status === status && matchesDateRange && matchesSearch
        }).length
      }
    })

    return counts
  }, [orders, dateRange, searchTerm])

  const handlePrintReceipt = (order: OrderDetailType) => {
    setReceiptData(order)
    setShowReceipt(true)
  }

  const changeOrderStatusMutation = useChangeOrderStatusMutation()
  const handleChangeStatus = async (orderId: number, status: OrderStatusType) => {
    if (changeOrderStatusMutation.isPending) return
    try {
      await changeOrderStatusMutation.mutateAsync({ orderId, body: { status } })
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <DeliveryDetail order={viewOrder} setOrder={setViewOrder} />

      <div className='fixed top-0 left-0 right-0 z-40 py-4 px-12 bg-white border-b border-gray-200'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold text-gray-900'>Danh sách đơn giao hàng</h1>
          </div>
          <div className='flex items-center gap-4'>
            <Input
              placeholder='Tìm kiếm theo mã đơn hàng...'
              value={searchTerm ?? ''}
              onChange={(event) => {
                setSearchTerm(event.target.value)
              }}
              className='w-80'
            />

            <div className='flex items-center gap-2'>
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  const params = new URLSearchParams(window.location.search)
                  if (value && value !== OrderStatus.All) {
                    params.set('status', value)
                  } else {
                    params.delete('status')
                  }
                  params.delete('page')
                  navigate(`/employee/deliveries?${params.toString()}`)
                }}
              >
                <SelectTrigger className='max-w-sm w-50 bg-white'>
                  <span>{formatOrderStatusText(selectedStatus)}</span>
                </SelectTrigger>
                <SelectContent>
                  {OrderStatusValues.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatOrderStatusText(status)} ({orderCounts[status] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id='date'
                    variant='outline'
                    className={cn(
                      'w-[260px] justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd MMM yyyy')} - {format(dateRange.to, 'dd MMM yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd MMM yyyy')
                      )
                    ) : (
                      <span>Chọn khung thời gian</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='end'>
                  <Calendar
                    initialFocus
                    mode='range'
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              {dateRange?.from && dateRange?.to && (
                <Button
                  variant='outline'
                  size='icon'
                  className='rounded-full h-8 w-8'
                  onClick={() => setDateRange(undefined)}
                >
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Xóa lọc ngày</span>
                </Button>
              )}
            </div>
            <EmployeeAvatarDropdown />
          </div>
        </div>
      </div>

      <div className='mt-12 p-4 sm:p-6 md:p-8'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card key={order.id} className='shadow-sm rounded-lg'>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <CardTitle className='text-base font-semibold'>
                    {order.customerName || 'Khách hàng'} <span className='text-gray-500 font-normal'>#{order.id}</span>
                  </CardTitle>
                  <Select
                    onValueChange={(value) => handleChangeStatus(order.id, value as OrderStatusType)}
                    defaultValue={order.status}
                    value={order.status}
                  >
                    <SelectTrigger
                      className='p-0 border-none shadow-none hover:shadow-none focus:shadow-none cursor-pointer'
                      hasIcon={false}
                    >
                      <span className={formatOrderStatusColor({ status: order.status })}>
                        {formatOrderStatusText(order.status)}
                      </span>
                    </SelectTrigger>

                    <SelectContent>
                      {OrderStatusValues.filter((status) => status !== OrderStatus.All).map((value) => (
                        <SelectItem key={value} value={value}>
                          {formatOrderStatusText(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <Separator />
                <CardContent className='px-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 text-sm text-gray-600'>
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <Package className='h-4 w-4' />
                        <span>
                          Sản phẩm: <span className='font-medium text-gray-900'>{order.orderItems.length}</span>
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-4 w-4' />
                        <div className='flex flex-col'>
                          <span>
                            Đặt hàng:{' '}
                            <span className='font-medium text-gray-900'>
                              {formatTimeToLocaleString(order.createdAt)}
                            </span>
                          </span>

                          <span className='font-medium text-gray-900'>{formatDateToLocaleString(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-col items-center'>
                      <span className='text-gray-600 font-semibold text-sm'>Tổng tiền</span>
                      <span className='text-primary font-bold text-lg'>{formatCurrency(order.finalAmount)}</span>
                    </div>
                  </div>

                  <div className='flex gap-2 mt-4'>
                    <Button
                      variant='outline'
                      className='flex-1 bg-transparent cursor-pointer'
                      onClick={() => setViewOrder(order)}
                    >
                      <Eye className='h-4 w-4 mr-2' />
                      Xem chi tiết
                    </Button>
                    {order.status === OrderStatus.Ready && (
                      <Button
                        variant='outline'
                        className='flex-1 bg-transparent cursor-pointer'
                        onClick={() => handlePrintReceipt(order)}
                      >
                        <Printer className='h-4 w-4 mr-2' />
                        In hóa đơn
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className='col-span-full text-center py-10 text-gray-500'>Không có đơn hàng nào được tìm thấy.</div>
          )}
        </div>
      </div>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className='min-w-4xl'>
          <DialogHeader>
            <DialogTitle>Hóa đơn thanh toán</DialogTitle>
          </DialogHeader>
          {receiptData && (
            <DeliveryReceipt
              order={receiptData}
              onPrint={() => setShowReceipt(false)}
              setShowReceipt={setShowReceipt}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
