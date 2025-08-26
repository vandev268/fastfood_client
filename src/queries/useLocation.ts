import locationApis from '@/apis/location'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export const useAllProvincesQuery = () => {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: locationApis.findProvinces,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60 // 1 hour
  })
}

export const useProvinceDetailQuery = (provinceId: number | undefined) => {
  return useQuery({
    queryKey: ['provinces', provinceId],
    queryFn: () => locationApis.findProvinceDetail(provinceId as number),
    enabled: provinceId !== undefined && provinceId > 0
  })
}

export const useDistrictDetailQuery = (districtId: number | undefined) => {
  return useQuery({
    queryKey: ['districts', districtId],
    queryFn: () => locationApis.findDistrictDetail(districtId as number),
    enabled: districtId !== undefined && districtId > 0
  })
}

export const useWardDetailQuery = (wardId: number | undefined) => {
  return useQuery({
    queryKey: ['wards', wardId],
    queryFn: () => locationApis.findWardDetail(wardId as number),
    enabled: wardId !== undefined && wardId > 0
  })
}
