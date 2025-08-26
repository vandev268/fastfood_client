import { z } from 'zod'
import { WardSchema } from './ward.schema'

export const DistrictSchema = z.object({
  id: z.number(),
  name: z.string().max(500),
  nameEn: z.string().max(500),
  latitude: z.string().max(50),
  longitude: z.string().max(50),
  provinceId: z.number()
})

export const DistrictDetailSchema = DistrictSchema.extend({
  wards: z.array(WardSchema)
})

export const DistrictParamsSchema = z
  .object({
    districtId: z.coerce.number().int().positive()
  })
  .strict()

export const GetDistrictsResSchema = z.object({
  data: z.array(DistrictSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllDistrictsResSchema = GetDistrictsResSchema.pick({
  data: true,
  totalItems: true
})

export type DistrictType = z.infer<typeof DistrictSchema>
export type DistrictDetailType = z.infer<typeof DistrictDetailSchema>
export type DistrictParamsType = z.infer<typeof DistrictParamsSchema>
export type GetDistrictsResType = z.infer<typeof GetDistrictsResSchema>
export type GetAllDistrictsResType = z.infer<typeof GetAllDistrictsResSchema>
