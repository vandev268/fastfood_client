export const TypeProduct = {
  Single: 'Single',
  FixedCombo: 'FixedCombo',
  CustomCombo: 'CustomCombo'
} as const

export type TypeProductType = (typeof TypeProduct)[keyof typeof TypeProduct]
export const TypeProductValues = Object.values(TypeProduct)

export const ProductStatus = {
  Pending: 'Pending',
  Available: 'Available',
  OutOfStock: 'OutOfStock',
  Hidden: 'Hidden'
} as const

export type ProductStatusType = (typeof ProductStatus)[keyof typeof ProductStatus]
export const ProductStatusValues = Object.values(ProductStatus)
