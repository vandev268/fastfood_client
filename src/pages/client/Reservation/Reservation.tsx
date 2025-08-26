import { useEffect, useMemo, useState } from 'react'
import { Clock, Users, Phone, Mail, MapPin, CheckCircle, Star, ChevronDownIcon, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import classNames from 'classnames'
import { getDateAndTimeFromDate, handleError } from '@/lib/utils'
import { useAllTablesQuery } from '@/queries/useTable'
import { TableLocationValues, TableStatus, TableStatusValues } from '@/constants/table'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import {
  CreateCustomerReservationBodySchema,
  type CreateCustomerReservationBodyType
} from '@/schemaValidations/reservation.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { ReservationStatus } from '@/constants/reservation'
import type { TableDetailType } from '@/schemaValidations/table.schema'
import { addDays, getDate } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAppContext } from '@/components/AppProvider'
import { useCreateReservationMutation } from '@/queries/useReservation'
import { toast } from 'sonner'
import { reservationSocket, tableSocket } from '@/lib/sockets'
import {
  formatDateTimeToLocaleString,
  formatDateToLocaleString,
  formatTableLocationText,
  formatTableStatusColor,
  formatTableStatusText,
  formatTableTypeText
} from '@/lib/format'

const RESTAURANT_HOURS = {
  open: 7, // 7:00 AM
  close: 22 // 10:00 PM
}

const RESTAURANT_INFO = {
  name: 'FastFood Restaurant',
  phone: '0865 865 865',
  email: 'booking@fastfood.com',
  address: '123 FastFood, Thoại Sơn, An Giang',
  hours: `Mở cửa: ${RESTAURANT_HOURS.open}:00 - ${RESTAURANT_HOURS.close}:00 (Thứ 2 - Chủ nhật)`
}

const getTimePeriodFromHour = (hour: number) => {
  if (hour >= 7 && hour < 11) return 'Morning'
  if (hour >= 11 && hour < 14) return 'Noon'
  if (hour >= 14 && hour < 18) return 'Afternoon'
  if (hour >= 18 && hour < 22) return 'Evening'
  return null
}

const getTimePeriodHours = (period: string) => {
  switch (period) {
    case 'Morning':
      return Array.from({ length: 5 }, (_, i) => i + 7) // 7-11
    case 'Noon':
      return Array.from({ length: 3 }, (_, i) => i + 11) // 11-13
    case 'Afternoon':
      return Array.from({ length: 4 }, (_, i) => i + 14) // 14-17
    case 'Evening':
      return Array.from({ length: 5 }, (_, i) => i + 18) // 18-22
    default:
      return []
  }
}

const getNextTimePeriod = (period: string) => {
  switch (period) {
    case 'Morning':
      return 'Noon'
    case 'Noon':
      return 'Afternoon'
    case 'Afternoon':
      return 'Evening'
    case 'Evening':
      return null
    default:
      return null
  }
}

const getAvailableTimeSlots = (table: TableDetailType, selectedDate: string) => {
  const allTimeSlots: string[] = []

  for (let hour = RESTAURANT_HOURS.open; hour < RESTAURANT_HOURS.close; hour++) {
    allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
  }

  if (!selectedDate) return allTimeSlots

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  let availableTimeSlots = allTimeSlots
  if (isToday) {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    availableTimeSlots = allTimeSlots.filter((timeSlot) => {
      const [hourStr, minuteStr] = timeSlot.split(':')
      const slotHour = Number.parseInt(hourStr)
      const slotMinute = Number.parseInt(minuteStr)

      if (slotHour > currentHour) return true
      if (slotHour === currentHour && slotMinute > currentMinute + 30) return true
      return false
    })
  }

  const reservations = table.reservations || []
  const reservatedTimes = reservations
    .filter((reservation) => {
      const reservationDate = getDateAndTimeFromDate(reservation.reservationTime).date
      const selectedReservationDate = selectedDate.length === 9 ? `0${selectedDate}` : selectedDate
      return reservationDate === selectedReservationDate
    })
    .map((reservation) => getDateAndTimeFromDate(reservation.reservationTime).time)

  const timeSlotsToExclude = new Set<string>()
  reservatedTimes.forEach((timeStr) => {
    const [hourStr, minuteStr] = timeStr.split(':')
    const hour = Number.parseInt(hourStr)
    const minute = Number.parseInt(minuteStr)

    const timePeriod = getTimePeriodFromHour(hour)
    if (!timePeriod) return

    const currentPeriodHours = getTimePeriodHours(timePeriod)
    currentPeriodHours.forEach((h) => {
      timeSlotsToExclude.add(`${h.toString().padStart(2, '0')}:00`)
      timeSlotsToExclude.add(`${h.toString().padStart(2, '0')}:30`)
    })

    const transitionPoints = [
      { hour: 11, period: 'Morning' },
      { hour: 14, period: 'Noon' },
      { hour: 18, period: 'Afternoon' },
      { hour: 22, period: 'Evening' }
    ]

    const currentTransition = transitionPoints.find((t) => t.period === timePeriod && t.hour - hour <= 1)

    if (currentTransition) {
      const nextPeriod = getNextTimePeriod(timePeriod)
      if (nextPeriod) {
        const nextPeriodHours = getTimePeriodHours(nextPeriod)
        nextPeriodHours.forEach((h) => {
          timeSlotsToExclude.add(`${h.toString().padStart(2, '0')}:00`)
          timeSlotsToExclude.add(`${h.toString().padStart(2, '0')}:30`)
        })
      }
    }
  })

  return availableTimeSlots.filter((timeSlot) => !timeSlotsToExclude.has(timeSlot))
}

