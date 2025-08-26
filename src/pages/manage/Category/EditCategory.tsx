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
import { useEffect, useMemo, useRef, useState } from 'react'
import { handleError } from '@/lib/utils'
import { toast } from 'sonner'
import TinyEditor from '@/components/TinyEditor'
import { UpdateCategoryBodySchema, type UpdateCategoryBodyType } from '@/schemaValidations/category.schema'
import { useAllCategoriesQuery, useCategoryDetailQuery, useUpdateCategoryMutation } from '@/queries/useCategory'
import { useUploadImagesMutation } from '@/queries/useMedia'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Upload } from 'lucide-react'

export default function EditCategory({
  id,
  setId,
  onSuccess
}: {
  id?: number | undefined
  setId: (value: number | undefined) => void
  onSuccess?: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<UpdateCategoryBodyType>({
    resolver: zodResolver(UpdateCategoryBodySchema),
    defaultValues: {
      name: '',
      thumbnail: null,
      parentCategoryId: null,
      description: ''
    }
  })

  const image = form.watch('thumbnail')
  const name = form.watch('name')
  const previewAvatarFromFile = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file)
    }
    return image
  }, [file, image])

  const reset = () => {
    setId(undefined)
    setFile(null)
    form.reset()
  }

  const categoryDetailQuery = useCategoryDetailQuery(id)
  useEffect(() => {
    if (categoryDetailQuery.data) {
      const { name, parentCategoryId, description, thumbnail } = categoryDetailQuery.data.data
      form.reset({
        name,
        thumbnail: thumbnail || null,
        parentCategoryId: parentCategoryId ? parentCategoryId.toString() : 'null',
        description
      })
    }
  }, [categoryDetailQuery.data, form])

  const categoriesQuery = useAllCategoriesQuery()
  const categories = categoriesQuery.data?.data.data || []

  const uploadImageMutation = useUploadImagesMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const onSubmit = async (body: UpdateCategoryBodyType) => {
    if (updateCategoryMutation.isPending) return
    try {
      if (file) {
        const formData = new FormData()
        formData.append('files', file)
        const uploadResult = await uploadImageMutation.mutateAsync(formData)
        body = {
          ...body,
          thumbnail: uploadResult.data.data[0].url
        }
      }
      if (body.parentCategoryId === 'null') {
        body.parentCategoryId = null
      } else {
        body.parentCategoryId = Number(body.parentCategoryId)
      }
      const payload = {
        categoryId: id as number,
        body
      }
      await updateCategoryMutation.mutateAsync(payload)
      reset()
      toast.success('Cập nhật danh mục thành công')
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
          <DialogTitle>Cập nhật danh mục</DialogTitle>
          <DialogDescription>Các trường sau đây là bắt buộc: Tên danh mục</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-category-form'
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log(error)
            })}
          >
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='thumbnail'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='thumbnail'>Ảnh minh họa</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <div className='flex gap-2 items-start justify-start'>
                          <Avatar className='aspect-square w-[120px] h-[100px] rounded-md object-contain relative overflow-visible'>
                            <AvatarImage src={previewAvatarFromFile ?? undefined} className='rounded-md border' />
                            <AvatarFallback className='rounded-md'>{name || 'Thumbnail'}</AvatarFallback>
                            {(file || image) && (
                              <Badge
                                className='h-5 min-w-5 rounded-full px-1 font-mono tabular-nums absolute bg-white text-black -top-2 -right-2 z-50 border border-gray-300 cursor-pointer'
                                onClick={() => {
                                  setFile(null)
                                  field.onChange(null)
                                  if (imageInputRef.current) {
                                    imageInputRef.current.value = ''
                                  }
                                }}
                              >
                                x
                              </Badge>
                            )}
                          </Avatar>
                          <input
                            type='file'
                            accept='image/*'
                            ref={imageInputRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setFile(file)
                                field.onChange('http://localhost:3000/' + file.name)
                              }
                            }}
                            className='hidden'
                          />
                          <button
                            className='flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed'
                            type='button'
                            onClick={() => imageInputRef.current?.click()}
                          >
                            <Upload className='h-4 w-4 text-muted-foreground' />
                            <span className='sr-only'>Upload</span>
                          </button>
                        </div>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='name'>Tên danh mục</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='name' className='w-full' {...field} placeholder='Tên danh mục...' />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='parentCategoryId'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='type'>Thuộc danh mục</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Select
                          onValueChange={(e) => {
                            if (e === 'null') {
                              field.onChange(null)
                              return
                            }
                            field.onChange(Number(e))
                          }}
                          defaultValue={field.value?.toString()}
                          value={form.getValues('parentCategoryId')?.toString()}
                        >
                          <FormControl id='type'>
                            <SelectTrigger className='w-[50%]'>
                              <SelectValue placeholder='Chọn loại danh mục' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem key={0} value={'null'}>
                              Không có
                            </SelectItem>
                            {categories
                              .filter((category) => category.id !== id)
                              .map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
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
          <Button type='submit' form='edit-category-form'>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
