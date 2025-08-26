import paymentApis from '@/apis/payment'
import { useMutation } from '@tanstack/react-query'

export const useCreatePaymentLinkMutation = () => {
  return useMutation({
    mutationFn: paymentApis.createLink
  })
}
