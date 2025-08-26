import http from '@/lib/http'
import type {
  ChangeProfilePasswordBodyType,
  ProfileDetailType,
  ProfileType,
  UpdateProfileBodyType
} from '@/schemaValidations/profile.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'

const BASE_URL = '/profile'

const profileApis = {
  find() {
    return http.get<ProfileType>(BASE_URL)
  },

  findWithOrders() {
    return http.get<ProfileDetailType>(`${BASE_URL}/orders`)
  },

  update(body: UpdateProfileBodyType) {
    return http.put<ProfileType>(BASE_URL, body)
  },

  changePassword(body: ChangeProfilePasswordBodyType) {
    return http.patch<MessageResType>(`${BASE_URL}/change-password`, body)
  }
}

export default profileApis
