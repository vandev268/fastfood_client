import http from '@/lib/http'
import type {
  GetRecommendedProductsResType,
  GetUserBehaviorInsightsResType,
  GetUserBehaviorTrackingResType,
  RecommendationQueryType,
  UpsertTrackingBehaviorBodyType
} from '@/schemaValidations/recommendation.schema'

const BASE_URL = '/recommendations'

const recommendationApis = {
  getUserBehaviorInsights() {
    return http.get<GetUserBehaviorInsightsResType>(`${BASE_URL}/behavior/insights`)
  },

  trackingUserBehavior(data: UpsertTrackingBehaviorBodyType) {
    return http.post<GetUserBehaviorTrackingResType>(`${BASE_URL}/behavior/tracking`, data)
  },

  getRecommendedProducts(query: RecommendationQueryType) {
    return http.get<GetRecommendedProductsResType>(`${BASE_URL}/products`, { params: query })
  },

  getTrendingProducts(query: RecommendationQueryType) {
    return http.get<GetRecommendedProductsResType>(`${BASE_URL}/products/trending`, { params: query })
  },

  getMostViewedProducts(query: RecommendationQueryType) {
    return http.get<GetRecommendedProductsResType>(`${BASE_URL}/products/most-viewed`, { params: query })
  },

  getSimilarProducts({ productId, query }: { productId: number; query: RecommendationQueryType }) {
    return http.get<GetRecommendedProductsResType>(`${BASE_URL}/products/${productId}/similar`, { params: query })
  }
}

export default recommendationApis
