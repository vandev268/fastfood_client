import http from '@/lib/http'
import type {
  AddressDetailType,
  AddressType,
  ChangeAddressDefaultBodyType,
  CreateAddressBodyType,
  GetAddressesResType,
  GetAllAddressesResType,
  UpdateAddressBodyType
} from '@/schemaValidations/address.schema'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'

const BASE_URL = '/addresses'

const addressApis = {
  list(query: PaginationQueryType) {
    return http.get<GetAddressesResType>(BASE_URL, {
      params: query
    })
  },

  findAll() {
    return http.get<GetAllAddressesResType>(`${BASE_URL}/all`)
  },

  findDetail(addressId: number) {
    return http.get<AddressDetailType>(`${BASE_URL}/${addressId}`)
  },

  create(body: CreateAddressBodyType) {
    return http.post<AddressType>(BASE_URL, body)
  },

  update(payload: { addressId: number; body: UpdateAddressBodyType }) {
    const { addressId, body } = payload
    return http.put<AddressType>(`${BASE_URL}/${addressId}`, body)
  },

  changeDefault(payload: { addressId: number; body: ChangeAddressDefaultBodyType }) {
    const { addressId, body } = payload
    return http.patch<MessageResType>(`${BASE_URL}/${addressId}`, body)
  },

  delete(addressId: number) {
    return http.delete<MessageResType>(`${BASE_URL}/${addressId}`)
  }
}

export default addressApis
