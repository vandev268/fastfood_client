export const TypeRecommendation = {
  Hybrid: 'hybrid',
  Content: 'content',
  Collaborative: 'collaborative',
  Trending: 'trending'
} as const

export const RecommendationType = {
  RecommendedProducts: 'RecommendedProducts',
  SimilarProducts: 'SimilarProducts',
  TrendingProducts: 'TrendingProducts',
  MostViewedProducts: 'MostViewedProducts'
} as const

export type RecommendationType = (typeof RecommendationType)[keyof typeof RecommendationType]
export const RecommendationTypeValues = Object.values(RecommendationType)

export const TrackingBehaviorAction = {
  View: 'view',
  Cart: 'cart',
  Order: 'order',
  Review: 'review',
  ViewSimilar: 'view_similar'
} as const
