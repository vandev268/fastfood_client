import { z } from 'zod'
import { DistrictSchema } from './district.schema'

export const ProvinceSchema = z.object({
  id: z.number(),
  name: z.string().max(500),
  nameEn: z.string().max(500),
  latitude: z.string().max(50),
  longitude: z.string().max(50)
})

export const ProvinceDetailSchema = ProvinceSchema.extend({
  districts: z.array(DistrictSchema)
})

export const ProvinceParamsSchema = z
  .object({
    provinceId: z.coerce.number().int().positive()
  })
  .strict()

export const GetProvincesResSchema = z.object({
  data: z.array(ProvinceSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllProvincesResSchema = GetProvincesResSchema.pick({
  data: true,
  totalItems: true
})

export type ProvinceType = z.infer<typeof ProvinceSchema>
export type ProvinceDetailType = z.infer<typeof ProvinceDetailSchema>
export type ProvinceParamsType = z.infer<typeof ProvinceParamsSchema>
export type GetProvincesResType = z.infer<typeof GetProvincesResSchema>
export type GetAllProvincesResType = z.infer<typeof GetAllProvincesResSchema>
