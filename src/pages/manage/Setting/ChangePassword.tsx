import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { handleError } from '@/lib/utils'
import { useChangeProfilePasswordMutation } from '@/queries/useProfile'
import { ChangeProfilePasswordBodySchema, type ChangeProfilePasswordBodyType } from '@/schemaValidations/profile.schema'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeClosed, Settings } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useState } from 'react'

export default function ChangePassword() {
  const form = useForm<ChangeProfilePasswordBodyType>({
    resolver: zodResolver(ChangeProfilePasswordBodySchema),
    defaultValues: {
      password: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  })

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    newPassword: false,
    confirmNewPassword: false
  })

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const changeProfilePasswordMutation = useChangeProfilePasswordMutation()
  const onSubmit = async (data: ChangeProfilePasswordBodyType) => {
    if (changeProfilePasswordMutation.isPending) return
    try {
      await changeProfilePasswordMutation.mutateAsync(data)
      toast.success('Đổi mật khẩu thành công')
      form.reset()
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  return (
    <div className='lg:col-span-7'>
      <Card>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='change-password-form'
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log(error)
            })}
          >
            <CardHeader>
              <div className='border-b border-b-gray-200 py-6 flex items-center justify-between'>
                <div>
                  <CardTitle className='text-2xl flex items-center gap-2'>
                    <Settings className='h-6 w-6' />
                    Đổi mật khẩu
                  </CardTitle>
                  <CardDescription>Cập nhật mật khẩu thường xuyên để đảm bảo sự bảo mật</CardDescription>
                </div>
                <div className='flex items-center justify-end'>
                  <Button
                    type='submit'
                    form='change-password-form'
                    variant='outline'
                    className='hover:text-white hover:bg-primary hover:border-primary cursor-pointer'
                  >
                    Cập nhật
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4 w-full'>
                <div className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor='password'>Mật khẩu hiện tại</Label>
                        <div className='w-full col-span-3 space-y-2 relative'>
                          <Input
                            id='password'
                            className='w-full'
                            {...field}
                            type={showPasswords.password ? 'text' : 'password'}
                            placeholder='Nhập mật khẩu hiện tại...'
                          />
                          {showPasswords.password ? (
                            <Eye
                              className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                              style={{ top: '45%' }}
                              onClick={() => togglePasswordVisibility('password')}
                            />
                          ) : (
                            <EyeClosed
                              className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                              style={{ top: '45%' }}
                              onClick={() => togglePasswordVisibility('password')}
                            />
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='newPassword'
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor='newPassword'>Mật khẩu mới</Label>
                        <div className='w-full col-span-3 space-y-2 relative'>
                          <Input
                            id='newPassword'
                            className='w-full'
                            {...field}
                            type={showPasswords.newPassword ? 'text' : 'password'}
                            placeholder='Nhập mật khẩu mới...'
                          />
                          {showPasswords.newPassword ? (
                            <Eye
                              className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                              style={{ top: '45%' }}
                              onClick={() => togglePasswordVisibility('newPassword')}
                            />
                          ) : (
                            <EyeClosed
                              className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                              style={{ top: '45%' }}
                              onClick={() => togglePasswordVisibility('newPassword')}
                            />
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* <div className='space-y-1 text-xs'>
                  <div
                    className={`flex items-center gap-2 ${passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${passwordData.newPassword.length >= 8 ? 'bg-green-600' : 'bg-muted-foreground'}`}
                    />
                    At least 8 characters
                  </div>
                  <div
                    className={`flex items-center gap-2 ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-muted-foreground'}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(passwordData.newPassword) ? 'bg-green-600' : 'bg-muted-foreground'}`}
                    />
                    One uppercase letter
                  </div>
                  <div
                    className={`flex items-center gap-2 ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-muted-foreground'}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(passwordData.newPassword) ? 'bg-green-600' : 'bg-muted-foreground'}`}
                    />
                    One lowercase letter
                  </div>
                  <div
                    className={`flex items-center gap-2 ${/[0-9]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-muted-foreground'}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(passwordData.newPassword) ? 'bg-green-600' : 'bg-muted-foreground'}`}
                    />
                    One number
                  </div>
                </div> */}
                </div>

                <div className='space-y-2'>
                  <FormField
                    control={form.control}
                    name='confirmNewPassword'
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor='confirmNewPassword'>Xác nhận mật khẩu mới</Label>
                        <div className='w-full col-span-3 space-y-2 relative'>
                          <Input
                            id='confirmNewPassword'
                            className='w-full'
                            {...field}
                            type={showPasswords.confirmNewPassword ? 'text' : 'password'}
                            placeholder='Xác nhận mật khẩu mới...'
                          />
                          {showPasswords.confirmNewPassword ? (
                            <Eye
                              className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                              style={{ top: '45%' }}
                              onClick={() => togglePasswordVisibility('confirmNewPassword')}
                            />
                          ) : (
                            <EyeClosed
                              className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                              style={{ top: '45%' }}
                              onClick={() => togglePasswordVisibility('confirmNewPassword')}
                            />
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  )
}
