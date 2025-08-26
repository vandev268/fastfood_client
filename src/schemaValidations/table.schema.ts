import { TableLocation, TableStatus } from '@/constants/table'
import { z } from 'zod'
import { OrderSchema } from './order.schema'
import { ReservationSchema } from './reservation.schema'

export const TableSchema = z.object({
  id: z.number(),
  code: z.string().min(1, 'Mã bàn là bắt buộc').max(50),
  capacity: z.coerce.number().int().positive('Sức chứa bàn phải lớn hơn 0'),
  status: z.nativeEnum(TableStatus),
  location: z.nativeEnum(TableLocation),
  deletedAt: z.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const TableDetailSchema = TableSchema.extend({
  reservations: z.array(ReservationSchema),
  orders: z.lazy(() => z.array(OrderSchema))
})

export const TableParamsSchema = z.object({
  tableId: z.coerce.number().int().positive()
})

export const GetTablesResSchema = z.object({
  data: z.array(TableDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllTablesResSchema = GetTablesResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateTableBodySchema = TableSchema.pick({
  code: true,
  capacity: true,
  status: true,
  location: true
}).strict()

export const UpdateTableBodySchema = CreateTableBodySchema

export const ChangeTableStatusBodySchema = TableSchema.pick({
  status: true
}).strict()

export type TableType = z.infer<typeof TableSchema>
export type TableDetailType = z.infer<typeof TableDetailSchema>
export type TableParamsType = z.infer<typeof TableParamsSchema>
export type GetTablesResType = z.infer<typeof GetTablesResSchema>
export type GetAllTablesResType = z.infer<typeof GetAllTablesResSchema>
export type CreateTableBodyType = z.infer<typeof CreateTableBodySchema>
export type UpdateTableBodyType = z.infer<typeof UpdateTableBodySchema>
export type ChangeTableStatusBodyType = z.infer<typeof ChangeTableStatusBodySchema>
