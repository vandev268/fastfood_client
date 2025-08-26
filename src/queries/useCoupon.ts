import couponApis from '@/apis/coupon'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'coupons'

export const useCouponsQuery = (query: PaginationQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: () => couponApis.list(query),
    placeholderData: keepPreviousData
  })
}

export const useAllCouponsQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: () => couponApis.findAll(),
    placeholderData: keepPreviousData
  })
}

export const useCouponDetailQuery = (couponId: number | undefined) => {
  return useQuery({
    queryKey: [BASE_KEY, couponId],
    queryFn: () => couponApis.findDetail(couponId as number),
    enabled: couponId !== undefined && couponId > 0
  })
}

export const useCreateCouponMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: couponApis.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useUpdateCouponMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: couponApis.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useChangeCouponStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: couponApis.changeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useDeleteCouponMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: couponApis.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}
