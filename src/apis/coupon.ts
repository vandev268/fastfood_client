import http from '@/lib/http'
import type {
  ChangeCouponStatusBodyType,
  CouponDetailType,
  CouponType,
  CreateCouponBodyType,
  GetAllCouponsResType,
  GetCouponsResType,
  UpdateCouponBodyType
} from '@/schemaValidations/coupon.schema'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'

const BASE_URL = '/coupons'

const couponApis = {
  list(query: PaginationQueryType) {
    return http.get<GetCouponsResType>(BASE_URL, {
      params: query
    })
  },

  findAll() {
    return http.get<GetAllCouponsResType>(`${BASE_URL}/all`)
  },

  findDetail(couponId: number) {
    return http.get<CouponDetailType>(`${BASE_URL}/${couponId}`)
  },

  create(body: CreateCouponBodyType) {
    return http.post<CouponType>(BASE_URL, body)
  },

  update(payload: { couponId: number; body: UpdateCouponBodyType }) {
    const { couponId, body } = payload
    return http.put<CouponType>(`${BASE_URL}/${couponId}`, body)
  },

  changeStatus(payload: { couponId: number; body: ChangeCouponStatusBodyType }) {
    const { couponId, body } = payload
    return http.patch<MessageResType>(`${BASE_URL}/${couponId}/change-status`, body)
  },

  delete(couponId: number) {
    return http.delete<MessageResType>(`${BASE_URL}/${couponId}`)
  }
}

export default couponApis
