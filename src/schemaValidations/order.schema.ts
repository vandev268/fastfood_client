import { OrderStatus, OrderType } from '@/constants/order'
import { PaymentMethod, PaymentStatus } from '@/constants/payment'
import { z } from 'zod'
import { PaymentSchema } from './payment.schema'
import { CartItemDetailSchema } from './cart.schema'
import { UserSchema } from './user.schema'
import { TableSchema } from './table.schema'
import { CouponSchema } from './coupon.schema'
import { ProductSchema, VariantSchema } from './product.schema'
import { PaginationQuerySchema } from './request.schema'
import { ReviewSchema } from './review.schema'
import { AddressDetailSchema, AddressSchema } from './address.schema'
import { MessageResSchema } from './response.schema'
import { ReservationSchema } from './reservation.schema'
import { DraftItemDetailSchema } from './draft-item.schema'

export const OrderSchema = z.object({
  id: z.number(),
  orderType: z.nativeEnum(OrderType),
  customerName: z.string().max(500).default(''),
  userId: z.number().nullable(),
  deliveryAddressId: z.number().nullable(),
  tableId: z.number().nullable(),
  bookingId: z.number().nullable(),
  couponId: z.number().nullable(),
  totalAmount: z.number().positive(),
  feeAmount: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  finalAmount: z.number().nonnegative(),
  payment: PaymentSchema,
  note: z.string().default(''),
  status: z.nativeEnum(OrderStatus),
  handlerId: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const OrderItemSchema = z.object({
  id: z.number(),
  productName: z.string(),
  thumbnail: z.string().nullable(),
  variantValue: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  orderId: z.number().int(),
  productId: z.number().int().nullable(),
  variantId: z.number().int().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const OrderDetailSchema = OrderSchema.extend({
  orderItems: z.array(
    OrderItemSchema.extend({
      variant: VariantSchema.extend({
        product: ProductSchema.nullable()
      }).nullable()
    })
  ),
  reviews: z.array(ReviewSchema),
  user: UserSchema.omit({ totpSecret: true, password: true }).nullable(),
  deliveryAddress: AddressDetailSchema.nullable(),
  tables: z.lazy(() => z.array(TableSchema)),
  reservation: ReservationSchema.nullable(),
  coupon: CouponSchema.nullable(),
  handler: UserSchema.omit({ totpSecret: true, password: true }).nullable()
})

export const OrderParamsSchema = z.object({
  orderId: z.coerce.number().int().positive()
})

export const OrderQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  orderType: z.nativeEnum(OrderType).optional()
})

export const GetOrdersResSchema = z.object({
  data: z.array(OrderDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllOrdersResSchema = GetOrdersResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateOnlineOrderBodySchema = OrderSchema.pick({
  deliveryAddressId: true,
  couponId: true,
  note: true
})
  .extend({
    paymentMethod: z.nativeEnum(PaymentMethod),
    cartItems: z.array(CartItemDetailSchema).min(1, 'Đơn hàng phải có ít nhất một sản phẩm')
  })
  .strict()

export const CreateTakeAwayOrderBodySchema = OrderSchema.pick({
  couponId: true,
  note: true
})
  .extend({
    paymentMethod: z.nativeEnum(PaymentMethod),
    draftCode: z.string(),
    draftItems: z.array(DraftItemDetailSchema).min(1, 'Đơn hàng phải có ít nhất một sản phẩm')
  })
  .strict()

export const CreateDeliveryOrderBodySchema = OrderSchema.pick({
  couponId: true,
  note: true
})
  .extend({
    paymentMethod: z.nativeEnum(PaymentMethod),
    draftCode: z.string(),
    draftItems: z.array(DraftItemDetailSchema).min(1, 'Đơn hàng phải có ít nhất một sản phẩm'),
    deliveryAddress: AddressSchema.pick({
      recipientName: true,
      recipientPhone: true,
      provinceId: true,
      districtId: true,
      wardId: true,
      detailAddress: true,
      deliveryNote: true
    })
  })
  .strict()

export const CreateDineInOrderBodySchema = OrderSchema.pick({
  orderType: true,
  couponId: true,
  note: true
})
  .extend({
    paymentMethod: z.nativeEnum(PaymentMethod),
    draftCode: z.string(),
    draftItems: z.array(DraftItemDetailSchema).min(1, 'Đơn hàng phải có ít nhất một sản phẩm'),
    tableIds: z.array(z.number().int().positive()).min(1, 'Đơn hàng phải có ít nhất một bàn'),
    reservationId: z.number().int().positive().nullable()
  })
  .strict()

export const CreateOrderResSchema = MessageResSchema.extend({
  orderId: z.number(),
  paymentStatus: z.nativeEnum(PaymentStatus),
  paymentUrl: z.string().optional()
})

export const ChangeOrderStatusBodySchema = OrderSchema.pick({
  status: true
}).strict()

export type OrderItemType = z.infer<typeof OrderItemSchema>
export type OrderType = z.infer<typeof OrderSchema>
export type OrderDetailType = z.infer<typeof OrderDetailSchema>
export type OrderParamsType = z.infer<typeof OrderParamsSchema>
export type OrderQueryType = z.infer<typeof OrderQuerySchema>
export type GetOrdersResType = z.infer<typeof GetOrdersResSchema>
export type GetAllOrdersResType = z.infer<typeof GetAllOrdersResSchema>
export type CreateOnlineOrderBodyType = z.infer<typeof CreateOnlineOrderBodySchema>
export type CreateTakeAwayOrderBodyType = z.infer<typeof CreateTakeAwayOrderBodySchema>
export type CreateDeliveryOrderBodyType = z.infer<typeof CreateDeliveryOrderBodySchema>
export type CreateDineInOrderBodyType = z.infer<typeof CreateDineInOrderBodySchema>
export type CreateOrderResType = z.infer<typeof CreateOrderResSchema>
export type ChangeOrderStatusBodyType = z.infer<typeof ChangeOrderStatusBodySchema>
