import { useAppContext } from '@/components/AppProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router'
import { TrendingUp, Heart, ChefHat, Eye, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  useMostViewedProductsQuery,
  useRecommendedProductsQuery,
  useTrendingProductsQuery
} from '@/queries/useRecommendation'
import { useMemo, useState, useEffect } from 'react'
import ViewProduct from '@/components/ViewProduct'
import { RecommendationType, TypeRecommendation } from '@/constants/recommendation'
import { useInView } from '@/hooks/useInView'
import { useQueryClient } from '@tanstack/react-query'
import { handleError } from '@/lib/utils'

export default function Home() {
  const { profile } = useAppContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showRecommendations, setShowRecommendations] = useState(false)
  const {
    ref: recommendationRef,
    isInView,
    hasTriggered
  } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (profile) {
      queryClient.invalidateQueries({
        queryKey: ['recommendations', 'products'],
        exact: false
      })
    }
  }, [profile, queryClient])

  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        setShowRecommendations(true)
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [profile])

  const recommendedProductsQuery = useRecommendedProductsQuery({
    type: TypeRecommendation.Hybrid,
    limit: 10,
    enabled: Boolean(profile && (showRecommendations || isInView || hasTriggered))
  })
  const recommendedProducts = useMemo(() => {
    if (!recommendedProductsQuery.data) return
    return recommendedProductsQuery.data.data.data
  }, [recommendedProductsQuery.data])

  const trendingProductsQuery = useTrendingProductsQuery({
    type: TypeRecommendation.Trending,
    limit: 5
  })
  const trendingProducts = useMemo(() => {
    if (trendingProductsQuery.isPending || !trendingProductsQuery.data) return
    return trendingProductsQuery.data.data.data
  }, [trendingProductsQuery.data, trendingProductsQuery.isPending])

  const mostViewedProductsQuery = useMostViewedProductsQuery({
    limit: 5
  })
  const mostViewedProducts = useMemo(() => {
    if (mostViewedProductsQuery.isPending || !mostViewedProductsQuery.data) return
    return mostViewedProductsQuery.data.data.data
  }, [mostViewedProductsQuery.data, mostViewedProductsQuery.isPending])

  const refreshRecommendations = async () => {
    setIsRefreshing(true)
    try {
      queryClient.invalidateQueries({
        queryKey: ['recommendations'],
        exact: false
      })
      await recommendedProductsQuery.refetch()
      toast.success('Đã làm mới gợi ý sản phẩm!')
    } catch (error) {
      handleError(error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const renderPersonalRecommendations = () => {
    if (!profile) return null

    return (
      <section ref={recommendationRef} className='mb-12'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <Heart className='h-6 w-6 text-red-500' />
            <h2 className='text-2xl font-bold text-gray-800'>Có thể bạn cũng thích</h2>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={refreshRecommendations}
            disabled={recommendedProductsQuery.isPending || isRefreshing}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={`h-4 w-4 ${recommendedProductsQuery.isPending || isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
          </Button>
        </div>

        {!showRecommendations ? (
          <Card className='p-12 text-center'>
            <div className='flex flex-col items-center justify-center'>
              <div className='animate-pulse h-12 w-12 bg-gray-200 rounded-full mb-4'></div>
              <p className='text-gray-500'>Đang chuẩn bị gợi ý cá nhân hóa...</p>
            </div>
          </Card>
        ) : recommendedProductsQuery.isPending ? (
          <Card className='p-12 text-center'>
            <div className='flex flex-col items-center justify-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4'></div>
              <p className='text-gray-600 text-lg mb-2'>Đang phân tích sở thích của bạn...</p>
              <p className='text-gray-400 text-sm'>Hệ thống AI đang tìm kiếm những món ăn phù hợp nhất</p>
            </div>
          </Card>
        ) : recommendedProducts && recommendedProducts.length > 0 ? (
          <ViewProduct recommendationType={RecommendationType.RecommendedProducts} products={recommendedProducts} />
        ) : (
          <Card className='p-8 text-center'>
            <ChefHat className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-500 mb-4'>Chúng tôi đang học về sở thích của bạn...</p>
            <p className='text-sm text-gray-400 mb-4'>Hãy xem và đặt một vài món để nhận được gợi ý cá nhân hóa!</p>
            <Button onClick={() => navigate('/products')}>Khám phá menu</Button>
          </Card>
        )}
      </section>
    )
  }

  const renderFeaturedProducts = () => (
    <section className='mb-12'>
      <div className='flex items-center gap-3 mb-6'>
        <TrendingUp className='h-6 w-6 text-orange-500' />
        <h2 className='text-2xl font-bold text-gray-800'>Sản phẩm nổi bật</h2>
      </div>

      {!trendingProducts ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 12 }).map((_, index) => (
            <Card key={index} className='animate-pulse'>
              <CardContent className='p-4'>
                <Skeleton className='h-48 w-full rounded-lg mb-4' />
                <Skeleton className='h-4 w-3/4 mb-2' />
                <Skeleton className='h-4 w-1/2' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : trendingProducts.length > 0 ? (
        <ViewProduct recommendationType={RecommendationType.TrendingProducts} products={trendingProducts} />
      ) : (
        <Card className='p-8 text-center'>
          <p className='text-gray-500'>Không có sản phẩm nổi bật nào</p>
        </Card>
      )}
    </section>
  )

  const renderMostViewedProducts = () => (
    <section className='mb-12'>
      <div className='flex items-center gap-3 mb-6'>
        <Eye className='h-6 w-6 text-blue-500' />
        <h2 className='text-2xl font-bold text-gray-800'>Được quan tâm nhất</h2>
      </div>

      {!mostViewedProducts ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
          {Array.from({ length: 10 }).map((_, index) => (
            <Card key={index} className='animate-pulse'>
              <CardContent className='p-4'>
                <Skeleton className='h-48 w-full rounded-lg mb-4' />
                <Skeleton className='h-4 w-3/4 mb-2' />
                <Skeleton className='h-4 w-1/2' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mostViewedProducts.length > 0 ? (
        <ViewProduct recommendationType={RecommendationType.MostViewedProducts} products={mostViewedProducts} />
      ) : (
        <Card className='p-8 text-center'>
          <p className='text-gray-500'>Chưa có sản phẩm được quan tâm nào</p>
        </Card>
      )}
    </section>
  )

  return (
    <div className='max-w-6xl mx-auto px-4 py-8'>
      <section className='mb-6'>
        <Card className='bg-gradient-to-r from-orange-500 to-red-500 text-white'>
          <CardContent className='p-2'>
            <div className='text-center'>
              <h1 className='text-4xl font-bold mb-4'>Chào mừng đến FaFo!</h1>
              <p className='text-xl mb-6 opacity-90'>
                {profile
                  ? 'Hãy khám phá những món ăn được gợi ý riêng cho bạn'
                  : 'Khám phá những món ăn ngon và được yêu thích nhất'}
              </p>
              <Button size='lg' variant='secondary' onClick={() => navigate('/products')}>
                Khám phá menu ngay
              </Button>

              <div className='pt-2 mt-8 border-t border-white/20'>
                <h3 className='text-lg font-semibold mb-3'>Đặt hàng qua điện thoại</h3>
                <div className='flex flex-col sm:flex-row items-center justify-center gap-4 text-white/90'>
                  <div className='flex items-center gap-2'>
                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z'></path>
                    </svg>
                    <a href='tel:+84901234567' className='text-xl font-bold hover:text-yellow-200 transition-colors'>
                      0901 234 567
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {renderPersonalRecommendations()}
      {renderFeaturedProducts()}
      {renderMostViewedProducts()}

      <section className='text-center'>
        <Card className='p-8 bg-gray-50'>
          <h3 className='text-2xl font-semibold'>Bạn chưa tìm thấy món ăn ưng ý?</h3>
          <p className='text-gray-600 mb-2'>Khám phá toàn bộ menu với hàng trăm món ăn ngon đang chờ bạn!</p>
          <div className='flex gap-4 justify-center flex-wrap'>
            <Button onClick={() => navigate('/products')}>Xem toàn bộ menu</Button>
            {!profile && (
              <Button variant='outline' onClick={() => navigate('/login')}>
                Đăng nhập để nhận gợi ý cá nhân
              </Button>
            )}
          </div>
        </Card>
      </section>
    </div>
  )
}
