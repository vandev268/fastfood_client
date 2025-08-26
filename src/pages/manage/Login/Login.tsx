'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { LoginBodySchema, type LoginBodyType } from '@/schemaValidations/auth.schema'
import { useLoginMutation } from '@/queries/useAuth'
import { handleError } from '@/lib/utils'
import { toast } from 'sonner'
import { useAppContext } from '@/components/AppProvider'

export default function Login() {
  const { setProfile } = useAppContext()
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
      setProfile(result.data.user)
      toast.success('Đăng nhập thành công', {
        duration: 2000,
        position: 'bottom-right'
      })
    } catch (error) {
      console.error('Login error:', error)
      handleError(error, form.setError)
    }
  }
  return (
    <Card className='mx-auto w-full max-w-sm mt-10'>
      <CardHeader>
        <CardTitle className='text-2xl text-center'>Quản lý</CardTitle>
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
                      <Input id='email' type='email' required {...field} />
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
                        <Label htmlFor='password'>Password</Label>
                      </div>
                      <Input id='password' type='password' required {...field} />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button type='submit' className='w-full'>
                Đăng nhập
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
