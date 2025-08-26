import reservationApis from '@/apis/reservation'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'reservations'

export const useReservationsQuery = (query: PaginationQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY, query],
    queryFn: () => reservationApis.list(query),
    placeholderData: keepPreviousData
  })
}

export const useAllReservationsQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY, 'all'],
    queryFn: reservationApis.findAll,
    placeholderData: keepPreviousData
  })
}

export const useReservationDetailQuery = (reservationId: number | undefined) => {
  return useQuery({
    queryKey: [BASE_KEY, reservationId],
    queryFn: () => reservationApis.findDetail(reservationId as number),
    enabled: reservationId !== undefined && reservationId > 0
  })
}

export const useCreateReservationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reservationApis.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}

export const useUpdateReservationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reservationApis.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}

export const useChangeReservationStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reservationApis.changeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY] })
    }
  })
}
