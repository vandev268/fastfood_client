import http from '@/lib/http'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import type {
  ChangeReservationStatusBodyType,
  CreateReservationBodyType,
  GetAllReservationsResType,
  GetReservationsResType,
  ReservationDetailType,
  UpdateReservationBodyType
} from '@/schemaValidations/reservation.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'

const BASE_URL = '/reservations'

const reservationApis = {
  list(query: PaginationQueryType) {
    return http.get<GetReservationsResType>(`${BASE_URL}`, {
      params: query
    })
  },

  findAll() {
    return http.get<GetAllReservationsResType>(`${BASE_URL}/all`)
  },

  findDetail(reservationId: number) {
    return http.get<ReservationDetailType>(`${BASE_URL}/${reservationId}`)
  },

  create(data: CreateReservationBodyType) {
    return http.post<MessageResType>(`${BASE_URL}`, data)
  },

  update(payload: { reservationId: number; body: UpdateReservationBodyType }) {
    const { reservationId, body } = payload
    return http.put<MessageResType>(`${BASE_URL}/${reservationId}`, body)
  },

  changeStatus(payload: { reservationId: number; body: ChangeReservationStatusBodyType }) {
    const { reservationId, body } = payload
    return http.patch<MessageResType>(`${BASE_URL}/${reservationId}/change-status`, body)
  }
}

export default reservationApis
