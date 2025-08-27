import { useState, useMemo, useEffect } from 'react'
import { format, isWithinInterval } from 'date-fns'
import { CalendarIcon, XCircle, ChefHat, Hourglass, ClipboardCheck, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { DateRange } from 'react-day-picker'
import { OrderCard } from './OrderCard'
import { cn } from '@/lib/utils'
import { useAllOrdersQuery } from '@/queries/useOrder'
import { KitchenOrderStatus, KitchenOrderStatusValues, type KitchenOrderStatusType } from '@/constants/order'
import type { OrderDetailType } from '@/schemaValidations/order.schema'
import { useQuery } from '@/hooks/useQuery'
import { orderSocket } from '@/lib/sockets'
import type { MessageResType } from '@/schemaValidations/response.schema'
import Masonry from 'react-masonry-css'
import { useAllDraftItemsQuery } from '@/queries/useDraftItem'
import type { DraftItemDetailType } from '@/schemaValidations/draft-item.schema'
import { DraftCard } from './DraftCard'
import EmployeeAvatarDropdown from '@/components/EmployeeAvatarDropdown'
import { formatKitchenStatusText } from '@/lib/format'

export default function Kitchen() {
  const query = useQuery()
  const selectedType = query.get('orderType') || ''

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const { data, refetch } = useAllOrdersQuery()

  const breakpointColumnsObj = {
    default: 6,
    1920: 6, // Màn hình lớn (Full HD+)
    1440: 4, // Màn hình vừa lớn
    1024: 3, // lg
    768: 2, // md
    640: 2, // sm
    320: 1 // mobile
  }

  const breakpointDineInColumnsObj = {
    default: 4,
    1920: 4, // Màn hình lớn (Full HD+)
    1440: 3, // Màn hình vừa lớn
    1024: 2, // lg
    768: 2, // md
    640: 2, // sm
    320: 1 // mobile
  }

  useEffect(() => {
    orderSocket.connect()

    orderSocket.on('recieved-order', (data: MessageResType) => {
      refetch()
    })

    orderSocket.on('changed-order-status', (data: MessageResType) => {
      refetch()
    })
  }, [refetch])

  const filteredAndGroupedOrders = useMemo(() => {
    if (data) {
      const orders = data.data.data
      const filtered = orders
        .filter(
          (order) =>
            KitchenOrderStatusValues.includes(order.status) && (!selectedType || order.orderType === selectedType)
        )
        .filter((order) => {
          if (!dateRange?.from || !dateRange?.to) {
            return true
          }
          const orderDate = order.createdAt
          return isWithinInterval(orderDate, { start: dateRange.from, end: dateRange.to })
        })

      const grouped: Record<KitchenOrderStatusType, OrderDetailType[]> = {
        Pending: [],
        Confirmed: [],
        Preparing: [],
        Ready: [],
        CancelledByKitchen: []
      }

      filtered.forEach((order) => {
        if (KitchenOrderStatusValues.includes(order.status)) {
          grouped[order.status].push(order)
        }
      })

      return grouped
    }
  }, [data, dateRange, selectedType])

  const getStatusIcon = (status: KitchenOrderStatusType) => {
    switch (status) {
      case KitchenOrderStatus.Pending:
        return <Hourglass className='h-5 w-5 text-yellow-600' />
      case KitchenOrderStatus.Confirmed:
        return <CheckCircle className='h-5 w-5 text-blue-600' />
      case KitchenOrderStatus.Preparing:
        return <ChefHat className='h-5 w-5 text-purple-600' />
      case KitchenOrderStatus.Ready:
        return <ClipboardCheck className='h-5 w-5 text-green-600' />
      case KitchenOrderStatus.CancelledByKitchen:
        return <XCircle className='h-5 w-5 text-red-600' />
      default:
        return null
    }
  }

  const allDraftItemsQuery = useAllDraftItemsQuery({})
  const draftItemsByCode = useMemo(() => {
    if (allDraftItemsQuery.data) {
      const grouped = allDraftItemsQuery.data.data.data
        .filter((item) => !item.draftCode.includes('term') && !item.draftCode.includes('delivery'))
        .reduce(
          (acc, item) => {
            const key = item.draftCode
            if (!acc[key]) {
              acc[key] = []
            }
            acc[key].push(item)
            return acc
          },
          {} as Record<string, DraftItemDetailType[]>
        )
      return grouped
    }
  }, [allDraftItemsQuery.data])

  if (!filteredAndGroupedOrders) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-gray-500'>Loading...</p>
      </div>
    )
  }
  return (
    <div className='flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8'>
      <header className='fixed top-0 left-0 right-0 z-40 py-4 px-12 bg-white border-b border-gray-200'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold text-gray-900'>Kitchen</h1>
          </div>
          <div className='flex items-center gap-4'>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id='date'
                  variant='outline'
                  className={cn('w-[260px] justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}
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
                <span className='sr-only'>Xóa lọc</span>
              </Button>
            )}
            <EmployeeAvatarDropdown />
          </div>
        </div>
      </header>

      <div className='flex-1 space-y-6 mt-14'>
        <div className='flex items-center space-x-3'>
          <div className='w-1 h-8 bg-primary rounded-full'></div>
          <h3 className='text-3xl font-bold text-gray-900'>Đơn hàng trực tiếp</h3>
        </div>
        {draftItemsByCode && Object.values(draftItemsByCode).length > 0 ? (
          <Masonry
            breakpointCols={breakpointDineInColumnsObj}
            className='flex w-auto -ml-4'
            columnClassName='pl-4 bg-clip-padding'
          >
            {Object.values(draftItemsByCode).map((drafts, index) => (
              <div key={index} className='mb-4'>
                <DraftCard drafts={drafts} />
              </div>
            ))}
          </Masonry>
        ) : (
          <div className='text-center text-gray-500 py-4'>Chưa có đơn hàng.</div>
        )}
      </div>

      <div className='flex-1 space-y-6 mt-8'>
        <div className='flex items-center space-x-3'>
          <div className='w-1 h-8 bg-primary rounded-full'></div>
          <h3 className='text-3xl font-bold text-gray-900'>Đơn hàng trực tuyến</h3>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8'>
          {KitchenOrderStatusValues.map((status) => (
            <Card key={status} className='shadow-sm'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {getStatusIcon(status)}
                  <CardTitle className='text-lg font-semibold'>{formatKitchenStatusText(status)}</CardTitle>
                </div>
                <span className='text-2xl font-bold text-gray-800'>{filteredAndGroupedOrders[status].length}</span>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className='flex-1 space-y-6'>
        <Accordion
          type='multiple'
          defaultValue={[KitchenOrderStatus.Pending, KitchenOrderStatus.Confirmed, KitchenOrderStatus.Preparing]}
        >
          {KitchenOrderStatusValues.map((status) => (
            <AccordionItem key={status} value={status} className='border-b'>
              <AccordionTrigger className='flex items-center justify-between py-4 px-2 text-lg font-semibold hover:no-underline'>
                <div className='flex items-center gap-2'>
                  {getStatusIcon(status)}
                  {formatKitchenStatusText(status)}
                  <span className='ml-2 text-gray-500'>({filteredAndGroupedOrders[status].length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className=''>
                {filteredAndGroupedOrders[status].length > 0 ? (
                  <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className='flex w-auto -ml-4'
                    columnClassName='pl-4 bg-clip-padding'
                  >
                    {filteredAndGroupedOrders[status].map((order) => (
                      <div key={order.id} className='mb-4'>
                        <OrderCard order={order} />
                      </div>
                    ))}
                  </Masonry>
                ) : (
                  <div className='text-center text-gray-500 py-4'>Chưa có đơn hàng.</div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
