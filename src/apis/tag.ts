import http from '@/lib/http'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'
import type {
  CreateTagBodyType,
  GetAllTagsResType,
  GetTagsResType,
  TagDetailType,
  TagType,
  UpdateTagBodyType
} from '@/schemaValidations/tag.schema'

const BASE_URL = '/tags'

const tagApis = {
  list(query: PaginationQueryType) {
    return http.get<GetTagsResType>(BASE_URL, {
      params: query
    })
  },

  findAll() {
    return http.get<GetAllTagsResType>(`${BASE_URL}/all`)
  },

  findDetail(tagId: number) {
    return http.get<TagDetailType>(`${BASE_URL}/${tagId}`)
  },

  create(body: CreateTagBodyType) {
    return http.post<TagType>(BASE_URL, body)
  },

  update(payload: { tagId: number; body: UpdateTagBodyType }) {
    const { tagId, body } = payload
    return http.put<TagType>(`${BASE_URL}/${tagId}`, body)
  },

  delete(tagId: number) {
    return http.delete<MessageResType>(`${BASE_URL}/${tagId}`)
  }
}

export default tagApis
