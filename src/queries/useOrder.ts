import orderApis from '@/apis/order'
import type { OrderQueryType } from '@/schemaValidations/order.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'orders'

export const useOrdersQuery = (query: OrderQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: () => orderApis.list(query),
    placeholderData: keepPreviousData
  })
}

export const useAllOrdersQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: orderApis.findAll,
    placeholderData: keepPreviousData
  })
}

export const useOrderDetailQuery = (orderId: number | undefined) => {
  return useQuery({
    queryKey: [BASE_KEY, orderId],
    queryFn: () => orderApis.findDetail(orderId as number),
    enabled: orderId !== undefined && orderId > 0
  })
}

export const useCreateOnlineOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApis.createOnlineOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useCreateTakeAwayOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApis.createTakeAwayOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
      queryClient.invalidateQueries({ queryKey: ['draft-items'] })
    }
  })
}

export const useCreateDeliveryOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApis.createDeliveryOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
      queryClient.invalidateQueries({ queryKey: ['draft-items'] })
    }
  })
}

export const useCreateDineInOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApis.createDineInOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
      queryClient.invalidateQueries({ queryKey: ['draft-items'] })
    }
  })
}

export const useChangeOrderStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApis.changeOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}
