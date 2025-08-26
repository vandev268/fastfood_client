import { Link } from 'react-router'
import Config from '@/constants/config'
import { generateNameId, getHtmlPlainTextTitle, handleError } from '@/lib/utils'
import type { ProductRecommendationType } from '@/schemaValidations/recommendation.schema'
import { Button } from './ui/button'
import { Eye, Plus, ShoppingBag, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEffect, useMemo, useState } from 'react'
import type { ProductVariantType, VariantType } from '@/schemaValidations/product.schema'
import { ProductStatus } from '@/constants/product'
import {
  formatCurrency,
  formatMostViewedProductsReason,
  formatTypeProductColor,
  formatTypeProductText
} from '@/lib/format'
import classNames from 'classnames'
import QuantityController from './QuantityController'
import { useProductVariantsQuery } from '@/queries/useProduct'
import { ScrollArea } from './ui/scroll-area'
import { useAddToCartMutation } from '@/queries/useCart'
import { toast } from 'sonner'
import { useAutoTrackBehaviorMutation } from '@/queries/useRecommendation'
import { RecommendationType } from '@/constants/recommendation'

export default function ViewProduct({
  recommendationType,
  products
}: {
  recommendationType: RecommendationType
  products: ProductRecommendationType[]
}) {
  const availableProducts = products.filter((product) => product.status === ProductStatus.Available)

  const [buyCount, setBuyCount] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<ProductRecommendationType | null>(null)
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({})
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null)
  const { trackViewBehavior, trackAddToCartBehavior } = useAutoTrackBehaviorMutation()

  const productVariantsQuery = useProductVariantsQuery(selectedProduct?.id)
  const productVariants = useMemo(() => {
    if (productVariantsQuery.isPending || !selectedProduct || !productVariantsQuery.data) return []
    return productVariantsQuery.data.data.data || []
  }, [productVariantsQuery.isPending, productVariantsQuery.data, selectedProduct])

  useEffect(() => {
    if (selectedProduct?.variantsConfig && selectedProduct.variantsConfig.length > 0) {
      const initialOptions: Record<string, string> = {}
      selectedProduct.variantsConfig.forEach((variant: ProductVariantType) => {
        initialOptions[variant.type] = ''
      })
      setSelectedVariantOptions(initialOptions)
    }
  }, [selectedProduct])

  useEffect(() => {
    if (!selectedProduct || selectedVariant) return
    const optionKeys = Object.keys(selectedVariantOptions)
    const allOptionsSelected = optionKeys.every((key) => selectedVariantOptions[key] !== '')

    if (!allOptionsSelected) {
      setSelectedVariant(null)
      return
    }

    const selectedValue = Object.values(selectedVariantOptions).join(' / ')
    const variant = productVariants.find((v: VariantType) => v.value === selectedValue)

    if (variant) {
      setSelectedVariant(variant)
      setBuyCount(1)
    }
  }, [selectedVariantOptions, productVariants, selectedProduct, selectedVariant])

  useEffect(() => {
    if (selectedProduct && selectedProduct.variantsConfig[0].type === 'default') {
      const defaultVariant = productVariants.find((v: VariantType) => v.value === 'default')
      if (defaultVariant) {
        setSelectedVariant(defaultVariant)
        setBuyCount(1)
      }
    }
  }, [selectedProduct, productVariants])

  const handleVariantOptionSelect = (type: string, option: string) => {
    setSelectedVariantOptions((prev) => ({ ...prev, [type]: prev[type] === option ? '' : option }))
  }

  const handleBuyCount = (value: number) => {
    setBuyCount(value)
  }

  const handleCloseVariantSelector = () => {
    setSelectedProduct(null)
    setSelectedVariantOptions({})
    setSelectedVariant(null)
  }

  const addToCartMutation = useAddToCartMutation()
  const handleAddToCart = async () => {
    if (!selectedVariant || addToCartMutation.isPending || buyCount === 0) return
    try {
      await addToCartMutation.mutateAsync({
        variantId: selectedVariant.id,
        quantity: buyCount
      })
      if (selectedProduct) {
        trackAddToCartBehavior(selectedProduct.id, buyCount)
      }
      toast.success('Đã thêm sản phẩm vào giỏ hàng')
      handleCloseVariantSelector()
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-6'>
        {availableProducts.length > 0 ? (
          products.map((product) => {
            return (
              <div
                key={product.id}
                className='group cursor-pointer transition-all duration-300 hover:shadow-lg bg-white rounded-xl border border-dashed border-gray-100 hover:border-gray-300 overflow-hidden h-full flex flex-col'
              >
                <div className='h-full flex flex-col'>
                  <div className='aspect-square overflow-hidden w-full relative'>
                    <img
                      src={product.images[0] || Config.ImageBaseUrl}
                      alt={product.name}
                      className='w-full object-contain h-full group-hover:scale-110 transition-transform duration-500'
                    />
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-white/40 transition-colors duration-300' />

                    {product.rating.avg && product.rating.quantity > 0 && (
                      <div className='absolute top-2 right-2 flex gap-1 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-400 dark:bg-yellow-700 dark:text-yellow-300'>
                        <Star className='w-4 h-4' />
                        {product.rating.avg}
                      </div>
                    )}

                    {recommendationType === RecommendationType.MostViewedProducts && (
                      <span className='absolute top-2 left-2 flex gap-1 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300'>
                        <Eye className='w-4 h-4' />
                        {formatMostViewedProductsReason(product.reason).view}
                      </span>
                    )}

                    <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                      <Button
                        onClick={() => {
                          setSelectedProduct(product)
                          trackViewBehavior(product.id)
                        }}
                        className='bg-primary rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 transform scale-90 group-hover:scale-100 shadow-lg cursor-pointer'
                      >
                        <ShoppingBag className='w-24 h-24' />
                      </Button>
                    </div>
                  </div>
                  <Link
                    to={`/products/${generateNameId({ name: product.name, id: product.id })}`}
                    className='p-3 flex-1 flex flex-col'
                    onClick={() => trackViewBehavior(product.id)}
                  >
                    <div className='flex-1 flex flex-col justify-center text-center mb-3'>
                      <h2 className='text-base font-semibold line-clamp-2 text-gray-900 capitalize group-hover:text-primary transition-colors mb-2'>
                        {product.name}
                      </h2>
                      {product.shortDescription && (
                        <div
                          dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                          className='overflow-hidden text-ellipsis whitespace-nowrap [&>*]:inline [&>*]:whitespace-nowrap [&>*]:overflow-hidden [&>*]:text-ellipsis text-sm text-gray-600 truncate'
                          title={getHtmlPlainTextTitle(product.shortDescription)}
                        />
                      )}
                    </div>
                    <div className='flex justify-center items-center pt-3 border-t border-gray-200 border-dashed'>
                      <span className='text-red-600 font-bold text-lg'>{formatCurrency(product.basePrice)}</span>
                    </div>
                  </Link>
                </div>
              </div>
            )
          })
        ) : (
          <div className='col-span-full text-center text-gray-500'>
            <p>Sản phẩm không có sẵn</p>
          </div>
        )}
      </div>
      <Dialog open={Boolean(selectedProduct)} onOpenChange={handleCloseVariantSelector}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>Chọn Thuộc Tính Sản Phẩm</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <ScrollArea className='max-h-[80vh]'>
              <div className='p-4 space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3 p-3 border border-dashed border-gray-300 rounded-lg'>
                    <img
                      src={selectedProduct.images?.[0] || '/placeholder.svg'}
                      alt={selectedProduct.name}
                      className='w-16 h-16 object-cover rounded'
                    />
                    <div className='flex-1'>
                      <h3 className='font-semibold'>{selectedProduct.name}</h3>
                      <span className={formatTypeProductColor({ type: selectedProduct.type })}>
                        {formatTypeProductText(selectedProduct.type)}
                      </span>
                    </div>
                  </div>

                  {selectedProduct.variantsConfig
                    .filter((config: ProductVariantType) => config.type !== 'default')
                    .map((config: ProductVariantType) => (
                      <div key={config.type} className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>{config.type}:</label>
                        <div className='flex flex-wrap gap-2'>
                          {config.options.map((option: string) => (
                            <Button
                              key={`${config.type}-${option}`}
                              variant='outline'
                              size='sm'
                              className={classNames('text-xs cursor-pointer', {
                                'bg-primary border-primary hover:bg-primary text-white hover:text-white':
                                  selectedVariantOptions[config.type] === option
                              })}
                              onClick={() => handleVariantOptionSelect(config.type, option)}
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
                    <Button variant='outline' className='flex-1 cursor-pointer' onClick={handleCloseVariantSelector}>
                      Hủy
                    </Button>
                    <Button
                      disabled={!selectedVariant || selectedVariant.stock <= 0}
                      className='flex-1 cursor-pointer'
                      onClick={handleAddToCart}
                    >
                      <Plus className='w-4 h-4 mr-2' />
                      Thêm vào đơn
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
