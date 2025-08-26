import http from '@/lib/http'
import type { GetPaymentLinkBodyType, GetPaymentLinkResType } from '@/schemaValidations/payment.schema'

const BASE_URL = '/payment'

const paymentApis = {
  createLink(body: GetPaymentLinkBodyType) {
    return http.post<GetPaymentLinkResType>(`${BASE_URL}/create-link`, body)
  },

  createDineInPayment(body: {
    draftOrderId: string
    paymentMethod: 'CASH' | 'MOMO' | 'VNPAY'
    amount: number
    customerPaid?: number
  }) {
    return http.post<{
      message: string
      data?: { paymentId: string; remainingAmount: number }
    }>(`${BASE_URL}/dine-in/create`, body)
  },

  completeDineInOrder(body: { draftOrderId: string; tableNumber: number }) {
    return http.post<{
      message: string
      data?: { orderId: number }
    }>(`${BASE_URL}/dine-in/complete`, body)
  }
}
export default paymentApis
