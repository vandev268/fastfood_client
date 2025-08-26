import cartApis from '@/apis/cart'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'cart'

export const useCartItemsQuery = (query: PaginationQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: () => cartApis.list(query),
    placeholderData: keepPreviousData
  })
}

export const useAllCartItemsQuery = ({ enabled }: { enabled: boolean }) => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: cartApis.findAll,
    enabled,
    placeholderData: keepPreviousData
  })
}

export const useAddToCartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cartApis.addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useUpdateCartItemMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cartApis.updateCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useDeleteCartItemsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cartApis.deleteCartItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}
