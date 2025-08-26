import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { handleError } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Eye, EyeClosed } from 'lucide-react'
import { useState } from 'react'
import { ChangeProfilePasswordBodySchema, type ChangeProfilePasswordBodyType } from '@/schemaValidations/profile.schema'
import { useChangeProfilePasswordMutation } from '@/queries/useProfile'

export default function ChangePassword() {
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
  const form = useForm<ChangeProfilePasswordBodyType>({
    resolver: zodResolver(ChangeProfilePasswordBodySchema),
    defaultValues: {
      password: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  })

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
    <div className='rounded-sm bg-white px-2 pb-2 shadow md:px-7'>
      <div className='border-b border-b-gray-200 py-6 flex items-center justify-between'>
        <div>
          <h1 className='text-lg font-medium capitalize text-gray-900'>Đổi mật khẩu</h1>
          <div className='mt-1 text-sm text-gray-700'>Đổi mật khẩu định kỳ để bảo mật tài khoản</div>
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
      <Form {...form}>
        <form
          noValidate
          className='grid auto-rows-max items-start gap-4 md:gap-8'
          id='change-password-form'
          onSubmit={form.handleSubmit(onSubmit, (error) => {
            console.log(error)
          })}
        >
          <div className='grid gap-4 py-4'>
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                    <Label htmlFor='password'>Mật khẩu hiện tại</Label>
                    <div className='w-full col-span-3 space-y-2 relative'>
                      <Input
                        id='password'
                        className='w-full'
                        {...field}
                        type={showPasswords.password ? 'text' : 'password'}
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
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                    <Label htmlFor='newPassword'>Mật khẩu mới</Label>
                    <div className='w-full col-span-3 space-y-2 relative'>
                      <Input
                        id='newPassword'
                        className='w-full'
                        {...field}
                        type={showPasswords.newPassword ? 'text' : 'password'}
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
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmNewPassword'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                    <Label htmlFor='confirmNewPassword'>Xác nhận mật khẩu mới</Label>
                    <div className='w-full col-span-3 space-y-2 relative'>
                      <Input
                        id='confirmNewPassword'
                        className='w-full'
                        {...field}
                        type={showPasswords.confirmNewPassword ? 'text' : 'password'}
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
