import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import QuantityController from '@/components/QuantityController'
import { useAutoTrackBehaviorMutation } from '@/queries/useRecommendation'
import type { ProductDetailType } from '@/schemaValidations/product.schema'

interface ProductListProps {
  availableProducts: any[]
  leftPanelWidth: number
  onAddToOrder: (product: any, variant: any, quantity?: number) => void
}

export default function ProductList({ availableProducts, leftPanelWidth, onAddToOrder }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')

  const [buyCount, setBuyCount] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({})
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null)
  const [showVariantSelector, setShowVariantSelector] = useState(false)

  const handleBuyCount = (value: number) => {
    setBuyCount(value)
  }

  const filteredProducts = useMemo(() => {
    return availableProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategoryId === 'all' || product.categories?.some((category: any) => category.id === selectedCategoryId)

      return matchesSearch && matchesCategory
    })
  }, [availableProducts, searchQuery, selectedCategoryId])

  useEffect(() => {
    if (selectedProduct?.variantsConfig && selectedProduct.variantsConfig.length > 0) {
      const initialOptions: Record<string, string> = {}
      selectedProduct.variantsConfig.forEach((variant: any) => {
        initialOptions[variant.type] = ''
      })
      setSelectedVariantOptions(initialOptions)
    }
  }, [selectedProduct])

  useEffect(() => {
    if (!selectedProduct) return
    const optionKeys = Object.keys(selectedVariantOptions)
    const allOptionsSelected = optionKeys.every((key) => selectedVariantOptions[key] !== '')

    if (!allOptionsSelected) {
      setSelectedVariant(null)
      return
    }

    const selectedValue = Object.values(selectedVariantOptions).join(' / ')
    const variant = selectedProduct.variants.find((v: any) => v.value === selectedValue)

    if (variant) {
      setSelectedVariant(variant)
    }
  }, [selectedVariantOptions, selectedProduct])

  useEffect(() => {
    if (selectedProduct && selectedProduct.variantsConfig[0]?.type === 'default') {
      const defaultVariant = selectedProduct.variants.find((v: any) => v.value === 'default')
      if (defaultVariant) {
        setSelectedVariant(defaultVariant)
      }
    }
  }, [selectedProduct])

  const { trackViewBehavior } = useAutoTrackBehaviorMutation()

  const handleAddProduct = (product: ProductDetailType) => {
    trackViewBehavior(product.id)
    if (product.variantsConfig.length === 1 && product.variantsConfig[0].type === 'default') {
      const defaultVariant = product.variants.find((v: any) => v.value === 'default')
      if (defaultVariant && defaultVariant.stock > 0) {
        onAddToOrder(product, defaultVariant)
      }
      return
    }

    setSelectedProduct(product)
    setShowVariantSelector(true)
  }

  const handleSelectVariantOption = (type: string, option: string) => {
    setSelectedVariantOptions((prev) => ({
      ...prev,
      [type]: prev[type] === option ? '' : option
    }))
  }

  const handleAddSelectedVariant = () => {
    if (selectedProduct && selectedVariant && selectedVariant.stock > 0) {
      onAddToOrder(selectedProduct, selectedVariant, buyCount)
      handleCloseVariantSelector()
    }
  }

  const handleCloseVariantSelector = () => {
    setShowVariantSelector(false)
    setBuyCount(1)
    setSelectedProduct(null)
    setSelectedVariant(null)
    setSelectedVariantOptions({})
  }

  return (
    <div className='flex flex-col h-[calc(100vh-120px)]'>
      <ScrollArea className='flex-1 overflow-hidden'>
        <div className='pr-2'>
          <div
            className={`grid gap-3 ${
              leftPanelWidth > 55
                ? 'grid-cols-6'
                : leftPanelWidth > 45
                  ? 'grid-cols-5'
                  : leftPanelWidth > 30
                    ? 'grid-cols-3'
                    : 'grid-cols-1'
            }`}
          >
            {filteredProducts.map((product) => {
              const hasStock = product.variants.some((variant: any) => variant.stock > 0)
              const mainImage = product.images?.[0] || '/placeholder.svg'

              return (
                <Card
                  key={product.id}
                  className={`p-0 transition-all hover:shadow-md relative ${!hasStock ? 'opacity-50' : ''}`}
                >
                  <CardContent className='p-3 h-full flex flex-col'>
                    <div className='aspect-square mb-3 rounded-lg overflow-hidden relative'>
                      <img src={mainImage} alt={product.name} className='w-full h-full object-cover' />
                      {!hasStock && (
                        <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                          <span className='text-white text-sm font-medium'>Hết hàng</span>
                        </div>
                      )}
                    </div>
                    <div className='flex flex-col flex-1'>
                      <h3
                        className={`text-center font-semibold mb-2 flex-1 ${leftPanelWidth > 40 ? 'text-sm' : 'text-xs'}`}
                      >
                        {product.name}
                      </h3>
                      <div className='flex flex-col items-center mt-auto'>
                        <div className='flex flex-col mb-2'>
                          <span className='font-bold text-orange-600'>
                            {product.basePrice.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        {hasStock && (
                          <Button
                            size='sm'
                            className='h-8 px-3 cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddProduct(product)
                            }}
                          >
                            <Plus className='w-4 h-4' />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </ScrollArea>
      <Dialog open={showVariantSelector} onOpenChange={() => handleCloseVariantSelector()}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>Chọn Thuộc Tính Sản Phẩm</DialogTitle>
          </DialogHeader>
          <ScrollArea className='max-h-[calc(100vh-100px)]'>
            {selectedProduct && (
              <div className='space-y-4 px-4'>
                <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
                  <img
                    src={selectedProduct.images?.[0] || '/placeholder.svg'}
                    alt={selectedProduct.name}
                    className='w-16 h-16 object-cover rounded'
                  />
                  <div className='flex-1'>
                    <h3 className='font-semibold'>{selectedProduct.name}</h3>
                    <div className='flex flex-wrap gap-1 mt-1'>
                      {selectedProduct.categories?.map((category: any) => (
                        <Badge key={category.id} variant='secondary' className='text-xs'>
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedProduct.variantsConfig
                  .filter((config: any) => config.type !== 'default')
                  .map((variantConfig: any) => (
                    <div key={variantConfig.type} className='space-y-2'>
                      <label className='text-sm font-medium text-gray-700'>{variantConfig.type}:</label>
                      <div className='flex flex-wrap gap-2'>
                        {variantConfig.options.map((option: any) => (
                          <Button
                            key={`${variantConfig.type}-${option}`}
                            variant={selectedVariantOptions[variantConfig.type] === option ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => handleSelectVariantOption(variantConfig.type, option)}
                            className='text-xs'
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}

                <div className='mt-8 flex items-center'>
                  <div className='capitalize text-gray-500'>Số lượng</div>
                  <div className={!selectedVariant || selectedVariant.stock <= 0 ? 'opacity-50' : ''}>
                    <QuantityController
                      onDecrease={handleBuyCount}
                      onIncrease={handleBuyCount}
                      onType={handleBuyCount}
                      value={selectedVariant ? (selectedVariant.stock === 0 ? 0 : buyCount) : 0}
                      max={selectedVariant ? selectedVariant.stock : 0}
                      disabled={!selectedVariant || selectedVariant.stock <= 0}
                    />
                  </div>
                  <span className='ml-6 text-sm'>
                    {selectedVariant ? `${selectedVariant.stock} sản phẩm có sẵn` : <span>Chưa có sản phẩm nào</span>}
                  </span>
                </div>

                <div className='flex gap-3'>
                  <Button variant='outline' onClick={handleCloseVariantSelector} className='flex-1'>
                    Hủy
                  </Button>
                  <Button
                    onClick={handleAddSelectedVariant}
                    disabled={!selectedVariant || selectedVariant.stock <= 0}
                    className='flex-1'
                  >
                    <Plus className='w-4 h-4 mr-2' />
                    Thêm vào đơn
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
