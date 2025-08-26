import http from '@/lib/http'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'
import type {
  ChangeTableStatusBodyType,
  CreateTableBodyType,
  GetAllTablesResType,
  GetTablesResType,
  TableDetailType,
  TableType,
  UpdateTableBodyType
} from '@/schemaValidations/table.schema'

const BASE_URL = '/tables'

const tableApis = {
  list(query: PaginationQueryType) {
    return http.get<GetTablesResType>(BASE_URL, {
      params: query
    })
  },

  findAll() {
    return http.get<GetAllTablesResType>(`${BASE_URL}/all`)
  },

  findDetail(tableId: number) {
    return http.get<TableDetailType>(`${BASE_URL}/${tableId}`)
  },

  create(body: CreateTableBodyType) {
    return http.post<TableType>(BASE_URL, body)
  },

  update(payload: { tableId: number; body: UpdateTableBodyType }) {
    const { tableId, body } = payload
    return http.put<TableType>(`${BASE_URL}/${tableId}`, body)
  },

  changeStatus(payload: { tableId: number; body: ChangeTableStatusBodyType }) {
    const { tableId, body } = payload
    return http.patch<MessageResType>(`${BASE_URL}/${tableId}/change-status`, body)
  },

  delete(tableId: number) {
    return http.delete<MessageResType>(`${BASE_URL}/${tableId}`)
  }
}

export default tableApis
