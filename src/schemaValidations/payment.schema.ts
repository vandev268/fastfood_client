import { PaymentMethod, PaymentStatus } from '@/constants/payment'
import { z } from 'zod'

export const PaymentSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.Pending),
  paidAt: z.date().nullable().default(null),
  transactionId: z.string().trim().default('')
})

export const GetPaymentLinkBodySchema = z
  .object({
    orderId: z.number()
  })
  .strict()

export const GetPaymentLinkResSchema = z.object({
  url: z.string()
})

export const VNPayPaymentCallbackQuerySchema = z.object({
  vnp_Amount: z.string(),
  vnp_BankCode: z.string(),
  vnp_BankTranNo: z.string(),
  vnp_CardType: z.string(),
  vnp_OrderInfo: z.string(),
  vnp_PayDate: z.string(),
  vnp_ResponseCode: z.string(),
  vnp_TmnCode: z.string(),
  vnp_TransactionNo: z.string(),
  vnp_TransactionStatus: z.string(),
  vnp_TxnRef: z.string(),
  vnp_SecureHash: z.string()
})

// export const MomoPaymentCallbackQuery1Schema = z.object({
//   message: z.string(),
//   data: z.object({
//     partnerCode: z.string(),
//     orderId: z.string(),
//     requestId: z.string(),
//     amount: z.string(),
//     orderInfo: z.string(),
//     orderType: z.string(),
//     transId: z.string(),
//     resultCode: z.string(),
//     message: z.string(),
//     payType: z.string(),
//     responseTime: z.string(),
//     extraData: z.string(),
//     signature: z.string()
//   })
// })

export const MomoPaymentCallbackQuerySchema = z.object({
  partnerCode: z.string(),
  orderId: z.string(),
  requestId: z.string(),
  amount: z.string(),
  orderInfo: z.string(),
  orderType: z.string(),
  transId: z.string(),
  resultCode: z.string(),
  message: z.string(),
  payType: z.string(),
  responseTime: z.string(),
  extraData: z.string(),
  signature: z.string()
})

export type PaymentType = z.infer<typeof PaymentSchema>
export type GetPaymentLinkBodyType = z.infer<typeof GetPaymentLinkBodySchema>
export type GetPaymentLinkResType = z.infer<typeof GetPaymentLinkResSchema>
export type VNPayPaymentCallbackQueryType = z.infer<typeof VNPayPaymentCallbackQuerySchema>
export type MomoPaymentCallbackQueryType = z.infer<typeof MomoPaymentCallbackQuerySchema>
