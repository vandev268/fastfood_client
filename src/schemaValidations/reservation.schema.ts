import { z } from 'zod'
import { TableSchema } from './table.schema'
import { UserSchema } from './user.schema'
import { ReservationStatus } from '@/constants/reservation'

export const ReservationSchema = z.object({
  id: z.number(),
  tableId: z.coerce.number().nullable(),
  guestName: z.string().min(1, 'Tên khách hàng là bắt buộc').max(500),
  guestPhone: z.string().min(1, 'Số điện thoại là bắt buộc').max(50),
  numberOfGuest: z.number().int().positive({ message: 'Số lượng khách phải lớn hơn 0' }),
  reservationTime: z.coerce.date(),
  status: z.nativeEnum(ReservationStatus),
  note: z.string(),
  userId: z.coerce.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const ReservationDetailSchema = ReservationSchema.extend({
  table: z.lazy(() => TableSchema),
  user: UserSchema.pick({
    id: true,
    name: true,
    email: true,
    phoneNumber: true,
    avatar: true
  }).nullable()
})

export const ReservationParamsSchema = z.object({
  reservationId: z.coerce.number().int().positive()
})

export const GetReservationsResSchema = z.object({
  data: z.array(ReservationDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllReservationsResSchema = GetReservationsResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateReservationBodySchema = ReservationSchema.pick({
  guestName: true,
  guestPhone: true,
  numberOfGuest: true,
  reservationTime: true,
  status: true,
  note: true,
  tableId: true,
  userId: true
})
  .strict()
  .superRefine(({ tableId }, ctx) => {
    if (tableId === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Table ID is required',
        path: ['tableId']
      })
    }
  })

export const UpdateReservationBodySchema = CreateReservationBodySchema

export const CreateCustomerReservationBodySchema = ReservationSchema.pick({
  guestName: true,
  guestPhone: true,
  numberOfGuest: true,
  status: true,
  note: true,
  tableId: true,
  userId: true
})
  .extend({
    reservationDate: z.string().min(1, 'Ngày đặt bàn là bắt buộc'),
    reservationTime: z.string().min(1, 'Thời gian đặt bàn là bắt buộc')
  })
  .strict()
  .superRefine(({ tableId }, ctx) => {
    if (tableId === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Table ID is required',
        path: ['tableId']
      })
    }
  })

export const ChangeReservationStatusBodySchema = ReservationSchema.pick({
  status: true
}).strict()

export type ReservationType = z.infer<typeof ReservationSchema>
export type ReservationDetailType = z.infer<typeof ReservationDetailSchema>
export type ReservationParamsType = z.infer<typeof ReservationParamsSchema>
export type GetReservationsResType = z.infer<typeof GetReservationsResSchema>
export type GetAllReservationsResType = z.infer<typeof GetAllReservationsResSchema>
export type CreateReservationBodyType = z.infer<typeof CreateReservationBodySchema>
export type UpdateReservationBodyType = z.infer<typeof UpdateReservationBodySchema>
export type CreateCustomerReservationBodyType = z.infer<typeof CreateCustomerReservationBodySchema>
export type ChangeReservationStatusBodyType = z.infer<typeof ChangeReservationStatusBodySchema>
