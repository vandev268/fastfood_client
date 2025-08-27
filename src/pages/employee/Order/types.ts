import type { OrderTypeType } from '@/constants/order'
import type { DraftItemDetailType } from '@/schemaValidations/draft-item.schema'
import type { TableType } from '@/schemaValidations/table.schema'

export type OrderItemType = {
  id: number
  productId: number
  variantId: number
  name: string
  variantValue: string
  price: number
  quantity: number
  thumbnail?: string | null
  draftItem: DraftItemDetailType
}

export type OrderTabType = {
  id: string
  tableId: number | string
  tableName: string
  items: OrderItemType[]
  isActive: boolean
  orderType: OrderTypeType
  reservationId?: number
}

export type TableInfoType = TableType
