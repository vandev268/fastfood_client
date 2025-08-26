import http from '@/lib/http'
import type { MessageResType } from '@/schemaValidations/response.schema'
import type {
  CreateReviewBodyType,
  GetReviewDetailQueryType,
  GetReviewsQueryType,
  GetReviewsResType,
  ReviewDetailType,
  ReviewType,
  UpdateReviewBodyType
} from '@/schemaValidations/review.schema'

const BASE_URL = '/reviews'

const reviewApis = {
  list: (query: GetReviewsQueryType) => {
    return http.get<GetReviewsResType>(`${BASE_URL}/list`, {
      params: query
    })
  },

  findDetailByProductAndOrder(query: GetReviewDetailQueryType) {
    return http.get<ReviewDetailType>(BASE_URL, {
      params: query
    })
  },

  findDetailById(reviewId: number) {
    return http.get<ReviewDetailType>(`${BASE_URL}/${reviewId}`)
  },

  create(data: CreateReviewBodyType) {
    return http.post<ReviewType>(BASE_URL, data)
  },

  update(payload: { reviewId: number; body: UpdateReviewBodyType }) {
    const { reviewId, body } = payload
    return http.put<ReviewType>(`${BASE_URL}/${reviewId}`, body)
  },

  delete(reviewId: number) {
    return http.delete<MessageResType>(`${BASE_URL}/${reviewId}`)
  }
}

export default reviewApis
