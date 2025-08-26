import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from '@radix-ui/react-icons'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useEffect } from 'react'
import { cn, handleError } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import TinyEditor from '@/components/TinyEditor'
import { UpdateCouponBodySchema, type UpdateCouponBodyType } from '@/schemaValidations/coupon.schema'
import { useCouponDetailQuery, useUpdateCouponMutation } from '@/queries/useCoupon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CouponDiscountType, CouponDiscountTypeValues } from '@/constants/coupon'
import { formatCouponStatusText, formatCouponTypeText } from '@/lib/format'

export default function EditCoupon({
  id,
  setId,
  onSuccess
}: {
  id?: number | undefined
  setId: (value: number | undefined) => void
  onSuccess?: () => void
}) {
  const form = useForm<UpdateCouponBodyType>({
    resolver: zodResolver(UpdateCouponBodySchema),
    defaultValues: {
      code: '',
      description: '',
      discountType: CouponDiscountType.Percent,
      discountValue: 1,
      minOrderAmount: 0,
      usageLimit: 0,
      isActive: true,
      expiresAt: null
    }
  })

  const reset = () => {
    setId(undefined)
    form.reset()
  }

  const couponDetailQuery = useCouponDetailQuery(id)
  useEffect(() => {
    if (couponDetailQuery.data) {
      const { code, description, discountType, discountValue, minOrderAmount, expiresAt, usageLimit, isActive } =
        couponDetailQuery.data.data
      form.reset({
        code,
        description,
        discountType,
        discountValue,
        minOrderAmount,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit,
        isActive
      })
    }
  }, [couponDetailQuery.data, form])

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      form.setValue('expiresAt', date)
    }
  }

  function handleTimeChange(type: 'hour' | 'minute' | 'ampm', value: string) {
    const currentDate = form.getValues('expiresAt') || new Date()
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

    form.setValue('expiresAt', newDate)
  }

  const updateCouponMutation = useUpdateCouponMutation()
  const onSubmit = async (body: UpdateCouponBodyType) => {
    if (updateCouponMutation.isPending) return
    try {
      const payload = {
        couponId: id as number,
        body
      }
      await updateCouponMutation.mutateAsync(payload)
      reset()
      toast.success('Cập nhật mã giảm giá thành công')
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) {
          setId(undefined)
        }
      }}
    >
      <DialogContent className='sm:max-w-[750px] max-h-screen overflow-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Cập nhật mã giảm giá</DialogTitle>
          <DialogDescription>
            Các trường sau đây là bắt buộc: Mã, phần trăm giảm giá, số lượng mã, giá đơn hàng tối thiểu
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-coupon-form'
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log(error)
            })}
          >
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='code'>Mã giảm giá</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='code' className='w-full' {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='discountType'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='discountType'>Loại giá trị</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl id='discountType'>
                            <SelectTrigger className='w-[50%]'>
                              <SelectValue placeholder='Chọn loại giảm giá' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CouponDiscountTypeValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {formatCouponTypeText(value)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='discountValue'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='discountValue'>Phần trăm giảm giá</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input
                          id='discountValue'
                          className='w-full'
                          {...field}
                          onChange={(val) => {
                            const value = Number(val.target.value)
                            if (!isNaN(value)) {
                              field.onChange(value)
                            }
                          }}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='minOrderAmount'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='minOrderAmount'>Giá áp dụng tối thiểu</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input
                          id='minOrderAmount'
                          className='w-full'
                          {...field}
                          onChange={(val) => {
                            const value = Number(val.target.value)
                            if (!isNaN(value)) {
                              field.onChange(value)
                            }
                          }}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='expiresAt'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='expiresAt'>Ngày hết hạn</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <div className='grid grid-cols-12 gap-1'>
                          <div className='col-span-11 w-full space-y-2'>
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
                                              field.value && field.value.getMinutes() === minute ? 'default' : 'ghost'
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
                          <div className='col-span-1 w-full'>
                            <Button type='button' className='cursor-pointer' onClick={() => field.onChange(null)}>
                              x
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='usageLimit'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='usageLimit'>Số lượt sử dụng</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input
                          id='usageLimit'
                          className='w-full'
                          {...field}
                          onChange={(val) => {
                            const value = Number(val.target.value)
                            if (!isNaN(value)) {
                              field.onChange(value)
                            }
                          }}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='isActive'>Trạng thái</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <RadioGroup
                          defaultValue={field.value ? 'active' : 'inactive'}
                          onValueChange={(e) => {
                            const val = e === 'active' ? true : false
                            field.onChange(val)
                          }}
                        >
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='active' id='active' />
                            <Label htmlFor='active'>{formatCouponStatusText(true)}</Label>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='inactive' id='inactive' />
                            <Label htmlFor='inactive'>{formatCouponStatusText(false)}</Label>
                          </div>
                        </RadioGroup>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='description'>Mô tả</Label>
                      <div className='col-span-3 w-full space-y-2 '>
                        <TinyEditor value={field.value} onChange={field.onChange} h={200} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='edit-coupon-form'>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
