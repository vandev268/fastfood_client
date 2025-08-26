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
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { handleError } from '@/lib/utils'
import { toast } from 'sonner'
import { useState } from 'react'
import { Eye, EyeClosed } from 'lucide-react'
import {
  ChangeUserPasswordBodySchema,
  type ChangeUserPasswordBodyType,
  type UserDetailType
} from '@/schemaValidations/user.schema'
import { useChangeUserPasswordMutation } from '@/queries/useUser'

export default function ChangePassword({
  userChangePassword,
  setUserChangePassword,
  onSuccess
}: {
  userChangePassword: UserDetailType | null
  setUserChangePassword: (user: UserDetailType | null) => void
  onSuccess?: () => void
}) {
  const [inputType, setInputType] = useState<'text' | 'password'>('password')

  const form = useForm<Pick<ChangeUserPasswordBodyType, 'password'>>({
    resolver: zodResolver(ChangeUserPasswordBodySchema),
    defaultValues: {
      password: ''
    }
  })

  const reset = () => {
    setInputType('password')
    setUserChangePassword(null)
    form.reset()
  }

  const changeUserPasswordMutation = useChangeUserPasswordMutation()
  const onSubmit = async (body: ChangeUserPasswordBodyType) => {
    if (changeUserPasswordMutation.isPending || !userChangePassword?.id) return
    try {
      const payload = {
        userId: userChangePassword.id,
        body
      }
      await changeUserPasswordMutation.mutateAsync(payload)
      reset()
      toast.success(`Đổi mật khẩu thành công cho người dùng ${userChangePassword.name || userChangePassword.email}`)
    } catch (error) {
      console.log('Error changing password:', error)
      handleError(error, form.setError)
    }
  }

  return (
    <Dialog
      open={Boolean(userChangePassword)}
      onOpenChange={(value) => {
        if (!value) {
          reset()
        }
      }}
    >
      <DialogContent className='sm:max-w-[750px] max-h-screen overflow-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>Các trường sau đây là bắt buộc: Mật khẩu mới</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-change-password-form'
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
                      <Label htmlFor='password'>Mật khẩu mới</Label>
                      <div className='w-full col-span-3 space-y-2 relative'>
                        <Input id='password' className='w-full' {...field} type={inputType} placeholder='••••••' />
                        {inputType === 'password' ? (
                          <EyeClosed
                            className='absolute right-2 top-1/2s -translate-y-1/2 h-4 w-4 cursor-pointer'
                            style={{ top: '45%' }}
                            onClick={() => {
                              setInputType((prev) => (prev === 'text' ? 'password' : 'text'))
                            }}
                          />
                        ) : (
                          <Eye
                            className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer'
                            style={{ top: '45%' }}
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
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='edit-change-password-form'>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
