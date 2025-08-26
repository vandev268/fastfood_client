import http from '@/lib/http'
import type {
  CartItemType,
  CreateCartItemBodyType,
  DeleteCartItemsBodyType,
  GetAllCartItemsResType,
  GetCartItemsResType,
  UpdateCartItemBodyType
} from '@/schemaValidations/cart.schema'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'

const BASE_URL = '/cart'

const cartApis = {
  list(query: PaginationQueryType) {
    return http.get<GetCartItemsResType>(BASE_URL, { params: query })
  },

  findAll() {
    return http.get<GetAllCartItemsResType>(`${BASE_URL}/all`)
  },

  addToCart(body: CreateCartItemBodyType) {
    return http.post<CartItemType>(BASE_URL, body)
  },

  updateCartItem(payload: { cartItemId: number; body: UpdateCartItemBodyType }) {
    const { cartItemId, body } = payload
    return http.put<MessageResType>(`${BASE_URL}/${cartItemId}`, body)
  },

  deleteCartItems(body: DeleteCartItemsBodyType) {
    return http.post<MessageResType>(`${BASE_URL}/delete-items`, body)
  }
}

export default cartApis