export default function Reservation() {
  const { profile, isAuth } = useAppContext()

  const [dateView, setDateView] = useState<boolean>(false)
  const [selectedTable, setSelectedTable] = useState<TableDetailType | null>(null)

  const form = useForm<CreateCustomerReservationBodyType>({
    resolver: zodResolver(CreateCustomerReservationBodySchema),
    defaultValues: {
      guestName: '',
      guestPhone: '',
      numberOfGuest: 1,
      reservationTime: '',
      reservationDate: '',
      note: '',
      status: ReservationStatus.Pending,
      tableId: null,
      userId: null
    }
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        guestName: profile.name,
        guestPhone: profile.phoneNumber,
        userId: profile.id,
        numberOfGuest: 1,
        reservationTime: '',
        reservationDate: '',
        note: '',
        status: ReservationStatus.Pending,
        tableId: null
      })
    }
  }, [profile, form])

  useEffect(() => {
    if (selectedTable) {
      form.setValue('tableId', selectedTable.id)
    }
  }, [selectedTable, form])

  const reservationDate = form.watch('reservationDate')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const { data, refetch } = useAllTablesQuery()
  const tables = useMemo(() => {
    return data?.data.data || []
  }, [data])

  useEffect(() => {
    if (isAuth) {
      tableSocket.connect()
      reservationSocket.connect()
    } else {
      tableSocket.disconnect()
      reservationSocket.disconnect()
      return
    }

    tableSocket.on('sended-table', () => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

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
      tableSocket.off('sended-table')
      reservationSocket.off('received-reservation')
      reservationSocket.off('updated-reservation')
      reservationSocket.off('changed-reservation-status')
      tableSocket.disconnect()
      reservationSocket.disconnect()
    }
  }, [refetch, isAuth])

  const createReservationMutation = useCreateReservationMutation()
  const onSubmit = async (data: CreateCustomerReservationBodyType) => {
    if (!selectedTable || createReservationMutation.isPending) return
    try {
      await createReservationMutation.mutateAsync({
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        numberOfGuest: data.numberOfGuest,
        reservationTime: new Date(`${data.reservationDate} ${data.reservationTime}`),
        note: data.note,
        status: data.status,
        tableId: selectedTable.id,
        userId: profile ? profile.id : null
      })
      setShowSuccess(true)
      setIsSubmitting(false)
      setSelectedTable(null)
      form.reset()
      toast.success('Đặt bàn thành công! Chúng tôi sẽ liên hệ để xác nhận trong thời gian sớm nhất.')
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 py-6'>
          <div className='flex flex-col items-center gap-2'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Đặt Bàn Online</h1>
            <div className='flex gap-6'>
              {TableStatusValues.map((status) => (
                <div key={status} className='flex items-center gap-2'>
                  <div className={formatTableStatusColor({ status })}></div>
                  {formatTableStatusText(status)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2'>
            <div className='space-y-6'>
              {TableLocationValues.map((location) => (
                <>
                  <h3 key={location} className='text-lg font-semibold mb-2'>
                    {formatTableLocationText(location)}
                  </h3>
                  <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                    {tables
                      .filter((table) => table.location === location)
                      .map((table) => {
                        return (
                          <Card
                            key={table.id}
                            className={classNames('cursor-pointer transition-all hover:shadow-md', {
                              'border border-primary': selectedTable === table
                            })}
                            onClick={() => setSelectedTable(table)}
                          >
                            <CardContent className='px-4'>
                              <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                  <h3 className='font-semibold'>{table.code}</h3>
                                  <div className={formatTableStatusColor({ status: table.status })} />
                                </div>
                                <div className='flex items-center justify-center text-sm text-gray-600'>
                                  <Users className='w-4 h-4 mr-1' />
                                  {table.capacity} chỗ ngồi
                                </div>
                                <div className='flex items-center justify-center text-sm text-gray-600'>
                                  <MapPin className='w-4 h-4 mr-1' />
                                  {formatTableLocationText(table.location)}
                                </div>
                                <div className='flex items-center justify-center text-sm text-gray-600'>
                                  <Badge variant='secondary'>{formatTableTypeText(table.capacity)}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                </>
              ))}
            </div>
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Phone className='w-5 h-5' />
                  Liên Hệ Trực Tiếp
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <p className='text-sm text-gray-600 mb-2'>Gọi ngay để đặt bàn nhanh chóng</p>
                  <a
                    href={`tel:${RESTAURANT_INFO.phone}`}
                    className='text-2xl font-bold text-blue-600 hover:text-blue-700'
                  >
                    {RESTAURANT_INFO.phone}
                  </a>
                </div>
                <Separator />
                <div className='space-y-3 text-sm'>
                  <div className='flex items-start gap-2'>
                    <Mail className='w-4 h-4 mt-0.5 text-gray-500' />
                    <div>
                      <p className='font-medium'>Email</p>
                      <p className='text-gray-600'>{RESTAURANT_INFO.email}</p>
                    </div>
                  </div>
                  <div className='flex items-start gap-2'>
                    <MapPin className='w-4 h-4 mt-0.5 text-gray-500' />
                    <div>
                      <p className='font-medium'>Địa chỉ</p>
                      <p className='text-gray-600'>{RESTAURANT_INFO.address}</p>
                    </div>
                  </div>
                  <div className='flex items-start gap-2'>
                    <Clock className='w-4 h-4 mt-0.5 text-gray-500' />
                    <div>
                      <p className='font-medium'>Giờ mở cửa</p>
                      <p className='text-gray-600'>{RESTAURANT_INFO.hours}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {selectedTable ? (
              <Card>
                <CardHeader>
                  <CardTitle>Đặt Bàn Trực Tuyến</CardTitle>
                  {selectedTable && (
                    <div>
                      <p className='text-sm text-gray-600'>
                        Đã chọn: {selectedTable.code} ({selectedTable.capacity} chỗ ngồi)
                      </p>
                      {selectedTable.status === TableStatus.Reserved && (
                        <div className='mt-2 space-y-1'>
                          <div className='text-xs text-gray-500 font-medium'>Các ngày đã đặt:</div>
                          {selectedTable.reservations
                            .filter((res) => {
                              return new Date(res.reservationTime) > new Date()
                            })
                            .map((reservation, index) => (
                              <div key={index} className='text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded'>
                                <div className='flex items-center gap-1'>
                                  <CalendarCheck className='w-4 h-4' />
                                  {formatDateTimeToLocaleString(reservation.reservationTime)}
                                </div>
                              </div>
                            ))}
                          <div className='text-xs text-green-600 font-medium'>✓ Vẫn có thể đặt giờ khác</div>
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {showSuccess ? (
                    <div className='text-center py-8'>
                      <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
                      <h3 className='text-xl font-semibold text-green-700 mb-2'>Đặt bàn thành công!</h3>
                      <p className='text-gray-600 mb-4'>
                        Chúng tôi sẽ liên hệ với bạn để xác nhận trong thời gian sớm nhất.
                      </p>
                      <div className='flex items-center justify-center gap-1 text-yellow-500'>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className='w-5 h-5 fill-current' />
                        ))}
                      </div>
                      <p className='text-sm text-gray-500 mt-2'>Cảm ơn bạn đã tin tưởng chúng tôi!</p>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form
                        noValidate
                        className='grid auto-rows-max items-start gap-4'
                        id='create-reservation-form'
                        onSubmit={form.handleSubmit(onSubmit, (error) => {
                          console.log(error)
                        })}
                      >
                        <div className='space-y-2'>
                          <FormField
                            control={form.control}
                            name='guestName'
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor='guestName'>Họ và tên</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Input id='guestName' className='w-full' {...field} placeholder='Tên người đặt...' />
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='guestPhone'
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor='guestPhone'>Số điện thoại</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Input
                                    id='guestPhone'
                                    className='w-full'
                                    {...field}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/\D/g, '')
                                      field.onChange(value)
                                    }}
                                    placeholder='Số điện thoại...'
                                  />
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='numberOfGuest'
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor='numberOfGuest'>Số người đến</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Input
                                    id='numberOfGuest'
                                    className='w-full'
                                    {...field}
                                    placeholder='Số người đến...'
                                    onChange={(e) => {
                                      if (selectedTable) {
                                        const maxCapacity = selectedTable.capacity
                                        if (Number(e.target.value) > maxCapacity) {
                                          field.onChange(maxCapacity)
                                          return
                                        }
                                      }
                                      const value = e.target.value.replace(/\D/g, '')
                                      field.onChange(Number(value))
                                    }}
                                  />
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='reservationDate'
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor='reservationDate'>Ngày đến</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <div className='flex items-center justify-between gap-1'>
                                    <div className='flex-1'>
                                      <Popover open={dateView} onOpenChange={setDateView}>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant='outline'
                                            id='date'
                                            className='w-full justify-between font-normal'
                                          >
                                            {reservationDate ? formatDateToLocaleString(reservationDate) : 'Ngày đến'}
                                            <ChevronDownIcon />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
                                          <Calendar
                                            mode='single'
                                            selected={field.value ? new Date(field.value) : undefined}
                                            captionLayout='dropdown'
                                            initialFocus
                                            onSelect={(date) => {
                                              if (date) {
                                                field.onChange(date.toLocaleString().split(',')[0])
                                                setDateView(false)
                                              }
                                            }}
                                            disabled={(date) => date < new Date() || date > addDays(new Date(), 7)}
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                    <div className=''>
                                      <Button
                                        type='button'
                                        className='cursor-pointer'
                                        onClick={() => field.onChange('')}
                                      >
                                        x
                                      </Button>
                                    </div>
                                  </div>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='reservationTime'
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor='reservationTime'>Thời gian đến</Label>
                                <div className='w-full space-y-2'>
                                  <Select
                                    value={field.value}
                                    onValueChange={(value) => field.onChange(value)}
                                    disabled={!selectedTable || !reservationDate}
                                  >
                                    <SelectTrigger className='w-full'>
                                      <SelectValue placeholder='Chọn thời gian' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedTable && reservationDate
                                        ? getAvailableTimeSlots(selectedTable, reservationDate).map((timeSlot) => (
                                            <SelectItem key={timeSlot} value={timeSlot}>
                                              {timeSlot}
                                            </SelectItem>
                                          ))
                                        : Array.from(
                                            { length: (RESTAURANT_HOURS.close - RESTAURANT_HOURS.open) * 2 },
                                            (_, i) => {
                                              const totalMinutes = RESTAURANT_HOURS.open * 60 + i * 30
                                              const hour = Math.floor(totalMinutes / 60)
                                              const minute = totalMinutes % 60
                                              const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                                              return (
                                                <SelectItem key={timeSlot} value={timeSlot}>
                                                  {timeSlot}
                                                </SelectItem>
                                              )
                                            }
                                          )}
                                    </SelectContent>
                                  </Select>
                                  {selectedTable && reservationDate && (
                                    <div className='text-xs text-gray-500 mt-1'>
                                      <p>
                                        Có sẵn: {getAvailableTimeSlots(selectedTable, reservationDate).length}/
                                        {(RESTAURANT_HOURS.close - RESTAURANT_HOURS.open) * 2} khung giờ
                                      </p>
                                      {getAvailableTimeSlots(selectedTable, reservationDate).length <
                                        (RESTAURANT_HOURS.close - RESTAURANT_HOURS.open) * 2 && (
                                        <p className='text-yellow-500'>
                                          Đã loại bỏ{' '}
                                          {(RESTAURANT_HOURS.close - RESTAURANT_HOURS.open) * 2 -
                                            getAvailableTimeSlots(selectedTable, reservationDate).length}{' '}
                                          khung giờ do{' '}
                                          {reservationDate === new Date().toISOString().split('T')[0]
                                            ? 'đã qua hoặc có thể xung đột đặt bàn'
                                            : 'có thể xung đột đặt bàn'}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name='note'
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor='note'>Ghi chú</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Textarea id='note' className='w-full' {...field} placeholder='Ghi chú...' />
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </form>
                      <div className='flex justify-end mt-5'>
                        <Button
                          type='submit'
                          form='create-reservation-form'
                          className='cursor-pointer'
                          disabled={isSubmitting}
                        >
                          Đặt bàn
                        </Button>
                      </div>
                    </Form>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className='text-center py-12'>
                  <Users className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>Chọn bàn để bắt đầu</h3>
                  <p className='text-gray-500'>Vui lòng chọn một bàn từ danh sách bên trái để tiếp tục đặt bàn.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
