import addressApis from '@/apis/address'
import type { PaginationQueryType } from '@/schemaValidations/request.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'addresses'

export const useAddressesQuery = (query: PaginationQueryType) => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: () => addressApis.list(query),
    placeholderData: keepPreviousData
  })
}

export const useAllAddressesQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: addressApis.findAll,
    placeholderData: keepPreviousData
  })
}

export const useAddressDetailQuery = (addressId: number | undefined) => {
  return useQuery({
    queryKey: [BASE_KEY, addressId],
    queryFn: () => addressApis.findDetail(addressId as number),
    enabled: addressId !== undefined && addressId > 0
  })
}

export const useCreateAddressMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addressApis.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useUpdateAddressMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addressApis.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useChangeAddressDefaultMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addressApis.changeDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useDeleteAddressMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addressApis.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}
