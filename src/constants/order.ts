export const OrderFee = {
  Delivery: 30000,
  TaxRate: 0.1
} as const

export const OrderType = {
  Delivery: 'Delivery',
  DineIn: 'DineIn',
  Takeaway: 'Takeaway'
} as const

export const OrderStatus = {
  All: 'All',
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Preparing: 'Preparing',
  Ready: 'Ready',
  OutForDelivery: 'OutForDelivery',
  Served: 'Served',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  CancelledByKitchen: 'CancelledByKitchen'
} as const

export const KitchenOrderStatus = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Preparing: 'Preparing',
  Ready: 'Ready',
  CancelledByKitchen: 'CancelledByKitchen'
}

export const OrderStatusValues = Object.values(OrderStatus)
export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus]

export const OrderTypeValues = Object.values(OrderType)
export type OrderTypeType = (typeof OrderType)[keyof typeof OrderType]

export const KitchenOrderStatusValues = Object.values(KitchenOrderStatus)
export type KitchenOrderStatusType = (typeof KitchenOrderStatus)[keyof typeof KitchenOrderStatus]
