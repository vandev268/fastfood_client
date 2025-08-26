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
import { UpdateTagBodySchema, type UpdateTagBodyType } from '@/schemaValidations/tag.schema'
import { handleError } from '@/lib/utils'
import { TagTypeValues } from '@/constants/tag'
import { toast } from 'sonner'
import TinyEditor from '@/components/TinyEditor'
import { useTagDetailQuery, useUpdateTagMutation } from '@/queries/useTag'
import { formatTagTypeText } from '@/lib/format'

export default function EditTag({
  id,
  setId,
  onSuccess
}: {
  id?: number | undefined
  setId: (value: number | undefined) => void
  onSuccess?: () => void
}) {
  const form = useForm<UpdateTagBodyType>({
    resolver: zodResolver(UpdateTagBodySchema),
    defaultValues: {
      name: '',
      type: 'Custom',
      description: ''
    }
  })

  const reset = () => {
    setId(undefined)
    form.reset()
  }

  const tagDetailQuery = useTagDetailQuery(id)
  useEffect(() => {
    if (tagDetailQuery.data) {
      const { name, type, description } = tagDetailQuery.data.data
      form.reset({
        name,
        type,
        description
      })
    }
  }, [tagDetailQuery.data, form])

  const updateTagMutation = useUpdateTagMutation()
  const onSubmit = async (body: UpdateTagBodyType) => {
    if (updateTagMutation.isPending) return
    try {
      const payload = {
        tagId: id as number,
        body
      }
      await updateTagMutation.mutateAsync(payload)
      reset()
      toast.success('Cập nhật thẻ thành công')
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
          <DialogTitle>Cập nhật thẻ</DialogTitle>
          <DialogDescription>Các trường sau đây là bắt buộc: Tiêu đề thẻ, loại thẻ</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-tag-form'
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
                      <Label htmlFor='name'>Tiêu đề thẻ</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='name' className='w-full' {...field} placeholder='Tiêu đề...' />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='type'>Loại thẻ</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={form.getValues('type')}
                        >
                          <FormControl id='type'>
                            <SelectTrigger className='w-[50%]'>
                              <SelectValue placeholder='Chọn loại thẻ' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TagTypeValues.map((type) => (
                              <SelectItem key={type} value={type}>
                                {formatTagTypeText(type)}
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
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='description'>Mô tả</Label>
                      <div className='col-span-3 w-full space-y-2'>
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
          <Button type='submit' form='edit-tag-form'>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
