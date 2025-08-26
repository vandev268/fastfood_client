import QuantityController from '@/components/QuantityController'
import { getHtmlPlainTextTitle, getIdByNameId, handleError } from '@/lib/utils'
import type { ProductType, VariantType } from '@/schemaValidations/product.schema'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star } from 'lucide-react'
import Config from '@/constants/config'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAddToCartMutation } from '@/queries/useCart'
import { toast } from 'sonner'
import { productSocket, reviewSocket } from '@/lib/sockets'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TypeProduct } from '@/constants/product'
import classNames from 'classnames'
import type { MessageResType } from '@/schemaValidations/response.schema'
import { useProductDetailQuery } from '@/queries/useProduct'
import { useAppContext } from '@/components/AppProvider'
import DOMPurify from 'dompurify'
import ViewProduct from '@/components/ViewProduct'
import { useAutoTrackBehaviorMutation, useSimilarProductsQuery } from '@/queries/useRecommendation'
import { RecommendationType } from '@/constants/recommendation'
import { formatCurrency, formatDateTimeToLocaleString, formatTagTypeColor } from '@/lib/format'

export default function ProductDetail() {
  const { isAuth } = useAppContext()

  const navigate = useNavigate()
  const params = useParams()
  const productId = getIdByNameId(params.productName as string)

  const { trackAddToCartBehavior } = useAutoTrackBehaviorMutation()

  const { data, refetch } = useProductDetailQuery(Number(productId))
  const product = useMemo(() => {
    if (!data) return null
    return data.data
  }, [data])

  useEffect(() => {
    if (isAuth) {
      productSocket.connect()
      reviewSocket.connect()
    } else {
      productSocket.disconnect()
      reviewSocket.disconnect()
      return
    }

    productSocket.on('updated-product', (data: MessageResType) => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    reviewSocket.on('recieved-review', (data: MessageResType) => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    return () => {
      productSocket.off('updated-product')
      reviewSocket.off('recieved-review')
      productSocket.disconnect()
      reviewSocket.disconnect()
    }
  }, [isAuth, refetch])

  const [buyCount, setBuyCount] = useState(0)
  const [currentIndexImages, setCurrentIndexImages] = useState([0, 5])
  const [activeImage, setActiveImage] = useState('')
  const [isOpenPreview, setIsOpenPreview] = useState(false)
  const [isOpenError, setIsOpenError] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({})
  const [errorVariation, setErrorVariation] = useState('')
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null)

  useEffect(() => {
    if (product && product.variantsConfig[0]?.type === 'default') {
      const defaultVariant = product.variants.find((v) => v.value === 'default')
      if (defaultVariant) {
        setSelectedVariant(defaultVariant)
        setSelectedVariantOptions({ default: 'default' })
        setBuyCount(1)
      }
    }
  }, [product])

  const currentImages = useMemo(() => {
    if (!product || !product.images || product.images.length === 0) return []

    const images =
      selectedVariant && selectedVariant.thumbnail
        ? (() => {
            const thumbnailIndex = product.images.indexOf(selectedVariant.thumbnail)
            if (thumbnailIndex > -1) {
              const reorderedImages = [...product.images]
              reorderedImages.splice(thumbnailIndex, 1)
              reorderedImages.unshift(selectedVariant.thumbnail)
              return reorderedImages
            }
            return product.images
          })()
        : product.images

    return images.slice(...currentIndexImages)
  }, [product, currentIndexImages, selectedVariant])
  useEffect(() => {
    if (product && product.images.length > 0) {
      setActiveImage(product.images[0])
      setCurrentIndexImages([0, 5])
    }
  }, [product])

  useEffect(() => {
    if (selectedVariant && selectedVariant.thumbnail) {
      setActiveImage(selectedVariant.thumbnail)
      setCurrentIndexImages([0, 5])
    } else {
      if (product && product.images.length > 0) {
        setActiveImage(product.images[0])
      }
    }
  }, [selectedVariant, product])

  useEffect(() => {
    if (product?.variantsConfig && product.variantsConfig.length > 0) {
      const initialOptions: Record<string, string> = {}
      product.variantsConfig.forEach((variant) => {
        if (variant.options.length > 0) {
          initialOptions[variant.type] = variant.type === 'default' ? 'default' : ''
        }
      })
      setSelectedVariantOptions(initialOptions)
    }
  }, [product])

  useEffect(() => {
    if (!product) return
    const optionKeys = Object.keys(selectedVariantOptions)
    const allOptionsSelected = optionKeys.every((key) => selectedVariantOptions[key] !== '')

    if (!allOptionsSelected) {
      setSelectedVariant(null)
      setBuyCount(0)
      return
    }

    const selectedValue = Object.values(selectedVariantOptions).join(' / ')
    const variant = product.variants.find((v) => v.value === selectedValue)

    if (variant) {
      setSelectedVariant(variant)
      setBuyCount(1)
    }
  }, [selectedVariantOptions, product])

  const next = () => {
    if (currentIndexImages[1] < (product as ProductType).images.length) {
      setCurrentIndexImages((prev) => [prev[0] + 1, prev[1] + 1])
    }
  }
  const prev = () => {
    if (currentIndexImages[0] > 0) {
      setCurrentIndexImages((prev) => [prev[0] - 1, prev[1] - 1])
    }
  }
  const chooseActive = (img: string) => {
    setActiveImage(img)
  }

  const handleBuyCount = (value: number) => {
    setBuyCount(value)
  }

  const handleSelectVariantOption = (type: string, option: string) => {
    setSelectedVariantOptions((prev) => {
      if (prev[type] === option) {
        const newOptions = {
          ...prev,
          [type]: ''
        }
        return newOptions
      }

      return {
        ...prev,
        [type]: option
      }
    })
    setErrorVariation('')
  }

  const validateVariantSelection = () => {
    if (!product?.variantsConfig || product.variantsConfig.length === 0) return true

    const hasEmptySelection = Object.values(selectedVariantOptions).some((value) => !value)
    if (hasEmptySelection) {
      setErrorVariation('Vui lòng chọn đầy đủ các thuộc tính sản phẩm')
      return false
    }

    return true
  }

  const addToCartMutation = useAddToCartMutation()
  const handleAddToCart = async () => {
    if (!validateVariantSelection() || addToCartMutation.isPending) return
    try {
      if (selectedVariant) {
        await addToCartMutation.mutateAsync({
          variantId: selectedVariant.id,
          quantity: buyCount
        })
        trackAddToCartBehavior(selectedVariant.productId, buyCount)
        toast.success('Đã thêm sản phẩm vào giỏ hàng')
      }
      return
    } catch (error) {
      setIsOpenError(true)
      handleError(error)
    }
  }

  const handleBuyNow = async () => {
    if (!validateVariantSelection() || addToCartMutation.isPending) return
    try {
      if (selectedVariant) {
        const result = await addToCartMutation.mutateAsync({
          variantId: selectedVariant.id,
          quantity: buyCount
        })
        trackAddToCartBehavior(selectedVariant.productId, buyCount)
        navigate(`/cart`, {
          state: { cartItemId: result.data.id }
        })
      }
      return
    } catch (error) {
      setIsOpenError(true)
      handleError(error)
    }
  }

  const reviews = product?.reviews || []
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length || 0
  const renderStars = ({ rating, sizeIcon = 5 }: { rating: number; sizeIcon?: number }) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      const isFilled = starValue <= rating
      const isPartiallyFilled = rating > index && rating < starValue

      return (
        <button key={index} type='button' className='relative rounded'>
          <Star
            className={`w-${sizeIcon} h-${sizeIcon} transition-colors duration-150 ${
              isFilled ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
            }`}
          />
          {isPartiallyFilled && (
            <Star
              className={`absolute top-0 left-0 w-${sizeIcon} h-${sizeIcon} fill-yellow-400 text-yellow-400`}
              style={{
                clipPath: `inset(0 ${100 - (rating - index) * 100}% 0 0)`
              }}
            />
          )}
        </button>
      )
    })
  }

  const similarProductsQuery = useSimilarProductsQuery(Number(productId), { limit: 5 })
  const similarProducts = useMemo(() => {
    if (similarProductsQuery.isPending || !similarProductsQuery.data) return []
    return similarProductsQuery.data.data.data
  }, [similarProductsQuery.data, similarProductsQuery.isPending])

  if (!product) return <div>Loading...</div>
  return (
    <div className='bg-gray-100 py-6'>
      <div className='max-w-6xl mx-auto px-4'>
        <div className='bg-background p-4 shadow rounded-lg'>
          <div className='grid grid-cols-12 gap-9 mt-1'>
            <div className='col-span-5'>
              <div className='relative w-full cursor-zoom-in overflow-hidden pt-[100%] shadow'>
                <img
                  src={activeImage || Config.ImageBaseUrl}
                  alt={product.name}
                  className='absolute top-0 left-0 h-full w-full bg-white object-contain'
                  ref={imageRef}
                  onClick={() => setIsOpenPreview(true)}
                />
              </div>
              <div className='relative mt-5 grid grid-cols-5 gap-1'>
                <button
                  className='absolute left-0 top-1/2 z-10 h-9 w-5 -translate-y-1/2 bg-black/20 text-white'
                  onClick={prev}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
                  </svg>
                </button>
                {currentImages.map((img) => {
                  const isActive = img === activeImage
                  return (
                    <div className='relative w-full pt-[100%]' key={img} onMouseEnter={() => chooseActive(img)}>
                      <img
                        src={img}
                        alt={product.name}
                        className='absolute top-0 left-0 h-full w-full cursor-pointer bg-white object-contain'
                      />
                      {isActive && <div className='absolute inset-0 border-2 border-primary' />}
                    </div>
                  )
                })}
                <button
                  className='absolute right-0 top-1/2 z-10 h-9 w-5 -translate-y-1/2 bg-black/20 text-white'
                  onClick={next}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
                  </svg>
                </button>
              </div>
            </div>
            <div className='col-span-7'>
              <div className='flex items-center gap-2'>
                <div>
                  {product.tags && product.tags.length > 0 && (
                    <div className='flex flex-wrap'>
                      {product.tags.map((tag) => {
                        return (
                          <span key={tag.id} className={formatTagTypeColor({ type: tag.type })}>
                            {tag.name}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <h1 className='text-xl font-semibold'>
                  {product.name} {product.type === TypeProduct.FixedCombo ? '(cố định món ăn)' : ''}
                </h1>
              </div>
              {product.type === TypeProduct.FixedCombo && (
                <div className='px-6 ml-10'>
                  <div
                    dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                    className='overflow-hidden text-ellipsis whitespace-nowrap [&>*]:inline [&>*]:whitespace-nowrap [&>*]:overflow-hidden [&>*]:text-ellipsis text-sm text-gray-500 truncate'
                    title={getHtmlPlainTextTitle(product.shortDescription)}
                  />
                </div>
              )}
              <div className='mt-5 flex items-center'>
                <div className='capitalize text-gray-500'>Giá</div>
                <div className='ml-3 text-2xl font-medium text-red-600'>
                  {formatCurrency(selectedVariant ? selectedVariant.price : product.basePrice)}
                </div>
              </div>

              {product?.variantsConfig && product.variantsConfig.length > 0 && (
                <div
                  className={classNames('mt-8', {
                    hidden: product.variantsConfig[0].type === 'default' && product.variantsConfig.length === 1
                  })}
                >
                  {product.variantsConfig.map((variantConfig) => (
                    <div key={variantConfig.type} className='mb-4'>
                      <div className='text-gray-500 mb-2'>{variantConfig.type}</div>
                      <div className='flex flex-wrap gap-3'>
                        {variantConfig.options.map((option) => (
                          <div
                            key={`${variantConfig.type}-${option}`}
                            className={`border px-6 py-1 text-sm rounded min-w-[60px] text-center flex items-center justify-center gap-2 transition duration-200 cursor-pointer relative overflow-hidden ${
                              selectedVariantOptions[variantConfig.type] === option
                                ? 'border-primary'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onClick={() => handleSelectVariantOption(variantConfig.type, option)}
                          >
                            {variantConfig.type.toLowerCase() === 'màu sắc' ||
                            variantConfig.type.toLowerCase() === 'color' ? (
                              <div className='flex items-center gap-2'>
                                <div
                                  style={{
                                    backgroundColor: option.toLowerCase(),
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '100%',
                                    border: '1px solid #ddd'
                                  }}
                                ></div>
                                <div>{option}</div>
                              </div>
                            ) : (
                              <div>{option}</div>
                            )}
                            {selectedVariantOptions[variantConfig.type] === option && (
                              <div className='absolute -bottom-[1px] -right-[1px] w-0 h-0 border-l-[7px] border-l-transparent border-t-[7px] border-t-transparent border-b-[7px] border-b-primary border-r-[7px] border-r-primary'></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className='mt-1 text-red-600 min-h-[1.25rem] text-sm'>{errorVariation}</div>
                </div>
              )}

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
              <div className='mt-10 flex items-center'>
                <Button
                  onClick={handleAddToCart}
                  variant='outline'
                  className='flex h-12 items-center justify-center gap-2 rounded-sm border px-5 shadow-sm hover:scale-101 hover:border-primary hover:bg-white hover:text-primary'
                >
                  <ShoppingCart className='w-10 h-10 text-primary' />
                  Thêm vào giỏ hàng
                </Button>
                <Button
                  onClick={handleBuyNow}
                  className='ml-4 h-12 gap-2 rounded-sm border px-5 shadow-sm hover:scale-101'
                >
                  Mua ngay
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='mt-4'>
        <div className='max-w-6xl mx-auto px-4'>
          <Tabs defaultValue='description' className='w-full gap-0'>
            <TabsList className='grid w-[50%] grid-cols-2 bg-gray-100 border border-gray-200 p-0 rounded-none rounded-tl-lg rounded-tr-lg'>
              <TabsTrigger
                value='description'
                className='data-[state=active]:bg-white rounded-none rounded-tl-lg transition-all'
              >
                Mô tả
              </TabsTrigger>
              <TabsTrigger
                value='reviews'
                className='data-[state=active]:bg-white rounded-none rounded-tr-lg transition-all'
              >
                Đánh giá
              </TabsTrigger>
            </TabsList>

            <TabsContent value='description'>
              <Card className='rounded-none rounded-bl-lg rounded-br-lg'>
                <CardHeader>
                  <CardTitle className='text-lg font-medium text-gray-700'>Mô Tả Sản Phẩm</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
                    className='text-gray-800 text-base leading-relaxed space-y-4 [&>h1]:text-xl [&>h2]:text-lg [&>ul]:list-disc [&>ul]:pl-5 [&>li]:mb-1'
                  ></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='reviews'>
              <Card className='rounded-none rounded-bl-lg rounded-br-lg'>
                <CardHeader>
                  <CardTitle className='text-lg font-medium text-gray-700'>Đánh Giá Khách Hàng</CardTitle>
                  {reviews.length > 0 ? (
                    <div className='flex items-center gap-2 mb-4'>
                      <div className='flex'>{renderStars({ rating: totalRating })}</div>
                      <span className='text-sm text-gray-600'>
                        ({totalRating.toFixed(1)}/5 - {reviews.length} đánh giá)
                      </span>
                    </div>
                  ) : (
                    <div className='text-sm text-gray-500'>Chưa có đánh giá nào</div>
                  )}
                </CardHeader>
                <CardContent className='space-y-4'>
                  <ScrollArea className='h-60'>
                    <div className='space-y-3'>
                      {reviews &&
                        reviews.length > 0 &&
                        reviews.map((review) => (
                          <div key={review.id} className='pb-3'>
                            <div className='flex items-center gap-2 mb-1'>
                              <p className='font-medium text-sm'>{review.user.name}</p>
                              <div className='flex'>{renderStars({ rating: review.rating, sizeIcon: 3 })}</div>
                              <span className='text-xs text-gray-400'>
                                {formatDateTimeToLocaleString(review.updatedAt)}
                              </span>
                            </div>
                            <p className='text-sm text-gray-600'>{review.content ? review.content : '...'}</p>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className='mt-8 max-w-6xl mx-auto px-4'>
        <div className='bg-background px-6 py-4 shadow rounded-lg relative'>
          <div className='flex items-center mb-2'>
            <div className='flex items-center space-x-3'>
              <div className='w-1 h-8 bg-primary rounded-full'></div>
              <h2 className='text-xl font-bold text-gray-900'>Sản phẩm tương tự</h2>
            </div>
          </div>
          <ViewProduct recommendationType={RecommendationType.SimilarProducts} products={similarProducts} />
        </div>
      </div>
      <Dialog open={isOpenPreview} onOpenChange={setIsOpenPreview}>
        <DialogContent className='max-w-5xl p-1'>
          <div className='relative flex flex-col'>
            <div className='relative w-full pt-[60%] bg-white'>
              <img
                src={activeImage}
                alt={product?.name}
                className='absolute top-0 left-0 h-full w-full object-contain'
              />
            </div>
            <div className='mt-4 grid grid-cols-6 gap-2 px-6'>
              {product?.images.map((img) => {
                const isActive = img === activeImage
                return (
                  <div className='relative cursor-pointer pt-[100%]' key={img} onClick={() => chooseActive(img)}>
                    <img
                      src={img}
                      alt={product.name}
                      className='absolute top-0 left-0 h-full w-full bg-white object-contain'
                    />
                    {isActive && <div className='absolute inset-0 border-2 border-primary' />}
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isOpenError} onOpenChange={setIsOpenError}>
        <DialogContent className='max-w-5xl p-1'>
          <div className='relative flex flex-col p-6'>
            Bạn đã có {selectedVariant ? selectedVariant.stock : 0} sản phẩm này trong giỏ hàng. Không thể thêm số lượng
            đã chọn vào giỏ hàng vì sẽ vượt quá giới hạn mua hàng của bạn.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
