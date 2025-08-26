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
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { handleError } from '@/lib/utils'
import { useUploadImagesMutation } from '@/queries/useMedia'
import { useProductDetailQuery, useUpdateProductMutation } from '@/queries/useProduct'
import ImageUpload from '@/components/ImageUpload'
import { UpdateProductBodySchema, type UpdateProductBodyType } from '@/schemaValidations/product.schema'
import { useAllCategoriesQuery } from '@/queries/useCategory'
import { useAllTagsQuery } from '@/queries/useTag'
import { MultiAsyncSelect } from '@/components/MultiAsyncSelect'
import TinyEditor from '@/components/TinyEditor'
import { Separator } from '@/components/ui/separator'
import VariantsConfig from '@/components/VariantsConfig'
import VariantsList from '@/components/VariantsList'
import { ProductStatusValues, TypeProduct, TypeProductValues } from '@/constants/product'
import { formatProductStatusText, formatTypeProductText } from '@/lib/format'

export default function EditProduct({
  id,
  setId,
  onSuccess
}: {
  id: number | undefined
  setId: (value: number | undefined) => void
  onSuccess?: () => void
}) {
  const [files, setFiles] = useState<(File | string)[]>([])

  const form = useForm<UpdateProductBodyType>({
    resolver: zodResolver(UpdateProductBodySchema),
    defaultValues: {
      name: '',
      type: TypeProduct.Single,
      shortDescription: '',
      description: '',
      images: [],
      status: 'Pending',
      variantsConfig: [
        {
          type: 'default',
          options: ['default']
        }
      ],
      categories: [],
      tags: [],
      variants: []
    }
  })

  const type = form.watch('type')
  const variantsConfig = form.watch('variantsConfig')
  const categoriesWatch = form.watch('categories')
  const tagsWatch = form.watch('tags')

  const reset = () => {
    setId(undefined)
    form.reset()
    setFiles([])
  }

  const productDetailQuery = useProductDetailQuery(id)
  useEffect(() => {
    if (productDetailQuery.data) {
      const { name, description, images, status, tags, variantsConfig, categories, variants, type, shortDescription } =
        productDetailQuery.data.data
      form.reset({
        name,
        type,
        shortDescription,
        description,
        images: images || [],
        status,
        tags: tags.map((tag) => tag.id),
        variantsConfig: variantsConfig || [
          {
            type: 'default',
            options: ['default']
          }
        ],
        categories: categories.map((category) => category.id),
        variants: variants
      })
      setFiles(images || [])
    }
  }, [productDetailQuery.data, form, setFiles])

  const categoriesQuery = useAllCategoriesQuery()
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [filteredCategories, setFilteredCategories] = useState<{ id: number; name: string }[]>([])
  useEffect(() => {
    if (categoriesQuery.data) {
      const data = categoriesQuery.data.data.data
      setCategories(data.map((category) => ({ id: category.id, name: category.name })))
      setFilteredCategories(data.map((category) => ({ id: category.id, name: category.name })))
    }
  }, [categoriesQuery.data])

  const tagsQuery = useAllTagsQuery()
  const [tags, setTags] = useState<{ id: number; name: string }[]>([])
  const [filteredTags, setFilteredTags] = useState<{ id: number; name: string }[]>([])
  useEffect(() => {
    if (tagsQuery.data) {
      const data = tagsQuery.data.data.data
      setTags(data.map((tag) => ({ id: tag.id, name: tag.name })))
      setFilteredTags(data.map((tag) => ({ id: tag.id, name: tag.name })))
    }
  }, [tagsQuery.data])

  const uploadImagesMutation = useUploadImagesMutation()
  const updateProductMutation = useUpdateProductMutation()

  const onSubmit = async (body: UpdateProductBodyType) => {
    if (updateProductMutation.isPending) return
    try {
      let uploadedImageUrls: string[] = []
      const existingImages = files.filter((file): file is string => typeof file === 'string')
      const newFiles = files.filter((file) => file instanceof File)

      if (newFiles.length > 0) {
        const formData = new FormData()
        for (const file of newFiles) {
          formData.append('files', file)
        }
        const uploadResult = await uploadImagesMutation.mutateAsync(formData)
        uploadedImageUrls = uploadResult.data.data.map((url) => url.url)
      }

      const allImages = [...existingImages, ...uploadedImageUrls]

      const payload = {
        productId: id as number,
        body: {
          ...body,
          images: allImages
        }
      }

      await updateProductMutation.mutateAsync(payload)
      reset()
      toast.success(`Sửa ${type === TypeProduct.Single ? 'sản phẩm' : 'combo'} thành công`)
    } catch (error) {
      handleError(error, form.setError)
    }
  }

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) {
          reset()
        }
      }}
    >
      <DialogContent className='sm:max-w-[750px] max-h-screen overflow-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Cập nhật {type === TypeProduct.Single ? 'sản phẩm' : 'combo'}</DialogTitle>
          <DialogDescription>
            Lưu ý: Giá của {type === TypeProduct.Single ? 'sản phẩm' : 'combo'} sẽ được tính theo giá của biến thể có
            giá nhỏ nhất trong {type === TypeProduct.Single ? 'sản phẩm' : 'combo'} này.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8 z-50'
            id='edit-form'
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log(error)
            })}
          >
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='type'>Loại sản phẩm</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                          <FormControl id='type'>
                            <SelectTrigger className='w-[50%] bg-gray-100'>
                              <SelectValue placeholder='Chọn loại sản phẩm' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TypeProductValues.map((val) => (
                              <SelectItem key={val} value={val}>
                                {formatTypeProductText(val)}
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
                name='images'
                render={() => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='name'>Ảnh minh họa</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <ImageUpload
                          files={files}
                          setFiles={setFiles}
                          isMultiUpload={type === TypeProduct.Single || type === TypeProduct.CustomCombo}
                        />
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
                      <Label htmlFor='name'>Tên {type === TypeProduct.Single ? 'sản phẩm' : 'combo'}</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='name' className='w-full' placeholder='Tên sản phẩm...' {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl id='status'>
                            <SelectTrigger className='w-[50%]'>
                              <SelectValue placeholder='Chọn trạng thái' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ProductStatusValues.map((val) => (
                              <SelectItem key={val} value={val}>
                                {formatProductStatusText(val)}
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
              {/* {type !== TypeProduct.Single && ( */}
              <FormField
                control={form.control}
                name='shortDescription'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <div className='flex flex-col gap-1'>
                        <Label htmlFor='shortDescription'>Mô tả ngắn</Label>
                        <Label htmlFor='shortDescription'>Thông tin thành phần</Label>
                      </div>
                      <div className='col-span-3 w-full space-y-2'>
                        <TinyEditor
                          value={field.value}
                          onChange={field.onChange}
                          h={200}
                          lineHeight={1.2}
                          toolbar='undo redo | bullist numlist'
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Separator />
              <FormField
                control={form.control}
                name='categories'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='categories'>Danh sách danh mục</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <MultiAsyncSelect
                          id='categories'
                          placeholder='Chọn danh mục'
                          options={filteredCategories.map((category) => ({
                            label: category.name,
                            value: category.id.toString()
                          }))}
                          defaultValue={categoriesWatch ? categoriesWatch.map((id) => id.toString()) : []}
                          onValueChange={field.onChange}
                          className='w-full shadow-sm scroll-auto'
                          onSearch={(e) => {
                            const categoriesByName = categories.filter((category) =>
                              category.name.toLowerCase().includes(e.toLowerCase())
                            )
                            setFilteredCategories(categoriesByName)
                          }}
                          async
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='tags'>Danh sách thẻ</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <MultiAsyncSelect
                          id='tags'
                          placeholder='Chọn thẻ'
                          maxCount={4}
                          options={filteredTags.map((category) => ({
                            label: category.name,
                            value: category.id.toString()
                          }))}
                          defaultValue={tagsWatch ? tagsWatch.map((id) => id.toString()) : []}
                          onValueChange={field.onChange}
                          className='w-full shadow-sm scroll-auto'
                          onSearch={(e) => {
                            const tagsByName = tags.filter((tag) => tag.name.toLowerCase().includes(e.toLowerCase()))
                            setFilteredTags(tagsByName)
                          }}
                          async
                        />
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
                      <Label htmlFor='description'>Mô tả {type === TypeProduct.Single ? 'sản phẩm' : 'combo'}</Label>
                      <div className='col-span-3 w-full space-y-2 '>
                        <TinyEditor value={field.value} onChange={field.onChange} h={300} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Separator />
              {type !== TypeProduct.FixedCombo && (
                <FormField
                  control={form.control}
                  name='variantsConfig'
                  render={({ field }) => (
                    <FormItem>
                      <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                        <Label htmlFor='variantsConfig'>Tạo biến thể</Label>
                        <div className='col-span-3 w-full space-y-2 '>
                          <VariantsConfig variantsConfig={field.value} setVariantsConfig={field.onChange} />
                          <div>
                            <FormMessage />
                          </div>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <Separator />
              <FormField
                control={form.control}
                name='variants'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label className='text-sm font-medium'>Danh sách biến thể</Label>
                      <div className='col-span-3 w-full space-y-2 '>
                        {type === TypeProduct.Single || type === TypeProduct.CustomCombo ? (
                          <VariantsList
                            imagesExists={productDetailQuery.data?.data.images || []}
                            variantsInDB={productDetailQuery.data?.data.variants || []}
                            variantsConfig={variantsConfig}
                            variants={field.value}
                            setVariants={field.onChange}
                          />
                        ) : (
                          <VariantsList
                            variantsInDB={productDetailQuery.data?.data.variants || []}
                            variantsConfig={variantsConfig}
                            variants={field.value}
                            setVariants={field.onChange}
                          />
                        )}
                        <div>
                          <FormMessage />
                        </div>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            {/* <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='images'
                render={() => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='name'>Ảnh minh họa</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <ImageUpload files={files} setFiles={setFiles} />
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
                      <Label htmlFor='name'>Tên sản phẩm</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input id='name' className='w-full' {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl id='status'>
                            <SelectTrigger className='w-[50%]'>
                              <SelectValue placeholder='Chọn trạng thái' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ProductStatusValues.map((val) => (
                              <SelectItem key={val} value={val}>
                                {val}
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
                name='categories'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='categories'>Danh mục</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <MultiAsyncSelect
                          id='categories'
                          placeholder='Chọn danh mục'
                          options={filteredCategories.map((category) => ({
                            label: category.name,
                            value: category.id.toString()
                          }))}
                          defaultValue={categoriesWatch ? categoriesWatch.map((id) => id.toString()) : []}
                          onValueChange={field.onChange}
                          className='w-full shadow-sm scroll-auto'
                          onSearch={(e) => {
                            const categoriesByName = categories.filter((category) =>
                              category.name.toLowerCase().includes(e.toLowerCase())
                            )
                            setFilteredCategories(categoriesByName)
                          }}
                          async
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='tags'>Thẻ</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <MultiAsyncSelect
                          id='tags'
                          placeholder='Chọn thẻ'
                          maxCount={4}
                          options={filteredTags.map((category) => ({
                            label: category.name,
                            value: category.id.toString()
                          }))}
                          defaultValue={tagsWatch ? tagsWatch.map((id) => id.toString()) : []}
                          onValueChange={field.onChange}
                          className='w-full shadow-sm scroll-auto'
                          onSearch={(e) => {
                            const tagsByName = tags.filter((tag) => tag.name.toLowerCase().includes(e.toLowerCase()))
                            setFilteredTags(tagsByName)
                          }}
                          async
                        />
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
                      <Label htmlFor='description'>Mô tả sản phẩm</Label>
                      <div className='col-span-3 w-full space-y-2 '>
                        <TinyEditor value={field.value} onChange={field.onChange} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Separator />
              <FormField
                control={form.control}
                name='variantsConfig'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='variantsConfig'>Tạo biến thể</Label>
                      <div className='col-span-3 w-full space-y-2 '>
                        <VariantsConfig variantsConfig={field.value} setVariantsConfig={field.onChange} />
                        <div>
                          <FormMessage />
                        </div>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <Separator />
              <FormField
                control={form.control}
                name='variants'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label className='text-sm font-medium'>Danh sách biến thể</Label>
                      <div className='col-span-3 w-full space-y-2 '>
                        <VariantsList
                          imagesExists={productDetailQuery.data?.data.images || []}
                          variantsConfig={variantsConfig}
                          variantsInDB={productDetailQuery.data?.data.variants || []}
                          variants={field.value}
                          setVariants={field.onChange}
                        />
                        <div>
                          <FormMessage />
                        </div>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div> */}
          </form>
        </Form>
        <DialogFooter className='flex items-center gap-4'>
          <Button type='submit' form='edit-form'>
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
