import { CouponDiscountType } from '@/constants/coupon'
import { z } from 'zod'

export const CouponSchema = z.object({
  id: z.number(),
  code: z.string().min(1, 'Mã giảm giá là bắt buộc').max(500),
  description: z.string(),
  discountType: z.nativeEnum(CouponDiscountType),
  discountValue: z.coerce
    .number({
      message: 'Giá trị giảm giá phải là một số hợp lệ'
    })
    .positive({
      message: 'Giá trị giảm giá phải lớn hơn 0'
    }),
  minOrderAmount: z.coerce
    .number({
      message: 'Giá trị giảm giá phải là một số hợp lệ'
    })
    .nonnegative({
      message: 'Giá trị giảm giá tối thiểu phải là 0'
    }),
  usageLimit: z.coerce
    .number({
      message: 'Giá trị giảm giá phải là một số hợp lệ'
    })
    .int({
      message: 'Số lượng sử dụng tối đa phải là một số nguyên'
    })
    .nonnegative({
      message: 'Số lượng sử dụng tối đa phải là 0'
    }),
  isActive: z.coerce.boolean(),
  expiresAt: z.coerce.date().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const CouponDetailSchema = CouponSchema

export const CouponParamsSchema = z.object({
  couponId: z.coerce.number().int().positive()
})

export const GetCouponsResSchema = z.object({
  data: z.array(CouponSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllCouponsResSchema = GetCouponsResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateCouponBodySchema = CouponSchema.pick({
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minOrderAmount: true,
  usageLimit: true,
  isActive: true,
  expiresAt: true
})
  .strict()
  .superRefine(({ discountType, discountValue }, ctx) => {
    if (discountType === 'Percent' && (discountValue < 0 || discountValue > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Giá trị giảm giá theo phần trăm phải nằm trong khoảng từ 0% đến 100%.',
        path: ['discountValue']
      })
    } else if (discountType === 'Amount' && discountValue <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Giá trị giảm giá theo tiền tệ phải lớn hơn 0₫.',
        path: ['discountValue']
      })
    }
  })

export const UpdateCouponBodySchema = CreateCouponBodySchema

export const ChangeCouponStatusBodySchema = CouponSchema.pick({
  isActive: true
}).strict()

export type CouponType = z.infer<typeof CouponSchema>
export type CouponDetailType = z.infer<typeof CouponDetailSchema>
export type CouponParamsType = z.infer<typeof CouponParamsSchema>
export type GetCouponsResType = z.infer<typeof GetCouponsResSchema>
export type GetAllCouponsResType = z.infer<typeof GetAllCouponsResSchema>
export type CreateCouponBodyType = z.infer<typeof CreateCouponBodySchema>
export type UpdateCouponBodyType = z.infer<typeof UpdateCouponBodySchema>
export type ChangeCouponStatusBodyType = z.infer<typeof ChangeCouponStatusBodySchema>
