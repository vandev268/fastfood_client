import { useAppContext } from '@/components/AppProvider'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UpdateProfileBodySchema, type UpdateProfileBodyType } from '@/schemaValidations/profile.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { CalendarIcon, Trash2, Edit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn, handleError, setProfileToLocalStorage } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import Config from '@/constants/config'
import { useUpdateProfileMutation } from '@/queries/useProfile'

export default function Information() {
  const { profile, setProfile } = useAppContext()
  const [file, setFile] = useState<File | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<UpdateProfileBodyType>({
    resolver: zodResolver(UpdateProfileBodySchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      avatar: null,
      dateOfBirth: null
    }
  })

  const avatar = form.watch('avatar')
  const previewAvatarFromFile = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file)
    }
    return avatar
  }, [file, avatar])

  useEffect(() => {
    if (profile) {
      const { name, avatar, phoneNumber, dateOfBirth } = profile
      form.reset({
        name: name,
        phoneNumber: phoneNumber,
        avatar: avatar,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
      })
    }
  }, [profile, form])

  const updateProfileMutation = useUpdateProfileMutation()
  const onSubmit = async (data: UpdateProfileBodyType) => {
    if (updateProfileMutation.isPending) return
    try {
      const result = await updateProfileMutation.mutateAsync(data)
      setProfile(result.data)
      setProfileToLocalStorage(result.data)
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  return (
    <div className='rounded-sm bg-white px-2 shadow md:px-7'>
      <div className='border-b border-b-gray-200 py-6 flex items-center justify-between'>
        <div>
          <h1 className='text-lg font-medium capitalize text-gray-900'>Hồ Sơ Của Tôi</h1>
          <div className='mt-1 text-sm text-gray-700'>Quản lý thông tin hồ sơ để bảo mật tài khoản</div>
        </div>
        <div className='flex items-center justify-end'>
          <Button
            type='submit'
            form='edit-profile-form'
            variant='outline'
            className='hover:text-white hover:bg-primary hover:border-primary cursor-pointer'
          >
            Cập nhật
          </Button>
        </div>
      </div>
      <Form {...form}>
        <form
          noValidate
          className='grid auto-rows-max items-start gap-4 md:gap-8'
          id='edit-profile-form'
          onSubmit={form.handleSubmit(onSubmit, (error) => {
            console.log(error)
          })}
        >
          <div className='grid gap-4 py-8'>
            <FormField
              control={form.control}
              name='avatar'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                    <Label htmlFor='name'>Avatar</Label>
                    <div className='col-span-3 w-full space-y-2'>
                      <div className='flex gap-4 items-start justify-start'>
                        <div className='relative group'>
                          <Avatar className='aspect-square w-[120px] h-[120px] rounded-full object-cover'>
                            <AvatarImage src={previewAvatarFromFile ?? undefined} className='object-cover' />
                            <AvatarFallback className='rounded-full text-2xl'>
                              <img src={Config.ImageBaseUrl} />
                            </AvatarFallback>
                          </Avatar>

                          <div className='absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3'>
                            <button
                              type='button'
                              onClick={() => imageInputRef.current?.click()}
                              className='transition-colors cursor-pointer'
                              title='Sửa ảnh'
                            >
                              <Edit className='h-5 w-5 text-white' />
                            </button>
                            {(file || avatar) && (
                              <button
                                type='button'
                                onClick={() => {
                                  setFile(null)
                                  field.onChange(null)
                                  if (imageInputRef.current) {
                                    imageInputRef.current.value = ''
                                  }
                                }}
                                className='transition-colors cursor-pointer'
                                title='Xóa ảnh'
                              >
                                <Trash2 className='h-5 w-5 text-white' />
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type='file'
                          accept='image/*'
                          ref={imageInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setFile(file)
                              field.onChange('http://localhost:3000/' + file.name)
                            }
                          }}
                          className='hidden'
                        />
                      </div>
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                    <Label htmlFor='name'>Họ và tên</Label>
                    <div className='col-span-3 w-full space-y-2'>
                      <Input id='name' className='w-full' {...field} />
                      <FormMessage />
                    </div>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                    <Label htmlFor='phoneNumber'>Số điện thoại</Label>
                    <div className='col-span-3 w-full space-y-2'>
                      <Input
                        id='phoneNumber'
                        className='w-full'
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          field.onChange(value)
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
              name='dateOfBirth'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                    <Label htmlFor='dateOfBirth'>Ngày sinh</Label>
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
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                  <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='start'>
                              <Calendar
                                mode='single'
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                captionLayout='dropdown'
                              />
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
          </div>
        </form>
      </Form>
    </div>
  )
}
