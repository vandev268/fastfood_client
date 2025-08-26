import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { LoginBodySchema, type LoginBodyType } from '@/schemaValidations/auth.schema'
import { useGetGoogleLinkQuery, useLoginMutation } from '@/queries/useAuth'
import { handleError } from '@/lib/utils'
import { toast } from 'sonner'
import { useAppContext } from '@/components/AppProvider'
import { useState } from 'react'
import { Eye, EyeClosed } from 'lucide-react'
import { Link } from 'react-router'
import { RoleName } from '@/constants/role'

export default function Login() {
  const { setProfile } = useAppContext()

  const [inputType, setInputType] = useState<'text' | 'password'>('password')

  const form = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const loginMutation = useLoginMutation()
  const onSubmit = async (data: LoginBodyType) => {
    if (loginMutation.isPending) return
    try {
      const result = await loginMutation.mutateAsync(data)
      const role = result.data.user.role
      console.log(role)

      let navigationPath = '/'
      if (role.name === RoleName.Admin || role.name === RoleName.Manager) {
        console.log('Navigating to manage dashboard')
        navigationPath = '/manage/dashboard'
      } else if (role.name === RoleName.Employee) {
        navigationPath = '/employee/orders'
      }

      sessionStorage.setItem('last-path', navigationPath)
      setProfile(result.data.user)

      toast.success('Đăng nhập thành công', {
        duration: 2000,
        position: 'bottom-right'
      })
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  const googleLinkQuery = useGetGoogleLinkQuery()
  const handleLoginWithGoogle = async () => {
    if (googleLinkQuery.isPending) return
    try {
      const result = await googleLinkQuery.data?.data
      if (result) {
        window.location.href = result.url
      }
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <Card className='mx-auto w-full max-w-sm mt-10'>
      <CardHeader>
        <CardTitle className='text-2xl text-center'>Đăng nhập</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {' '}
          <form className='space-y-4 w-full' noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <div className='grid gap-4'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <Label htmlFor='email'>Email</Label>
                      <Input id='email' type='email' placeholder='a@example.com' required {...field} />
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
              <Button type='submit' className='w-full'>
                Đăng nhập
              </Button>
              <Button type='button' variant='outline' className='w-full' onClick={handleLoginWithGoogle}>
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
                  <path
                    d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
                    fill='currentColor'
                  />
                </svg>
                Đăng nhập với Google
              </Button>
            </div>
          </form>
        </Form>
        <Link to='/forgot-password' className='flex justify-end text-red-500 mt-2 underline text-sm'>
          Quên mật khẩu?
        </Link>
      </CardContent>
    </Card>
  )
}
