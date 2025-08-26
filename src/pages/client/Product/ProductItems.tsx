import { Link } from 'react-router'
import Config from '@/constants/config'
import { ArrowUp } from 'lucide-react'
import { generateNameId, getHtmlPlainTextTitle, getIdByNameId } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import { useCategoryDetailQuery, useAllCategoriesQuery } from '@/queries/useCategory'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProductStatus, TypeProduct } from '@/constants/product'
import type { ProductDetailType } from '@/schemaValidations/product.schema'
import { productSocket } from '@/lib/sockets'
import type { MessageResType } from '@/schemaValidations/response.schema'
import { useAllProductsQuery } from '@/queries/useProduct'
import { useAppContext } from '@/components/AppProvider'
import { formatCurrency } from '@/lib/format'

const PAGE_SIZE = 20
export default function ProductItems() {
  const { isAuth } = useAppContext()
  const [showScrollTop, setShowScrollTop] = useState(false)

  const query = useQuery()
  const currentPage = query.get('page') ? Number(query.get('page')) : 1
  const categoryId = query.get('category') ? Number(getIdByNameId(query.get('category') as string)) : undefined

  const categoryDetailQuery = useCategoryDetailQuery(categoryId)
  const categoryDetail = categoryDetailQuery.data?.data

  const { data: categories } = useAllCategoriesQuery()

  const categoryIds = useMemo(() => {
    if (!categoryId) return []
    let ids: number[] = [categoryId]
    if (categoryDetail) {
      if (categoryDetail.parentCategoryId) {
        ids.push(Number(categoryDetail.parentCategoryId))
      }
      if (categoryDetail.childCategories && categoryDetail.childCategories.length > 0) {
        ids = ids.concat(categoryDetail.childCategories.map((child) => child.id))
      }
    }
    return ids
  }, [categoryDetail, categoryId])

  const { data, refetch } = useAllProductsQuery()

  useEffect(() => {
    if (isAuth) {
      productSocket.connect()
    } else {
      productSocket.disconnect()
      return
    }

    productSocket.on('sended-product', (data: MessageResType) => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    productSocket.on('updated-product', (data: MessageResType) => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    return () => {
      productSocket.off('sended-product')
      productSocket.off('updated-product')
      productSocket.disconnect()
    }
  }, [isAuth, refetch])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const productsByCategory = useMemo(() => {
    const products = data?.data.data || []
    const allCategories = categories?.data.data || []

    if (categoryId) {
      if (categoryIds.length === 0) return { filtered: products, grouped: null, isComboCategory: false }
      const filtered = products.filter((product) => {
        return product.categories.some((category) => categoryIds.includes(category.id))
      })

      const isComboCategory = categoryDetail?.name.toLowerCase() === 'combo'

      return { filtered, grouped: null, isComboCategory }
    }

    const parentCategories = allCategories.filter((cat) => !cat.parentCategoryId)
    const grouped = parentCategories
      .map((parentCategory) => {
        const categoryIds = [parentCategory.id]
        const childCategories = allCategories.filter((cat) => cat.parentCategoryId === parentCategory.id)
        categoryIds.push(...childCategories.map((child) => child.id))

        const categoryProducts = products
          .filter((product) => {
            return product.categories.some((category) => categoryIds.includes(category.id))
          })
          .filter((product) => product.status === ProductStatus.Available)

        if (parentCategory.name.toLowerCase() === 'combo') {
          const fixedComboProducts = categoryProducts.filter((product) => product.type === TypeProduct.FixedCombo)
          const customComboProducts = categoryProducts.filter((product) => product.type === TypeProduct.CustomCombo)

          const comboSubGroups = []
          if (fixedComboProducts.length > 0) {
            comboSubGroups.push({
              category: { ...parentCategory, name: 'Combo Cố Định' },
              products: fixedComboProducts,
              isComboSubgroup: true
            })
          }
          if (customComboProducts.length > 0) {
            comboSubGroups.push({
              category: { ...parentCategory, name: 'Combo Tự Chọn' },
              products: customComboProducts,
              isComboSubgroup: true
            })
          }

          return comboSubGroups
        }

        return {
          category: parentCategory,
          products: categoryProducts
        }
      })
      .flat()
      .filter((group) => group.products.length > 0)

    return { filtered: products, grouped, isComboCategory: false }
  }, [categoryIds, categoryId, categories?.data.data, data?.data.data, categoryDetail])

  const filteredProducts = productsByCategory.filtered

  const comboSubGroups = useMemo(() => {
    if (!productsByCategory.isComboCategory || !filteredProducts) return null

    const availableProducts = filteredProducts.filter((product) => product.status === ProductStatus.Available)
    const fixedComboProducts = availableProducts.filter((product) => product.type === TypeProduct.FixedCombo)
    const customComboProducts = availableProducts.filter((product) => product.type === TypeProduct.CustomCombo)

    const subGroups = []
    if (fixedComboProducts.length > 0) {
      subGroups.push({
        name: 'Combo Cố Định',
        products: fixedComboProducts
      })
    }
    if (customComboProducts.length > 0) {
      subGroups.push({
        name: 'Combo Tự Chọn',
        products: customComboProducts
      })
    }

    return subGroups.length > 0 ? subGroups : null
  }, [productsByCategory.isComboCategory, filteredProducts])

  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const currentItems = filteredProducts
    .filter((product) => product.status === ProductStatus.Available)
    .slice(startIndex, endIndex)

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const renderProductCard = (product: ProductDetailType) => (
    <div
      key={product.id}
      className='group cursor-pointer transition-all duration-300 hover:shadow-lg bg-white rounded-xl border border-dashed border-gray-100 hover:border-gray-300 overflow-hidden h-full flex flex-col'
    >
      <Link to={generateNameId({ name: product.name, id: product.id })} className='h-full flex flex-col'>
        <div className='aspect-square overflow-hidden w-full relative'>
          <img
            src={product.images[0] || Config.ImageBaseUrl}
            alt={product.name}
            className='w-full object-contain h-full group-hover:scale-110 transition-transform duration-500'
          />
          <div className='absolute inset-0 bg-black/0 transition-colors duration-300' />
          {product.tags && product.tags.length > 0 && (
            <div className='absolute top-2 left-2'>
              <span className='bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm'>
                {product.tags[0].name}
              </span>
            </div>
          )}
        </div>
        <div className='p-3 flex-1 flex flex-col'>
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
        </div>
      </Link>
    </div>
  )

  return (
    <div className='max-w-6xl mx-auto px-4 py-8 relative'>
      {!categoryId && productsByCategory.grouped ? (
        <div className='space-y-16'>
          {productsByCategory.grouped.map((categoryGroup) => (
            <div key={categoryGroup.category.id} className='space-y-8'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-1 h-8 bg-primary rounded-full'></div>
                  <h2 className='text-3xl font-bold text-gray-900'>{categoryGroup.category.name}</h2>
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'>
                {categoryGroup.products.map((product) => renderProductCard(product as ProductDetailType))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {categoryDetail && (
            <div className='mb-10'>
              <div className='flex items-center space-x-3'>
                <div className='w-1 h-8 bg-primary rounded-full'></div>
                <h1 className='text-3xl font-bold text-gray-900'>{categoryDetail.name}</h1>
              </div>
            </div>
          )}

          {comboSubGroups ? (
            <div className='space-y-16'>
              {comboSubGroups.map((subGroup, index) => (
                <div key={index} className='space-y-8'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-1 h-8 bg-primary rounded-full'></div>
                      <h2 className='text-xl font-bold text-gray-900'>{subGroup.name}</h2>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'>
                    {subGroup.products.map((product) => renderProductCard(product as ProductDetailType))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12'>
              {currentItems.map((product) => renderProductCard(product as ProductDetailType))}
            </div>
          )}
        </>
      )}

      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className='fixed bottom-8 right-8 z-50 w-8 h-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 p-0'
          size='icon'
        >
          <ArrowUp className='h-5 w-5 text-white' />
        </Button>
      )}
    </div>
  )
}
