import { z } from 'zod'
import { UserSchema } from './user.schema'

export const ReviewSchema = z.object({
  id: z.number(),
  userId: z.number(),
  productId: z.coerce.number(),
  orderId: z.coerce.number(),
  rating: z.coerce.number().min(0).max(5),
  content: z.string(),
  isEdited: z.boolean(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const ReviewDetailSchema = ReviewSchema.extend({
  user: UserSchema.pick({
    id: true,
    name: true,
    email: true,
    avatar: true
  })
})

export const ReviewParamsScheme = z.object({
  reviewId: z.coerce.number().int().positive()
})

export const GetReviewsQuerySchema = ReviewSchema.pick({
  productId: true
}).strict()

export const GetReviewDetailQuerySchema = ReviewSchema.pick({
  productId: true,
  orderId: true
}).strict()

export const GetReviewsResSchema = z.object({
  data: z.array(ReviewDetailSchema),
  totalItems: z.number()
})

export const CreateReviewBodySchema = ReviewSchema.pick({
  productId: true,
  orderId: true,
  rating: true,
  content: true
}).strict()

export const UpdateReviewBodySchema = CreateReviewBodySchema

export type ReviewType = z.infer<typeof ReviewSchema>
export type ReviewParamsType = z.infer<typeof ReviewParamsScheme>
export type ReviewDetailType = z.infer<typeof ReviewDetailSchema>
export type GetReviewsQueryType = z.infer<typeof GetReviewsQuerySchema>
export type GetReviewDetailQueryType = z.infer<typeof GetReviewDetailQuerySchema>
export type GetReviewsResType = z.infer<typeof GetReviewsResSchema>
export type CreateReviewBodyType = z.infer<typeof CreateReviewBodySchema>
export type UpdateReviewBodyType = z.infer<typeof UpdateReviewBodySchema>
