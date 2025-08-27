import http from '@/lib/http'
import {
  type AllDraftItemQueryType,
  type ChangeDraftItemStatusBodyType,
  type ChangeDraftItemTablesBodyType,
  type CreateDraftItemBodyType,
  type DeleteDraftItemsBodyType,
  type DraftItemQueryType,
  type GetAllDraftItemsResType,
  type GetDraftItemsResType,
  type UpdateDraftItemBodyType
} from '../schemaValidations/draft-item.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'

const BASE_URL = '/draft-items'

const draftItemApis = {
  list(query: DraftItemQueryType) {
    return http.get<GetDraftItemsResType>(BASE_URL, {
      params: query
    })
  },

  findAll(query: AllDraftItemQueryType) {
    return http.get<GetAllDraftItemsResType>(`${BASE_URL}/all`, {
      params: query
    })
  },

  create(body: CreateDraftItemBodyType) {
    return http.post<DraftItemQueryType>(`${BASE_URL}`, body)
  },

  update(payload: { draftItemId: number; body: UpdateDraftItemBodyType }) {
    const { draftItemId, body } = payload
    return http.put<MessageResType>(`${BASE_URL}/${draftItemId}`, body)
  },

  changeStatus(payload: { draftItemId: number; body: ChangeDraftItemStatusBodyType }) {
    const { draftItemId, body } = payload
    return http.patch<MessageResType>(`${BASE_URL}/${draftItemId}/status`, body)
  },

  changeTables(body: ChangeDraftItemTablesBodyType) {
    return http.patch<MessageResType>(`${BASE_URL}/change-tables`, body)
  },

  delete(draftItemId: number) {
    return http.delete<MessageResType>(`${BASE_URL}/${draftItemId}`)
  },

  deleteByDraftCode(body: DeleteDraftItemsBodyType) {
    return http.post<MessageResType>(`${BASE_URL}/deletes`, body)
  }
}

export default draftItemApis
