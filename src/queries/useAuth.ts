import authApis from '@/apis/auth'
import { useMutation, useQuery } from '@tanstack/react-query'

export const useSendOTPMutation = () => {
  return useMutation({
    mutationFn: authApis.sendOTP
  })
}

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: authApis.register
  })
}
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: authApis.login
  })
}

export const useGetGoogleLinkQuery = () => {
  return useQuery({
    queryKey: ['google-link'],
    queryFn: authApis.getGoogleLink
  })
}

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: authApis.logout
  })
}

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: authApis.forgotPassword
  })
}
