import http from '@/lib/http'
import type { DistrictDetailType } from '@/schemaValidations/district.schema'
import type { GetAllProvincesResType, ProvinceDetailType } from '@/schemaValidations/province.schema'
import type { WardDetailType } from '@/schemaValidations/ward.schema'

const locationApis = {
  findProvinces() {
    return http.get<GetAllProvincesResType>('/provinces/all')
  },

  findProvinceDetail(provinceId: number) {
    return http.get<ProvinceDetailType>(`/provinces/${provinceId}`)
  },

  findDistrictDetail(districtId: number) {
    return http.get<DistrictDetailType>(`/districts/${districtId}`)
  },

  findWardDetail(wardId: number) {
    return http.get<WardDetailType>(`/wards/${wardId}`)
  }
}

export default locationApis
