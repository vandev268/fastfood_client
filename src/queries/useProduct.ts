import productApis from '@/apis/product'
import type { ProductQueryType } from '@/schemaValidations/product.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'products'

export const useProductsQuery = (query: ProductQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: () => productApis.list(query),
    placeholderData: keepPreviousData
  })
}

export const useAllProductsQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: productApis.findAll,
    placeholderData: keepPreviousData
  })
}

export const useProductDetailQuery = (productId: number | undefined) => {
  return useQuery({
    queryKey: [BASE_KEY, 'detail', productId],
    queryFn: () => productApis.findDetail(productId as number),
    enabled: productId !== undefined && productId > 0
  })
}

export const useProductVariantsQuery = (productId: number | undefined) => {
  return useQuery({
    queryKey: [BASE_KEY, 'variants', productId],
    queryFn: () => productApis.findVariants(productId as number),
    enabled: productId !== undefined && productId > 0
  })
}

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productApis.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productApis.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}

export const useChangeProductStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productApis.changeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productApis.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}
