import tagApis from '@/apis/tag'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'tags'

export const useTagsQuery = (query: PaginationQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: () => tagApis.list(query),
    placeholderData: keepPreviousData
  })
}

export const useAllTagsQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: tagApis.findAll,
    placeholderData: keepPreviousData
  })
}

export const useTagDetailQuery = (tagId: number | undefined) => {
  return useQuery({
    queryKey: [BASE_KEY, tagId],
    queryFn: () => tagApis.findDetail(tagId as number),
    enabled: tagId !== undefined && tagId > 0
  })
}

export const useCreateTagMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: tagApis.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useUpdateTagMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: tagApis.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: tagApis.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}
