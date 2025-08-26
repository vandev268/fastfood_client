import { z } from 'zod'
import { ProvinceSchema } from './province.schema'
import { DistrictSchema } from './district.schema'
import { WardSchema } from './ward.schema'

export const AddressSchema = z.object({
  id: z.number(),
  userId: z.number(),
  recipientName: z.string().min(1, 'Tên người nhận là bắt buộc').max(500),
  recipientPhone: z.string().min(1, 'Số điện thoại người nhận là bắt buộc').max(50),
  provinceId: z.coerce.number().int().positive('Mã tỉnh là bắt buộc'),
  districtId: z.coerce.number().int().positive('Mã quận/huyện là bắt buộc'),
  wardId: z.number().int().positive('Mã phường/xã là bắt buộc'),
  detailAddress: z.string().min(1, 'Chi tiết địa chỉ là bắt buộc').max(1000),
  deliveryNote: z.string().max(1000),
  isDefault: z.boolean(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const AddressDetailSchema = AddressSchema.extend({
  province: ProvinceSchema,
  district: DistrictSchema,
  ward: WardSchema
})

export const AddressParamsSchema = z
  .object({
    addressId: z.coerce.number().int().positive()
  })
  .strict()

export const GetAddressesResSchema = z.object({
  data: z.array(AddressDetailSchema),
  totalItems: z.number(),
  limit: z.number(),
  page: z.number(),
  totalPages: z.number()
})

export const GetAllAddressesResSchema = GetAddressesResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateAddressBodySchema = AddressSchema.pick({
  recipientName: true,
  recipientPhone: true,
  provinceId: true,
  districtId: true,
  wardId: true,
  detailAddress: true,
  deliveryNote: true,
  isDefault: true
}).strict()

export const UpdateAddressBodySchema = CreateAddressBodySchema.strict()

export const ChangeAddressDefaultBodySchema = AddressSchema.pick({
  isDefault: true
}).strict()

export type AddressType = z.infer<typeof AddressSchema>
export type AddressDetailType = z.infer<typeof AddressDetailSchema>
export type AddressParamsType = z.infer<typeof AddressParamsSchema>
export type GetAddressesResType = z.infer<typeof GetAddressesResSchema>
export type GetAllAddressesResType = z.infer<typeof GetAllAddressesResSchema>
export type CreateAddressBodyType = z.infer<typeof CreateAddressBodySchema>
export type UpdateAddressBodyType = z.infer<typeof UpdateAddressBodySchema>
export type ChangeAddressDefaultBodyType = z.infer<typeof ChangeAddressDefaultBodySchema>
