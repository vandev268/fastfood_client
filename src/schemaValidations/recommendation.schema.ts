import { z } from 'zod'
import { ProductSchema } from './product.schema'
import { CategorySchema } from './category.schema'
import { TrackingBehaviorAction, TypeRecommendation } from '@/constants/recommendation'

export const UserBehaviorDataSchema = z.object({
  userId: z.number().int().nonnegative(),
  productId: z.number().int().nonnegative(),
  categoryId: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5).optional(),
  orderCount: z.number().int().nonnegative(),
  totalAmount: z.number().nonnegative(),
  lastOrderDate: z.date(),
  avgRating: z.number().min(0).max(5)
})

export const GetUserBehaviorInsightsResSchema = z.object({
  totalSpent: z.number(),
  totalOrders: z.number(),
  favoriteCategories: z.array(
    z.object({
      categoryId: z.number(),
      orderCount: z.number(),
      totalAmount: z.number()
    })
  ),
  avgRating: z.number().nullable(),
  totalReviews: z.number().int().nonnegative(),
  lastOrderDate: z.date().nullable(),
  avgOrderValue: z.number(),
  customerSegment: z.string(),
  satisfactionLevel: z.string()
})

export const UpsertTrackingBehaviorBodySchema = z.object({
  productId: z.number(),
  action: z.nativeEnum(TrackingBehaviorAction),
  data: z.record(z.any()).optional()
})

export const GetUserBehaviorTrackingResSchema = z.object({
  data: z.object({
    userId: z.number().int().nonnegative(),
    action: z.string(),
    productId: z.number().int().nonnegative(),
    timestamp: z.string().datetime()
  })
})

export const ProductRecommendationSchema = ProductSchema.pick({
  id: true,
  name: true,
  basePrice: true,
  images: true,
  status: true,
  variantsConfig: true,
  type: true,
  shortDescription: true,
  deletedAt: true
}).extend({
  score: z.number(),
  reason: z.string(),
  rating: z.object({
    avg: z.number().min(0).max(5).nullable().default(null),
    quantity: z.number().int().nonnegative().default(0)
  }),
  categories: z.array(
    CategorySchema.pick({
      id: true,
      name: true
    })
  )
})

export const RecommendationQuerySchema = z.object({
  limit: z.coerce.number().int().nonnegative().default(20).optional(),
  type: z.nativeEnum(TypeRecommendation).default(TypeRecommendation.Hybrid).optional()
})

export const GetRecommendedProductsResSchema = z.object({
  data: z.array(ProductRecommendationSchema),
  totalItems: z.number()
})

export type UserBehaviorDataType = z.infer<typeof UserBehaviorDataSchema>
export type GetUserBehaviorInsightsResType = z.infer<typeof GetUserBehaviorInsightsResSchema>
export type UpsertTrackingBehaviorBodyType = z.infer<typeof UpsertTrackingBehaviorBodySchema>
export type GetUserBehaviorTrackingResType = z.infer<typeof GetUserBehaviorTrackingResSchema>
export type ProductRecommendationType = z.infer<typeof ProductRecommendationSchema>
export type RecommendationQueryType = z.infer<typeof RecommendationQuerySchema>
export type GetRecommendedProductsResType = z.infer<typeof GetRecommendedProductsResSchema>
