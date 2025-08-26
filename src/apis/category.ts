import http from '@/lib/http'
import type {
  CategoryDetailType,
  CategoryType,
  CreateCategoryBodyType,
  GetAllCategoriesResType,
  GetCategoriesResType,
  UpdateCategoryBodyType
} from '@/schemaValidations/category.schema'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'

const BASE_URL = '/categories'

const categoryApis = {
  list(query: PaginationQueryType) {
    return http.get<GetCategoriesResType>(BASE_URL, {
      params: query
    })
  },

  findAll() {
    return http.get<GetAllCategoriesResType>(`${BASE_URL}/all`)
  },

  findDetail(categoryId: number) {
    return http.get<CategoryDetailType>(`${BASE_URL}/${categoryId}`)
  },

  create(body: CreateCategoryBodyType) {
    return http.post<CategoryType>(BASE_URL, body)
  },

  update(payload: { categoryId: number; body: UpdateCategoryBodyType }) {
    const { categoryId, body } = payload
    return http.put<CategoryType>(`${BASE_URL}/${categoryId}`, body)
  },

  delete(categoryId: number) {
    return http.delete<MessageResType>(`${BASE_URL}/${categoryId}`)
  }
}

export default categoryApis
