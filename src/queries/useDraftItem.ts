import draftItemApis from '@/apis/draft-item'
import type { AllDraftItemQueryType, DraftItemQueryType } from '@/schemaValidations/draft-item.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'draft-items'

export const useDraftItemsQuery = (query: DraftItemQueryType) => {
  const { draftCode, tableId } = query
  return useQuery({
    queryKey: [BASE_KEY, query],
    queryFn: () => draftItemApis.list(query),
    enabled: draftCode !== undefined || tableId !== undefined,
    placeholderData: keepPreviousData
  })
}

export const useAllDraftItemsQuery = (query: AllDraftItemQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY, query],
    queryFn: () => draftItemApis.findAll(query),
    placeholderData: keepPreviousData
  })
}

export const useAddDraftItemToOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: draftItemApis.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}

export const useUpdateDraftItemMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: draftItemApis.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}

export const useChangeDraftItemStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: draftItemApis.changeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}

export const useChangeDraftItemTablesMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: draftItemApis.changeTables,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}

export const useDeleteDraftItemMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: draftItemApis.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}

export const useDeleteDraftItemsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: draftItemApis.deleteByDraftCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}
