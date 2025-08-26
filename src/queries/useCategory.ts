import categoryApis from '@/apis/category'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'categories'

export const useCategoriesQuery = (query: PaginationQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: () => categoryApis.list(query),
    placeholderData: keepPreviousData
  })
}

export const useAllCategoriesQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: categoryApis.findAll,
    placeholderData: keepPreviousData
  })
}

export const useCategoryDetailQuery = (categoryId: number | undefined) => {
  return useQuery({
    queryKey: [BASE_KEY, categoryId],
    queryFn: () => categoryApis.findDetail(categoryId as number),
    enabled: categoryId !== undefined && categoryId > 0
  })
}

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoryApis.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoryApis.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoryApis.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}
