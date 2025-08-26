import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import recommendationApi from '@/apis/recommendation'
import type { RecommendationQueryType } from '@/schemaValidations/recommendation.schema'
import recommendationApis from '@/apis/recommendation'

const BASE_KEY = 'recommendations'

export const useUserBehaviorInsightsQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY, 'behavior-insights'],
    queryFn: recommendationApis.getUserBehaviorInsights,
    placeholderData: keepPreviousData
  })
}

export const useTrackUserBehaviorMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recommendationApi.trackingUserBehavior,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
      queryClient.invalidateQueries({ queryKey: ['behavior-insights'] })
    }
  })
}

export const useAutoTrackBehaviorMutation = () => {
  const trackBehaviorMutation = useTrackUserBehaviorMutation()

  const trackViewBehavior = (productId: number) => {
    if (trackBehaviorMutation.isPending) return
    trackBehaviorMutation.mutate({
      productId,
      action: 'view',
      data: { timestamp: new Date().toISOString() }
    })
  }

  const trackAddToCartBehavior = (productId: number, quantity: number) => {
    if (trackBehaviorMutation.isPending) return
    trackBehaviorMutation.mutate({
      productId,
      action: 'cart',
      data: { quantity, timestamp: new Date().toISOString() }
    })
  }

  const trackOrderBehavior = ({
    productId,
    quantity,
    amount
  }: {
    productId: number
    quantity: number
    amount: number
  }) => {
    if (trackBehaviorMutation.isPending) return
    trackBehaviorMutation.mutate({
      productId,
      action: 'order',
      data: { quantity, amount, timestamp: new Date().toISOString() }
    })
  }

  const trackReviewBehavior = (productId: number, rating: number, content?: string) => {
    if (trackBehaviorMutation.isPending) return
    trackBehaviorMutation.mutate({
      productId,
      action: 'review',
      data: { rating, content, timestamp: new Date().toISOString() }
    })
  }

  return {
    trackViewBehavior,
    trackAddToCartBehavior,
    trackOrderBehavior,
    trackReviewBehavior
  }
}

export const useRecommendedProductsQuery = (query: RecommendationQueryType & { enabled?: boolean }) => {
  const { enabled = true, ...recommendationQuery } = query
  return useQuery({
    queryKey: [BASE_KEY, 'products', recommendationQuery],
    queryFn: () => recommendationApi.getRecommendedProducts(recommendationQuery),
    // Không sử dụng placeholderData để đảm bảo fetch mới khi reload
    // placeholderData: keepPreviousData,
    enabled,
    staleTime: 0, // Data luôn được coi là stale
    refetchOnMount: true // Luôn refetch khi component mount
  })
}

export const useTrendingProductsQuery = (query: RecommendationQueryType & { enabled?: boolean }) => {
  const { enabled = true, ...recommendationQuery } = query
  return useQuery({
    queryKey: [BASE_KEY, 'trending-products', recommendationQuery],
    queryFn: () => recommendationApi.getTrendingProducts(recommendationQuery),
    placeholderData: keepPreviousData,
    enabled
  })
}

export const useMostViewedProductsQuery = (query: RecommendationQueryType & { enabled?: boolean }) => {
  const { enabled = true, ...recommendationQuery } = query
  return useQuery({
    queryKey: [BASE_KEY, 'most-viewed-products', recommendationQuery],
    queryFn: () => recommendationApi.getMostViewedProducts(recommendationQuery),
    placeholderData: keepPreviousData,
    enabled
  })
}

export const useSimilarProductsQuery = (productId: number | undefined, query: RecommendationQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY, 'similar-products', productId],
    queryFn: () =>
      recommendationApi.getSimilarProducts({
        productId: productId as number,
        query
      }),
    enabled: productId !== undefined && productId > 0
  })
}
