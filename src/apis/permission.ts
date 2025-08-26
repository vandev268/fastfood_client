import http from '@/lib/http'
import type {
  CreatePermissionBodyType,
  GetAllPermissionsResType,
  GetPermissionsResType,
  PermissionDetailType,
  PermissionType,
  UpdatePermissionBodyType
} from '@/schemaValidations/permission.schema'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'

const BASE_URL = '/permissions'

const permissionApis = {
  list(query: PaginationQueryType) {
    return http.get<GetPermissionsResType>(BASE_URL, {
      params: query
    })
  },

  findAll() {
    return http.get<GetAllPermissionsResType>(`${BASE_URL}/all`)
  },

  findDetail(permissionId: number) {
    return http.get<PermissionDetailType>(`${BASE_URL}/${permissionId}`)
  },

  create(body: CreatePermissionBodyType) {
    return http.post<PermissionType>(BASE_URL, body)
  },

  update(payload: { permissionId: number; body: UpdatePermissionBodyType }) {
    const { permissionId, body } = payload
    return http.put<PermissionType>(`${BASE_URL}/${permissionId}`, body)
  },

  delete(permissionId: number) {
    return http.delete<MessageResType>(`${BASE_URL}/${permissionId}`)
  }
}

export default permissionApis
