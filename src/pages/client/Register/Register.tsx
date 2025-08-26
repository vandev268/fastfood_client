import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { RegisterBodySchema, type RegisterBodyType, type SendOTPBodyType } from '@/schemaValidations/auth.schema'
import { useRegisterMutation, useSendOTPMutation } from '@/queries/useAuth'
import { handleError } from '@/lib/utils'
import { toast } from 'sonner'
import { useAppContext } from '@/components/AppProvider'
import { useState, useEffect } from 'react'
import { Eye, EyeClosed } from 'lucide-react'
import { VerificationCode } from '@/constants/auth'

export default function Register() {
  const { setProfile } = useAppContext()

  const [inputType, setInputType] = useState<'text' | 'password'>('password')
  const [countdown, setCountdown] = useState(0)

  const form = useForm<RegisterBodyType>({
    resolver: zodResolver(RegisterBodySchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      code: '',
      password: '',
      confirmPassword: ''
    }
  })

  const sendOTPMutation = useSendOTPMutation()
  const handleSendOTP = async () => {
    if (sendOTPMutation.isPending || countdown > 0) return
    try {
      const email = form.getValues('email')
      if (!email) {
        form.setError('email', { type: 'manual', message: 'Email is required' })
        return
      }

      const body: SendOTPBodyType = {
        email: email,
        type: VerificationCode.Register
      }

      await sendOTPMutation.mutateAsync(body)
      setCountdown(60)
      toast.success('OTP đã được gửi đến email của bạn', {
        duration: 2000,
        position: 'bottom-right'
      })
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown])

  const registerMutation = useRegisterMutation()
  const onSubmit = async (data: RegisterBodyType) => {
    if (registerMutation.isPending) return
    try {
      const result = await registerMutation.mutateAsync(data)
      setProfile(result.data.user)
      toast.success('Đăng ký thành công', {
        duration: 2000,
        position: 'bottom-right'
      })
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  return (
    <Card className='mx-auto w-full max-w-sm mt-10'>
      <CardHeader>
        <CardTitle className='text-2xl text-center'>Đăng ký</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {' '}
          <form
            className='space-y-4 w-full'
            noValidate
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log(error)
            })}
          >
            <div className='grid gap-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <Label htmlFor='name'>Họ và tên</Label>
                      <Input id='name' type='text' placeholder='Nguyen Van A' required {...field} />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <Label htmlFor='phoneNumber'>Số điện thoại</Label>
                      <Input
                        id='phoneNumber'
                        type='text'
                        placeholder='0123456789'
                        required
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '') // Chỉ cho phép số
                          field.onChange(value)
                        }}
                      />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <Label htmlFor='email'>Email</Label>
                      <Input
                        id='email'
                        type='email'
                        placeholder='a@example.com'
                        required
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          if (e.target.value) {
                            form.clearErrors('email')
                          }
                        }}
                      />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <Label htmlFor='code'>Mã OTP</Label>

                      <div className='flex gap-1'>
                        <Input
                          id='code'
                          type='text'
                          required
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            if (value.length > 6) {
                              return
                            }
                            field.onChange(value)
                          }}
                        />
                        <Button
                          type='button'
                          variant='outline'
                          className='col-span-1'
                          onClick={handleSendOTP}
                          disabled={countdown > 0 || sendOTPMutation.isPending}
                        >
                          {countdown > 0 ? `${countdown}s` : 'Gửi OTP'}
                        </Button>
                      </div>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <div className='flex items-center'>
                        <Label htmlFor='password'>Mật khẩu</Label>
                      </div>
                      <div className='w-full relative'>
                        <Input id='password' className='w-full' {...field} type={inputType} />
                        {inputType === 'password' ? (
                          <EyeClosed
                            className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                            style={{ top: '50%' }}
                            onClick={() => {
                              setInputType((prev) => (prev === 'text' ? 'password' : 'text'))
                            }}
                          />
                        ) : (
                          <Eye
                            className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                            style={{ top: '50%' }}
                            onClick={() => {
                              setInputType((prev) => (prev === 'text' ? 'password' : 'text'))
                            }}
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
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <div className='flex items-center'>
                        <Label htmlFor='confirmPassword'>Xác nhận mật khẩu</Label>
                      </div>
                      <div className='w-full relative'>
                        <Input id='confirmPassword' className='w-full' {...field} type={inputType} />
                        {inputType === 'password' ? (
                          <EyeClosed
                            className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                            style={{ top: '50%' }}
                            onClick={() => {
                              setInputType((prev) => (prev === 'text' ? 'password' : 'text'))
                            }}
                          />
                        ) : (
                          <Eye
                            className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                            style={{ top: '50%' }}
                            onClick={() => {
                              setInputType((prev) => (prev === 'text' ? 'password' : 'text'))
                            }}
                          />
                        )}
                      </div>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button type='submit' className='w-full'>
                Đăng ký
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
