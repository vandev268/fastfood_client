export const PaymentStatus = {
  Pending: 'Pending',
  Succeeded: 'Succeeded',
  Failed: 'Failed',
  Refunded: 'Refunded'
} as const

export const PaymentMethod = {
  Cash: 'Cash',
  MOMO: 'MOMO',
  VNPay: 'VNPay',
  COD: 'COD'
} as const

export const PaymentMethodValues = Object.values(PaymentMethod)
export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod]
