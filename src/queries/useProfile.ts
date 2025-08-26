import profileApis from '@/apis/profile'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const BASE_KEY = 'profile'

export const useProfileQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY],
    queryFn: profileApis.find,
    placeholderData: keepPreviousData
  })
}

export const useProfileOrdersQuery = () => {
  return useQuery({
    queryKey: [BASE_KEY, 'profile-orders'],
    queryFn: profileApis.findWithOrders,
    placeholderData: keepPreviousData
  })
}

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApis.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}

export const useChangeProfilePasswordMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileApis.changePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BASE_KEY], exact: true })
    }
  })
}
