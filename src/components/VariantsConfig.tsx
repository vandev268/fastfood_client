import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, GripVertical, RefreshCcw } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ProductVariantsType } from '@/schemaValidations/product.schema'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import classNames from 'classnames'

export default function VariantsConfig({
  variantsConfig,
  setVariantsConfig
}: {
  variantsConfig: ProductVariantsType
  setVariantsConfig: (configs: ProductVariantsType) => void
}) {
  const [open, setOpen] = useState(false)
  const inputRefs = useRef<Record<string, HTMLInputElement>>({})

  // Thêm thuộc tính mới
  const handleAddAttribute = () => {
    const newAttribute = {
      type: '',
      options: ['']
    }

    // Kiểm tra xem có variant default không
    const hasDefaultVariant = variantsConfig.some(
      (variant) => variant.type === 'default' || variant.type.toLowerCase() === 'default'
    )

    if (hasDefaultVariant) {
      // Nếu có variant default, loại bỏ nó và thêm thuộc tính mới
      const filteredConfig = variantsConfig.filter(
        (variant) => variant.type !== 'default' && variant.type.toLowerCase() !== 'default'
      )
      setVariantsConfig([...filteredConfig, newAttribute])
    } else {
      // Nếu không có variant default, chỉ thêm thuộc tính mới
      setVariantsConfig([...variantsConfig, newAttribute])
    }
  }

  // Xóa thuộc tính
  const handleRemoveAttribute = (index: number) => {
    const updatedConfig = [...variantsConfig]
    updatedConfig.splice(index, 1)
    setVariantsConfig(updatedConfig)
  }

  // Cập nhật tên thuộc tính
  const handleUpdateType = (index: number, value: string) => {
    const updatedConfig = [...variantsConfig]
    updatedConfig[index].type = value
    setVariantsConfig(updatedConfig)
  }

  // Thêm giá trị thuộc tính
  const handleAddOption = (attributeIndex: number) => {
    // Kiểm tra tất cả các options hiện tại có giá trị không trống
    const currentOptions = variantsConfig[attributeIndex].options
    const hasEmptyOption = currentOptions.some((option) => option.trim() === '')

    // Chỉ thêm option mới khi không có option nào trống
    if (!hasEmptyOption) {
      const updatedConfig = [...variantsConfig]
      updatedConfig[attributeIndex].options.push('')
      setVariantsConfig(updatedConfig)

      // Focus vào input mới tạo sau khi render
      setTimeout(() => {
        const newOptionIndex = updatedConfig[attributeIndex].options.length - 1
        const refKey = `input-${attributeIndex}-${newOptionIndex}`
        inputRefs.current[refKey]?.focus()
      }, 0)
    }
  }

  // Cập nhật giá trị thuộc tính
  const handleUpdateOption = (attributeIndex: number, optionIndex: number, value: string) => {
    const updatedConfig = [...variantsConfig]
    updatedConfig[attributeIndex].options[optionIndex] = value
    setVariantsConfig(updatedConfig)
  }

  // Xóa giá trị thuộc tính
  const handleRemoveOption = (attributeIndex: number, optionIndex: number) => {
    const updatedConfig = [...variantsConfig]
    updatedConfig[attributeIndex].options.splice(optionIndex, 1)
    setVariantsConfig(updatedConfig)
  }

  // Xử lý sự kiện nhấn phím
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, attributeIndex: number, optionIndex: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      // Kiểm tra giá trị hiện tại có trống không
      const currentValue = variantsConfig[attributeIndex].options[optionIndex].trim()
      if (currentValue === '') return

      // Kiểm tra nếu đây là giá trị cuối cùng trong danh sách
      const isLastOption = optionIndex === variantsConfig[attributeIndex].options.length - 1

      // Nếu là giá trị cuối và không trống, thêm option mới
      if (isLastOption) {
        handleAddOption(attributeIndex)
      } else {
        // Nếu không phải giá trị cuối, focus vào option tiếp theo
        const nextRefKey = `input-${attributeIndex}-${optionIndex + 1}`
        inputRefs.current[nextRefKey]?.focus()
      }
    }
  }

  // Hàm để reset về variant mặc định
  const handleResetToDefault = () => {
    // Tạo variant mặc định
    const defaultVariant = {
      type: 'default',
      options: ['default']
    }
    // Set lại variantsConfig chỉ với variant mặc định
    setVariantsConfig([defaultVariant])
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between mb-2'>
        <Label className='text-base font-medium'>Cấu hình biến thể</Label>
        <div className='flex items-center gap-2'>
          {/* {variantsConfig[0].type.toLowerCase() !== 'default' && ( */}
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
                <p>Default. Xóa các thuộc tính hiện có</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <div className='h-8'></div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>
                Reset về biến thể mặc định
                <br />
                Có thể làm mất các biến thể cũ
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className='flex justify-end'>
                <DropdownMenuItem>
                  <Button variant='outline'>No</Button>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Button onClick={handleResetToDefault}>Yes</Button>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='flex items-center gap-2 cursor-pointer'
            onClick={handleAddAttribute}
          >
            <Plus className='w-4 h-4' />
            Thêm thuộc tính
          </Button>
        </div>
      </div>

      <div className='border rounded-md'>
        <ScrollArea
          className={classNames('pr-4', {
            'h-[500px]': variantsConfig.length > 2
          })}
        >
          <div className='space-y-4 p-4'>
            {variantsConfig.map((attribute, attributeIndex) => (
              <Card key={attributeIndex} className='border border-gray-200'>
                <CardContent className='px-4'>
                  <div className='space-y-3'>
                    {/* Tên thuộc tính */}
                    <div className='flex items-center gap-2'>
                      <Input
                        placeholder='Tên thuộc tính (VD: Màu sắc, Kích thước...)'
                        className={`flex-1 ${attribute.type.toLowerCase() === 'default' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        value={attribute.type}
                        onChange={(e) => handleUpdateType(attributeIndex, e.target.value)}
                        readOnly={attribute.type.toLowerCase() === 'default'}
                      />
                      {variantsConfig.length > 1 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => handleRemoveAttribute(attributeIndex)}
                          className='text-red-500 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      )}
                    </div>

                    {/* Giá trị thuộc tính */}
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-xs text-gray-600'>Giá trị thuộc tính</Label>
                        {/* Chỉ hiển thị nút "Thêm giá trị" khi không phải là variant default */}
                        {attribute.type.toLowerCase() !== 'default' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handleAddOption(attributeIndex)}
                                  className='text-xs cursor-pointer'
                                  disabled={attribute.options.some((option) => option.trim() === '')}
                                >
                                  <Plus className='w-3 h-3 mr-1' />
                                  Thêm giá trị
                                </Button>
                              </TooltipTrigger>
                              {attribute.options.some((option) => option.trim() === '') && (
                                <TooltipContent>
                                  <p>Vui lòng điền đầy đủ các giá trị hiện có trước khi thêm mới</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {attribute.options.map((option, optionIndex) => (
                        <div key={optionIndex} className='flex items-center gap-2'>
                          <GripVertical className='w-3 h-3 text-gray-400' />
                          <Input
                            placeholder='Nhập giá trị...'
                            className={`flex-1 h-8 text-sm ${attribute.type.toLowerCase() === 'default' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={option}
                            onChange={(e) => handleUpdateOption(attributeIndex, optionIndex, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, attributeIndex, optionIndex)}
                            readOnly={attribute.type.toLowerCase() === 'default'}
                            ref={(el) => {
                              if (el) {
                                const refKey = `input-${attributeIndex}-${optionIndex}`
                                inputRefs.current[refKey] = el
                              }
                            }}
                          />
                          {/* Hiển thị nút xóa giá trị khi không phải variant default và có nhiều hơn 1 giá trị */}
                          {attribute.type.toLowerCase() !== 'default' && attribute.options.length > 0 && (
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRemoveOption(attributeIndex, optionIndex)}
                              className='h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                            >
                              <Trash2 className='w-3 h-3' />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
