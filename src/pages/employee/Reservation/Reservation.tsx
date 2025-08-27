import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Users, Clock, Eye, Pencil, X } from 'lucide-react'
import { cn, handleError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'
import { ReservationStatusValues, type ReservationStatusType } from '@/constants/reservation'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useNavigate } from 'react-router'
import { useQuery } from '@/hooks/useQuery'
import type { ReservationDetailType } from '@/schemaValidations/reservation.schema'
import { ReservationDetail } from './ReservationDetail'
import AddReservation from './CreateReservation'
import { useAllReservationsQuery, useChangeReservationStatusMutation } from '@/queries/useReservation'
import EditReservation from './EditReservation'
import {
  formatDateToLocaleString,
  formatReservationStatusColor,
  formatReservationStatusText,
  formatTimeToLocaleString
} from '@/lib/format'
import { useAppContext } from '@/components/AppProvider'
import { reservationSocket } from '@/lib/sockets'
import EmployeeAvatarDropdown from '@/components/EmployeeAvatarDropdown'

export default function Reservation() {
  const navigate = useNavigate()
  const { isAuth } = useAppContext()

  const query = useQuery()
  const selectedStatus = query.get('status') || ''

  const [viewReservation, setViewReservation] = useState<ReservationDetailType | null>(null)
  const [editReservationId, setEditReservationId] = useState<number | undefined>(undefined)

  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const { data, refetch } = useAllReservationsQuery()

  useEffect(() => {
    if (isAuth) {
      reservationSocket.connect()
    } else {
      reservationSocket.disconnect()
      return
    }

    reservationSocket.on('received-reservation', () => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    reservationSocket.on('updated-reservation', () => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    reservationSocket.on('changed-reservation-status', () => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    return () => {
      reservationSocket.off('received-reservation')
      reservationSocket.off('updated-reservation')
      reservationSocket.off('changed-reservation-status')
      reservationSocket.disconnect()
    }
  }, [isAuth, refetch])

  const reservations = useMemo(() => data?.data.data || [], [data?.data.data])
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesStatus = !selectedStatus || reservation.status === selectedStatus

      const reservationDate = new Date(reservation.reservationTime)
      const matchesDateRange =
        !dateRange?.from || !dateRange?.to || (reservationDate >= dateRange.from && reservationDate <= dateRange.to)

      return matchesStatus && matchesDateRange
    })
  }, [selectedStatus, dateRange, reservations])

  const reservationCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    const statusOptions = ['All', ...ReservationStatusValues]

    statusOptions.forEach((status) => {
      if (status === 'All') {
        counts[status] = reservations.filter((reservation) => {
          const reservationDate = new Date(reservation.reservationTime)
          const matchesDateRange =
            !dateRange?.from || !dateRange?.to || (reservationDate >= dateRange.from && reservationDate <= dateRange.to)
          return matchesDateRange
        }).length
      } else {
        counts[status] = reservations.filter((reservation) => {
          const reservationDate = new Date(reservation.reservationTime)
          const matchesDateRange =
            !dateRange?.from || !dateRange?.to || (reservationDate >= dateRange.from && reservationDate <= dateRange.to)
          return reservation.status === status && matchesDateRange
        }).length
      }
    })

    return counts
  }, [reservations, dateRange])

  const changeReservationStatusMutation = useChangeReservationStatusMutation()
  const handleChangeStatus = async (reservationId: number, status: ReservationStatusType) => {
    if (changeReservationStatusMutation.isPending) return
    try {
      await changeReservationStatusMutation.mutateAsync({
        reservationId,
        body: { status }
      })
      refetch()
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className='flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8'>
      <ReservationDetail reservation={viewReservation} setReservation={setViewReservation} />

      <div className='fixed top-0 left-0 right-0 z-40 py-4 px-12 bg-white border-b border-gray-200'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold text-gray-900'>Reservation</h1>
          </div>
          <div className='flex items-center gap-4'>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                const params = new URLSearchParams(window.location.search)
                if (value && value !== 'All') {
                  params.set('status', value)
                } else {
                  params.delete('status')
                }
                params.delete('page')
                navigate(`/employee/reservations?${params.toString()}`)
              }}
            >
              <SelectTrigger className='max-w-sm w-50 bg-white'>
                <span>{selectedStatus ? formatReservationStatusText(selectedStatus) : 'Tất cả'}</span>
              </SelectTrigger>
              <SelectContent>
                {['All', ...ReservationStatusValues].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'All' ? 'Tất cả' : formatReservationStatusText(status)} (
                    {reservationCounts[status] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
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
                  variant='ghost'
                  size='icon'
                  className='rounded-full h-8 w-8'
                  onClick={() => setDateRange(undefined)}
                >
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Xóa lọc</span>
                </Button>
              )}
            </div>

            <div className='flex items-center gap-4'>
              <div>
                <AddReservation />
                <EditReservation reservationId={editReservationId} setEditReservationId={setEditReservationId} />
              </div>
              <EmployeeAvatarDropdown />
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-12'>
        {filteredReservations.length > 0 ? (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id} className='shadow-sm rounded-lg'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle className='text-base font-semibold'>
                  {reservation.guestName} <span className='text-gray-500 font-normal'>#{reservation.id}</span>
                </CardTitle>
                <Select
                  onValueChange={(value) => handleChangeStatus(reservation.id, value as ReservationStatusType)}
                  defaultValue={reservation.status}
                  value={reservation.status}
                >
                  <SelectTrigger
                    className='p-0 border-none shadow-none hover:shadow-none focus:shadow-none cursor-pointer'
                    hasIcon={false}
                  >
                    <span className={formatReservationStatusColor({ status: reservation.status })}>
                      {formatReservationStatusText(reservation.status)}
                    </span>
                  </SelectTrigger>

                  <SelectContent>
                    {ReservationStatusValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {formatReservationStatusText(value)}
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
                      <Users className='h-4 w-4' />
                      <span>
                        Số khách: <span className='font-medium text-gray-900'>{reservation.numberOfGuest}</span>
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-4 w-4' />
                      <div className='flex flex-col'>
                        <span>
                          Ngày đến:{' '}
                          <span className='font-medium text-gray-900'>
                            {formatTimeToLocaleString(reservation.reservationTime)}
                          </span>
                        </span>
                        <span className='font-medium text-gray-900'>
                          {formatDateToLocaleString(reservation.reservationTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-col items-center'>
                    <span className='text-gray-600 font-semibold text-sm'>Bàn</span>
                    <span className='text-primary font-bold text-xl'>
                      {reservation.table ? `${reservation.table.code}` : 'Chưa chọn bàn'}
                    </span>
                    {reservation.table && (
                      <span className='text-xs text-gray-500'>Sức chứa: {reservation.table.capacity} người</span>
                    )}
                  </div>
                </div>

                {reservation.note && (
                  <div className='mt-2 p-2 bg-gray-50 rounded text-xs'>
                    <span className='font-medium'>Ghi chú:</span> {reservation.note}
                  </div>
                )}

                <div className='flex gap-2 mt-4'>
                  <Button
                    variant='outline'
                    className='flex-1 bg-transparent cursor-pointer'
                    onClick={() => setViewReservation(reservation)}
                  >
                    <Eye className='h-4 w-4 mr-2' />
                    Xem chi tiết
                  </Button>
                  <Button
                    variant='outline'
                    className='flex-1 bg-transparent cursor-pointer'
                    onClick={() => setEditReservationId(reservation.id)}
                  >
                    <Pencil className='h-4 w-4 mr-2' />
                    Chỉnh sửa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className='col-span-full text-center py-10 text-gray-500'>
            Không tìm thấy đặt bàn nào cho bộ lọc đã chọn.
          </div>
        )}
      </div>
    </div>
  )
}
