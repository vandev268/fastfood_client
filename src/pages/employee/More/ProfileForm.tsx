import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Edit, Trash2, CalendarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { UpdateProfileBodySchema, type UpdateProfileBodyType } from '@/schemaValidations/profile.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useAppContext } from '@/components/AppProvider'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateProfileMutation } from '@/queries/useProfile'
import { cn, handleError, setProfileToLocalStorage } from '@/lib/utils'
import Config from '@/constants/config'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useUploadImagesMutation } from '@/queries/useMedia'

export default function ProfileForm() {
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

  const uploadImageMutation = useUploadImagesMutation()
  const updateProfileMutation = useUpdateProfileMutation()
  const onSubmit = async (body: UpdateProfileBodyType) => {
    if (updateProfileMutation.isPending || uploadImageMutation.isPending) return
    try {
      if (file) {
        const formData = new FormData()
        formData.append('files', file)
        const uploadResult = await uploadImageMutation.mutateAsync(formData)
        body = {
          ...body,
          avatar: uploadResult.data.data[0].url
        }
      }
      const result = await updateProfileMutation.mutateAsync(body)
      setProfile(result.data)
      setProfileToLocalStorage(result.data)
      toast.success('Cập nhật thông tin thành công')
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  if (!profile) return <div>Loading...</div>
  return (
    <div className='lg:col-span-7'>
      <Card>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-profile-form'
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log(error)
            })}
          >
            <CardHeader>
              <div className='border-b border-b-gray-200 py-6 flex items-center justify-between'>
                <FormField
                  control={form.control}
                  name='avatar'
                  render={({ field }) => (
                    <FormItem>
                      <div className='flex items-center'>
                        <div className='grid grid-cols-4 items-center justify-items-start'>
                          <div className='col-span-3 w-full space-y-2'>
                            <div className='flex gap-4 items-start justify-start'>
                              <div className='relative group'>
                                <Avatar className='aspect-square w-18 h-18 rounded-full object-cover'>
                                  <AvatarImage src={previewAvatarFromFile ?? undefined} className='object-cover' />
                                  <AvatarFallback className='rounded-full text-2xl'>
                                    {form.getValues('name').slice(0, 2) ?? <img src={Config.ImageBaseUrl} alt='img' />}
                                  </AvatarFallback>
                                </Avatar>

                                <div className='absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                                  <button
                                    type='button'
                                    onClick={() => imageInputRef.current?.click()}
                                    className='transition-colors cursor-pointer'
                                    title='Sửa ảnh'
                                  >
                                    <Edit className='h-4 w-4 text-white' />
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
                                      <Trash2 className='h-4 w-4 text-white' />
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
                        <div>
                          <CardTitle className='text-2xl'>Thông tin nhân viên</CardTitle>
                          <CardDescription>Cập nhật thông tin cá nhân của nhân viên</CardDescription>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
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
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor='name'>Họ và tên</Label>
                          <div className='col-span-3 w-full space-y-2'>
                            <Input id='name' className='w-full' {...field} />
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='space-y-2'>
                    <FormField
                      control={form.control}
                      name='phoneNumber'
                      render={({ field }) => (
                        <FormItem>
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
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input id='email' type='email' value={profile.email} disabled className='bg-gray-100' />
                  </div>
                  <div className='space-y-2'>
                    <FormField
                      control={form.control}
                      name='dateOfBirth'
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor='dateOfBirth'>Ngày sinh</Label>
                          <div className='grid grid-cols-10 gap-1'>
                            <div className='col-span-9 w-full space-y-2'>
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
                            <div className='col-span-1 mr-5'>
                              <Button type='button' className='cursor-pointer' onClick={() => field.onChange(null)}>
                                x
                              </Button>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  )
}
