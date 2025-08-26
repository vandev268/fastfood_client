export const DraftItemStatus = {
  Pending: 'Pending',
  Preparing: 'Preparing',
  Ready: 'Ready',
  Served: 'Served'
} as const

export type DraftItemStatusType = (typeof DraftItemStatus)[keyof typeof DraftItemStatus]
export const DraftItemStatusValues = Object.values(DraftItemStatus)
