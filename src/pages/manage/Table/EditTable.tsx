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
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect } from 'react'
import { handleError } from '@/lib/utils'
import { toast } from 'sonner'
import { UpdateTableBodySchema, type UpdateTableBodyType } from '@/schemaValidations/table.schema'
import { useTableDetailQuery, useUpdateTableMutation } from '@/queries/useTable'
import { TableLocation, TableLocationValues, TableStatusValues } from '@/constants/table'
import { formatTableLocationText, formatTableStatusText } from '@/lib/format'

export default function EditTable({
  id,
  setId,
  onSuccess
}: {
  id?: number | undefined
  setId: (value: number | undefined) => void
  onSuccess?: () => void
}) {
  const form = useForm<UpdateTableBodyType>({
    resolver: zodResolver(UpdateTableBodySchema),
    defaultValues: {
      code: '',
      capacity: 1,
      status: 'Available',
      location: TableLocation.Floor1
    }
  })

  const reset = () => {
    setId(undefined)
    form.reset()
  }

  const tableDetailQuery = useTableDetailQuery(id)
  useEffect(() => {
    if (tableDetailQuery.data) {
      const { code, capacity, status, location } = tableDetailQuery.data.data
      form.reset({
        code,
        capacity,
        status,
        location
      })
    }
  }, [tableDetailQuery.data, form])

  const updateTableMutation = useUpdateTableMutation()
  const onSubmit = async (body: UpdateTableBodyType) => {
    if (updateTableMutation.isPending) return
    try {
      const payload = {
        tableId: id as number,
        body
      }
      await updateTableMutation.mutateAsync(payload)
      reset()
      toast.success('Cập nhật bàn ăn thành công')
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) {
          setId(undefined)
        }
      }}
    >
      <DialogContent className='sm:max-w-[750px] max-h-screen overflow-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Cập nhật bàn ăn</DialogTitle>
          <DialogDescription>Các trường sau đây là bắt buộc: Mã, sức chứa, trạng thái bàn ăn</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-table-form'
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
                        <Input
                          id='code'
                          className='w-full bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500'
                          {...field}
                          readOnly
                        />
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
                      <Label htmlFor='status'>Trạng thái</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={form.getValues('status')}
                        >
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
                      </div>

                      <FormMessage />
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                          value={form.getValues('location')}
                        >
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
          <Button type='submit' form='edit-table-form'>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
