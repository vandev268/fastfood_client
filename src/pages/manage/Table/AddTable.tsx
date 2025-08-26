import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { handleError } from '@/lib/utils'
import { CreateTableBodySchema, type CreateTableBodyType } from '@/schemaValidations/table.schema'
import { useCreateTableMutation } from '@/queries/useTable'
import { TableLocation, TableLocationValues, TableStatusValues } from '@/constants/table'
import { formatTableLocationText, formatTableStatusText } from '@/lib/format'

export default function AddTable() {
  const [open, setOpen] = useState(false)
  const form = useForm<CreateTableBodyType>({
    resolver: zodResolver(CreateTableBodySchema),
    defaultValues: {
      code: '',
      capacity: 1,
      status: 'Available',
      location: TableLocation.Floor1
    }
  })

  const reset = () => {
    setOpen((prep) => !prep)
    form.reset()
  }

  const createTableMutation = useCreateTableMutation()

  const onSubmit = async (body: CreateTableBodyType) => {
    if (createTableMutation.isPending) return
    try {
      await createTableMutation.mutateAsync(body)
      reset()
      toast.success('Thêm bàn thành công')
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  return (
    <Dialog onOpenChange={() => reset()} open={open}>
      <DialogTrigger asChild>
        <Button size='sm' className='h-7 gap-1 p-4'>
          <PlusCircle className='h-3.5 w-3.5' />
          <span className='sr-only sm:not-sr-only sm:whitespace-nowrap'>Thêm bàn ăn</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[750px] max-h-screen overflow-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Thêm bàn ăn</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8 z-50'
            id='add-table-form'
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
                      <Label htmlFor='code'>Mã bàn</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='code' className='w-full' {...field} placeholder='Mã bàn...' />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='capacity'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='capacity'>Sức chứa</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input
                          id='capacity'
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
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='status'>Trạng thái bàn ăn</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl id='status'>
                            <SelectTrigger className='w-[50%]'>
                              <SelectValue placeholder='Chọn trạng thái' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TableStatusValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {formatTableStatusText(value)}
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
                name='location'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='location'>Vị trí bàn ăn</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl id='location'>
                            <SelectTrigger className='w-[50%]'>
                              <SelectValue placeholder='Chọn vị trí' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TableLocationValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {formatTableLocationText(value)}
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
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='add-table-form'>
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
