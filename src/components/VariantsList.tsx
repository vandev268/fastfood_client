import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Package, RefreshCcw, SquareMousePointer, Trash2, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useState } from 'react'
import type { ProductVariantsType, UpsertVariantBodyType, VariantType } from '@/schemaValidations/product.schema'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { Dialog, DialogContent } from './ui/dialog'
import { DialogTitle } from '@radix-ui/react-dialog'
import classNames from 'classnames'

export function generateVariants(variants: ProductVariantsType) {
  // Hàm hỗ trợ để tạo tất cả tổ hợp
  function getCombinations(arrays: string[][]): string[] {
    return arrays.reduce((acc, curr) => acc.flatMap((x) => curr.map((y) => `${x}${x ? ' / ' : ''}${y}`)), [''])
  }

  // Lấy mảng các options từ variants
  const options = variants.map((variant) => variant.options)

  // Tạo tất cả tổ hợp
  const combinations = getCombinations(options)

  // Chuyển tổ hợp thành SKU objects
  return combinations.map((value) => ({
    value,
    price: 0,
    stock: 0,
    thumbnail: null
  }))
}

export default function VariantsList({
  imagesExists,
  variantsConfig,
  variantsInDB,
  variants,
  setVariants
}: {
  imagesExists?: string[]
  variantsConfig: ProductVariantsType
  variantsInDB?: VariantType[]
  variants: UpsertVariantBodyType[]
  setVariants: (variants: UpsertVariantBodyType[]) => void
}) {
  const [open, setOpen] = useState<boolean>(false)
  const [isOpenPreview, setIsOpenPreview] = useState(false)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null)

  // Sử dụng useEffect để tạo variants từ variantsConfig khi component mount hoặc variantsConfig thay đổi
  useEffect(() => {
    if (variantsConfig.length > 0) {
      if (variantsConfig[0].type === '') {
        // Nếu variantsConfig có phần tử đầu tiên không có type, thì tạo một biến thể mặc định
        setVariants([
          {
            value: 'default',
            price: 0,
            stock: 0,
            thumbnail: null
          }
        ])

        return
      }
      const generatedVariants = generateVariants(variantsConfig)
      if (variantsInDB && variantsInDB.length > 0) {
        const allVariants = [
          ...variantsInDB,
          ...generatedVariants.filter((variant) => !variantsInDB.some((v) => v.value === variant.value))
        ]
        setVariants(allVariants)
        return
      }

      setVariants(generatedVariants)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantsConfig, setVariants])
  const parseAttributes = (value: string) => {
    const attributes: Record<string, string> = {}
    const parts = value.split(' / ')

    variantsConfig.forEach((config, index) => {
      if (parts[index]) {
        attributes[config.type] = parts[index]
      }
    })

    return attributes
  }

  const handleResetVariants = () => {
    if (variantsConfig.length === 0) {
      setVariants([])
      return
    }
    const generatedVariants = generateVariants(variantsConfig)
    setVariants(generatedVariants)
  }

  const ConfirmPropdown = () => {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <div className='h-8'></div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>
            Tạo lại danh sách biến thể theo bộ cấu hình
            <br />
            Có thể làm mất các biến thể cũ
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className='flex justify-end'>
            <DropdownMenuItem>
              <Button variant='outline'>No</Button>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Button onClick={handleResetVariants}>Yes</Button>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Nếu không có biến thể
  if (variants.length === 0) {
    return (
      <div className='text-center py-12'>
        <Package className='w-12 h-12 text-gray-300 mx-auto mb-4' />
        <p className='text-gray-500 text-sm'>Chưa có biến thể nào được tạo</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-end mb-2'>
        <div className='flex items-center gap-2'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-2 cursor-pointer'
                  onClick={() => {
                    setOpen(!open)
                  }}
                >
                  <RefreshCcw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tạo lại danh sách Variants theo bộ cấu hình</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ConfirmPropdown />

          <Badge variant='outline' className='flex items-center cursor-default gap-2 p-2 font-medium'>
            <Package className='w-8 h-8' />
            <span className='font-medium text-gray-900'>{variants.length} biến thể</span>
          </Badge>
        </div>
      </div>

      <ScrollArea
        className={classNames('pr-4', {
          'h-[500px]': variants.length > 4
        })}
      >
        <div className='space-y-4'>
          {variants.map((variant, index) => {
            const attributes = parseAttributes(variant.value)
            return (
              <Card key={variant.value + index} className='border border-gray-200'>
                <CardContent className='px-4'>
                  <div className='space-y-3 flex items-center justify-between'>
                    <div className='col-span-2 max-w-[60%] flex items-center gap-4'>
                      <div className='relative group'>
                        {imagesExists && (
                          <button
                            className='shrink-0 flex aspect-square w-[80px] items-center justify-center rounded-md border border-dashed hover:bg-gray-50 transition-colors'
                            type='button'
                            onClick={() => {
                              if (imagesExists && imagesExists.length > 0) {
                                setSelectedVariantIndex(index)
                                setIsOpenPreview(true)
                              }
                            }}
                          >
                            {variant.thumbnail ? (
                              <img
                                src={variant.thumbnail}
                                alt={variant.value}
                                className='w-full h-full object-cover rounded-md'
                              />
                            ) : (
                              <Upload className='h-4 w-4 text-muted-foreground' />
                            )}
                          </button>
                        )}

                        {/* Overlay với 2 nút khi hover */}
                        {variant.thumbnail && (
                          <div className='absolute inset-0 bg-black/30 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation()
                                if (imagesExists && imagesExists.length > 0) {
                                  setSelectedVariantIndex(index)
                                  setIsOpenPreview(true)
                                }
                              }}
                            >
                              <SquareMousePointer className='w-5 h-5 text-white cursor-pointer' />
                            </button>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation()
                                const updatedVariants = variants.map((v) =>
                                  v.value === variant.value ? { ...v, thumbnail: null } : v
                                )
                                setVariants(updatedVariants)
                              }}
                            >
                              <Trash2 className='w-5 h-5 text-white cursor-pointer' />
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className=' flex gap-1 max-w-[200px]'>
                          <span>{index + 1}:</span>
                          <span className='truncate' title={variant.value}>
                            {variant.value}
                          </span>
                        </p>
                        <div className='flex flex-wrap gap-1 mt-1'>
                          {Object.entries(attributes).map(([key, value]) => (
                            <Badge key={key} variant='outline' className='text-xs'>
                              <span className='max-w-40 truncate' title={`${key}: ${value}`}>
                                {value === 'default' ? 'default' : key}: {value}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <div className='flex flex-col gap-3'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-gray-500 w-6'>Giá</span>
                          <Input
                            type='text'
                            value={variant.price}
                            onChange={(e) => {
                              if (isNaN(Number(e.target.value))) {
                                return
                              }
                              const updatedVariants = variants.map((v) =>
                                v.value === variant.value ? { ...v, price: Number(e.target.value) } : v
                              )
                              setVariants(updatedVariants)
                            }}
                            className='w-24 h-8 text-sm'
                            placeholder='Giá'
                          />
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-gray-500 w-6'>Kho</span>
                          <Input
                            type='text'
                            value={variant.stock}
                            onChange={(e) => {
                              if (isNaN(Number(e.target.value))) {
                                return
                              }
                              const updatedVariants = variants.map((v) =>
                                v.value === variant.value ? { ...v, stock: Number(e.target.value) } : v
                              )
                              setVariants(updatedVariants)
                            }}
                            className='w-24 h-8 text-sm'
                            placeholder='Kho'
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          const newVariants = variants.filter((v) => v.value !== variant.value)
                          setVariants(newVariants)
                        }}
                        variant='ghost'
                        className='text-red-500 hover:text-red-700 hover:bg-red-50'
                        type='button'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>

      <Dialog open={isOpenPreview} onOpenChange={setIsOpenPreview}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto' aria-describedby={undefined}>
          <div className='p-2'>
            <DialogTitle className='text-lg font-semibold mb-1'>Chọn ảnh cho biến thể</DialogTitle>
            <p className='mb-4 text-sm italic'>Note: Chỉ những ảnh đã Thêm/Sửa thành công mới được chọn</p>
            {imagesExists && imagesExists.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                {imagesExists.map((imageUrl, imageIndex) => (
                  <div
                    key={imageIndex}
                    className='relative group cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-all'
                    onClick={() => {
                      if (selectedVariantIndex !== null) {
                        const updatedVariants = variants.map((variant, index) =>
                          index === selectedVariantIndex ? { ...variant, thumbnail: imageUrl } : variant
                        )
                        setVariants(updatedVariants)
                        setIsOpenPreview(false)
                        setSelectedVariantIndex(null)
                      }
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={`Image ${imageIndex + 1}`}
                      className='w-full object-contain group-hover:scale-105 transition-transform'
                    />
                    <div className='absolute inset-0 hover:bg-black/30 flex items-center justify-center'>
                      <Check className='w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>Không có ảnh nào để chọn</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
