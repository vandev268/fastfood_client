import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, PlusCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { cn, handleError } from '@/lib/utils'
import { CreateReservationBodySchema, type CreateReservationBodyType } from '@/schemaValidations/reservation.schema'
import { ReservationStatus } from '@/constants/reservation'
import { useAllTablesQuery } from '@/queries/useTable'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { addDays, format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { TableLocationValues, TableStatus } from '@/constants/table'
import { Badge } from '@/components/ui/badge'
import classNames from 'classnames'
import { useCreateReservationMutation } from '@/queries/useReservation'
import { toast } from 'sonner'
import type { TableType } from '@/schemaValidations/table.schema'
import { formatTableLocationText, formatTableStatusColor, formatTableStatusText } from '@/lib/format'

export default function CreateReservation() {
  const [open, setOpen] = useState(false)
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [previewTable, setPreviewTable] = useState<TableType | null>(null)

  const form = useForm<CreateReservationBodyType>({
    resolver: zodResolver(CreateReservationBodySchema),
    defaultValues: {
      guestName: '',
      guestPhone: '',
      numberOfGuest: 1,
      reservationTime: undefined,
      note: '',
      tableId: null,
      status: ReservationStatus.Confirmed,
      userId: null
    }
  })

  const reset = () => {
    setOpen((prep) => !prep)
    form.reset()
  }

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      form.setValue('reservationTime', date)
    }
  }

  function handleTimeChange(type: 'hour' | 'minute' | 'ampm', value: string) {
    const currentDate = form.getValues('reservationTime') || new Date()
    const newDate = new Date(currentDate)

    if (type === 'hour') {
      const hour = parseInt(value, 10)
      newDate.setHours(newDate.getHours() >= 12 ? hour + 12 : hour)
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(value, 10))
    } else if (type === 'ampm') {
      const hours = newDate.getHours()
      if (value === 'AM' && hours >= 12) {
        newDate.setHours(hours - 12)
      } else if (value === 'PM' && hours < 12) {
        newDate.setHours(hours + 12)
      }
    }

    form.setValue('reservationTime', newDate)
  }

  const tablesQuery = useAllTablesQuery()
  const tables = useMemo(() => {
    return tablesQuery.data?.data.data || []
  }, [tablesQuery.data])

  const watchedTableId = form.watch('tableId')
  const selectedTable = useMemo(() => {
    return tables.find((table) => table.id === watchedTableId) || null
  }, [tables, watchedTableId])

  const handleTableSelect = (table: TableType) => {
    form.setValue('tableId', table.id)
    setTableDialogOpen(false)
  }

  const createReservationMutation = useCreateReservationMutation()
  const onSubmit = async (body: CreateReservationBodyType) => {
    if (createReservationMutation.isPending) return
    try {
      await createReservationMutation.mutateAsync(body)
      reset()
      toast.success('Create reservation successfully')
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  return (
    <>
      <Dialog onOpenChange={() => reset()} open={open}>
        <DialogTrigger asChild>
          <Button size='sm' className='h-7 gap-1 p-4'>
            <PlusCircle className='h-3.5 w-3.5' />
            <span className='sr-only sm:not-sr-only sm:whitespace-nowrap'>Tạo đơn đặt bàn</span>
          </Button>
        </DialogTrigger>
        <DialogContent className='sm:max-w-[750px] max-h-screen overflow-auto' aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Tạo đơn đặt bàn</DialogTitle>
          </DialogHeader>
          <Card>
            <Form {...form}>
              <form
                noValidate
                className='grid auto-rows-max items-start gap-4 md:gap-8'
                id='create-reservation-form'
                onSubmit={form.handleSubmit(onSubmit, (error) => {
                  console.log(error)
                })}
              >
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 gap-4'>
                      <FormField
                        control={form.control}
                        name='tableId'
                        render={({ field }) => (
                          <FormItem>
                            <div className='flex items-center gap-2'>
                              <Label htmlFor='tableId'>Thông tin bàn ăn</Label>
                              {selectedTable && (
                                <span
                                  className='text-xs underline text-red-600 cursor-pointer'
                                  onClick={() => form.setValue('tableId', null)}
                                >
                                  clear
                                </span>
                              )}
                            </div>
                            <div className='col-span-3 w-full space-y-2'>
                              <Input id='tableId' type='hidden' {...field} value={field.value || ''} />

                              <div
                                className={classNames('min-h-[40px] rounded-md px-3 py-2 bg-background', {
                                  'border border-dashed': selectedTable
                                })}
                              >
                                {selectedTable ? (
                                  <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                      <Badge
                                        variant='outline'
                                        className={formatTableStatusColor({ status: selectedTable.status })}
                                      >
                                        {formatTableStatusText(selectedTable.status)}
                                      </Badge>
                                      <span className='font-medium'>{selectedTable.code}</span>
                                      <span className='text-sm text-muted-foreground'>
                                        (Sức chứa: {selectedTable.capacity} người)
                                      </span>
                                    </div>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => setTableDialogOpen(true)}
                                    >
                                      Thay đổi
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    type='button'
                                    variant='outline'
                                    className='w-full justify-start text-muted-foreground'
                                    onClick={() => setTableDialogOpen(true)}
                                  >
                                    Chọn bàn ăn...
                                  </Button>
                                )}
                              </div>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='guestName'
                          render={({ field }) => (
                            <FormItem>
                              <Label htmlFor='guestName'>Họ và tên</Label>
                              <div className='col-span-3 w-full space-y-2'>
                                <Input id='guestName' className='w-full' {...field} placeholder='Họ và tên...' />
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='guestPhone'
                          render={({ field }) => (
                            <FormItem>
                              <Label htmlFor='guestPhone'>Số điện thoại</Label>
                              <div className='col-span-3 w-full space-y-2'>
                                <Input
                                  id='guestPhone'
                                  className='w-full'
                                  placeholder='Số điện thoại...'
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '')
                                    field.onChange(value)
                                  }}
                                />
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='numberOfGuest'
                          render={({ field }) => (
                            <FormItem>
                              <Label htmlFor='numberOfGuest'>Số lượng khách</Label>
                              <div className='col-span-3 w-full space-y-2'>
                                <Input
                                  id='numberOfGuest'
                                  className='w-full'
                                  {...field}
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
                                  placeholder='Số lượng khách...'
                                />
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className='space-y-2'>
                        <FormField
                          control={form.control}
                          name='reservationTime'
                          render={({ field }) => (
                            <FormItem>
                              <Label htmlFor='reservationTime'>Thời gian đặt</Label>
                              <div className='col-span-3 w-full space-y-2'>
                                <div className='col-span-3 w-full space-y-2'>
                                  <div className='flex items-center justify-between gap-1'>
                                    <div className='flex-1'>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant={'outline'}
                                              className={cn(
                                                'w-full pl-3 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                              )}
                                            >
                                              {field.value ? (
                                                format(field.value, 'MM/dd/yyyy hh:mm aa')
                                              ) : (
                                                <span>MM/DD/YYYY hh:mm aa</span>
                                              )}
                                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className='w-auto p-0'>
                                          <div className='sm:flex'>
                                            <Calendar
                                              mode='single'
                                              selected={field.value ?? new Date()}
                                              onSelect={handleDateSelect}
                                              initialFocus
                                              disabled={(date) => date < new Date() || date > addDays(new Date(), 7)}
                                            />
                                            <div className='flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x'>
                                              <ScrollArea className='w-64 sm:w-auto'>
                                                <div className='flex sm:flex-col p-2'>
                                                  {Array.from({ length: 12 }, (_, i) => i + 1)
                                                    .reverse()
                                                    .map((hour) => (
                                                      <Button
                                                        key={hour}
                                                        size='icon'
                                                        variant={
                                                          field.value && field.value.getHours() % 12 === hour % 12
                                                            ? 'default'
                                                            : 'ghost'
                                                        }
                                                        className='sm:w-full shrink-0 aspect-square'
                                                        onClick={() => handleTimeChange('hour', hour.toString())}
                                                      >
                                                        {hour}
                                                      </Button>
                                                    ))}
                                                </div>
                                                <ScrollBar orientation='horizontal' className='sm:hidden' />
                                              </ScrollArea>
                                              <ScrollArea className='w-64 sm:w-auto'>
                                                <div className='flex sm:flex-col p-2'>
                                                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                                    <Button
                                                      key={minute}
                                                      size='icon'
                                                      variant={
                                                        field.value && field.value.getMinutes() === minute
                                                          ? 'default'
                                                          : 'ghost'
                                                      }
                                                      className='sm:w-full shrink-0 aspect-square'
                                                      onClick={() => handleTimeChange('minute', minute.toString())}
                                                    >
                                                      {minute.toString().padStart(2, '0')}
                                                    </Button>
                                                  ))}
                                                </div>
                                                <ScrollBar orientation='horizontal' className='sm:hidden' />
                                              </ScrollArea>
                                              <ScrollArea className=''>
                                                <div className='flex sm:flex-col p-2'>
                                                  {['AM', 'PM'].map((ampm) => (
                                                    <Button
                                                      key={ampm}
                                                      size='icon'
                                                      variant={
                                                        field.value &&
                                                        ((ampm === 'AM' && field.value.getHours() < 12) ||
                                                          (ampm === 'PM' && field.value.getHours() >= 12))
                                                          ? 'default'
                                                          : 'ghost'
                                                      }
                                                      className='sm:w-full shrink-0 aspect-square'
                                                      onClick={() => handleTimeChange('ampm', ampm)}
                                                    >
                                                      {ampm}
                                                    </Button>
                                                  ))}
                                                </div>
                                              </ScrollArea>
                                            </div>
                                          </div>
                                        </PopoverContent>
                                      </Popover>

                                      <FormMessage />
                                    </div>
                                    <div className=''>
                                      <Button
                                        type='button'
                                        className='cursor-pointer'
                                        onClick={() => field.onChange(null)}
                                      >
                                        X
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-1 gap-4'>
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
                  </div>
                </CardContent>
              </form>
            </Form>
          </Card>
          <DialogFooter>
            <Button type='submit' form='create-reservation-form'>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className='sm:max-w-[1200px] max-h-[80vh]'>
          <DialogHeader>
            <DialogTitle>Chọn bàn ăn</DialogTitle>
          </DialogHeader>
          <div className='grid grid-cols-2 gap-6 max-h-[60vh]'>
            <div className='space-y-3'>
              <h3 className='font-medium text-sm text-muted-foreground'>Danh sách bàn ăn</h3>
              <ScrollArea className='h-100 pr-4'>
                <div>
                  {TableLocationValues.map((location) => (
                    <div key={location} className='py-3'>
                      <h2 className='font-semibold mb-2'>{formatTableLocationText(location)}</h2>
                      <div className='grid grid-cols-2 gap-3'>
                        {tables
                          .filter((table) => table.location === location)
                          .map((table) => (
                            <div
                              key={table.id}
                              className={cn(
                                'p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:bg-green-50',
                                selectedTable?.id === table.id ? 'border-2 border-primary bg-primary/5' : '',
                                previewTable?.id === table.id ? 'border-2 border-blue-500 bg-blue-50' : ''
                              )}
                              onClick={() => {
                                if (table.status === TableStatus.Available) {
                                  setPreviewTable(table)
                                }
                              }}
                            >
                              <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                  <span className='font-medium text-sm'>#{table.code}</span>
                                  <Badge variant='outline' className={formatTableStatusColor({ status: table.status })}>
                                    {formatTableStatusText(table.status)}
                                  </Badge>
                                </div>
                                <div className='text-xs text-muted-foreground'>{table.capacity} người</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>

                {tables.length === 0 && (
                  <div className='text-center py-8 text-muted-foreground text-sm'>
                    Không có bàn ăn nào được tìm thấy
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className='space-y-3 border-l pl-6'>
              <h3 className='font-medium text-sm text-muted-foreground'>Thông tin bàn ăn</h3>
              <div className='h-full'>
                {previewTable ? (
                  <div className='space-y-4'>
                    <div className='p-4 border rounded-lg bg-muted/20'>
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-semibold text-lg'>Bàn #{previewTable.code}</h4>
                          <Badge variant='outline' className={formatTableStatusColor({ status: previewTable.status })}>
                            {formatTableStatusText(previewTable.status)}
                          </Badge>
                        </div>

                        <div className='grid grid-cols-1 gap-3 text-sm'>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Sức chứa:</span>
                            <span className='font-medium'>{previewTable.capacity} người</span>
                          </div>

                          {previewTable.location && (
                            <div className='flex justify-between'>
                              <span className='text-muted-foreground'>Vị trí:</span>
                              <span
                                dangerouslySetInnerHTML={{ __html: previewTable.location ?? '...' }}
                                className='font-medium'
                              ></span>
                            </div>
                          )}
                        </div>

                        {previewTable.status !== TableStatus.Available && (
                          <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
                            <p className='text-xs text-yellow-800'>
                              Bàn này hiện tại không khả dụng. Vui lòng chọn bàn khác.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center justify-center h-full'>
                    <div className='text-center text-muted-foreground'>
                      <p className='text-sm'>Chọn một bàn để xem thông tin chi tiết</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className='gap-2'>
            <Button variant='outline' onClick={() => setTableDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (previewTable && previewTable.status === TableStatus.Available) {
                  handleTableSelect(previewTable)
                  setPreviewTable(null)
                }
              }}
              disabled={!previewTable || previewTable.status !== TableStatus.Available}
            >
              Chọn bàn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
