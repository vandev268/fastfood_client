import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { handleError } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreateRoleBodySchema, type CreateRoleBodyType } from '@/schemaValidations/role.schema'
import { useCreateRoleMutation } from '@/queries/useRole'
import TinyEditor from '@/components/TinyEditor'
import { formatRoleStatusText } from '@/lib/format'

export default function AddRole() {
  const [open, setOpen] = useState(false)
  const form = useForm<CreateRoleBodyType>({
    resolver: zodResolver(CreateRoleBodySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true
    }
  })

  const reset = () => {
    setOpen((prep) => !prep)
    form.reset()
  }

  const createRoleMutation = useCreateRoleMutation()

  const onSubmit = async (body: CreateRoleBodyType) => {
    if (createRoleMutation.isPending) return
    try {
      await createRoleMutation.mutateAsync(body)
      reset()
      toast.success('Thêm vai trò thành công')
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  return (
    <Dialog onOpenChange={() => reset()} open={open}>
      <DialogTrigger asChild>
        <Button size='sm' className='h-7 gap-1 p-4'>
          <PlusCircle className='h-3.5 w-3.5' />
          <span className='sr-only sm:not-sr-only sm:whitespace-nowrap'>Thêm vai trò</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[750px] max-h-screen overflow-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Thêm vai trò</DialogTitle>
          <DialogDescription>Các trường sau đây là bắt buộc: Tên vai trò, trạng thái</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8 z-50'
            id='add-role-form'
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log(error)
            })}
          >
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='name'>Tên vai trò</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='name' className='w-full' {...field} placeholder='Tên vài trò...' />
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
                            <Label htmlFor='active'>{formatRoleStatusText(true)}</Label>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='inactive' id='inactive' />
                            <Label htmlFor='inactive'>{formatRoleStatusText(false)}</Label>
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
                      <Label htmlFor='description'>Mô tả vai trò</Label>
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
          <Button type='submit' form='add-role-form'>
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
