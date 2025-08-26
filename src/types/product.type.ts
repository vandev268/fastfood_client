export interface ProductVariant {
  id: string
  name: string
  attributes: { [key: string]: string }
  price: number
  stock: number
}

export interface ProductVariantForm {
  options: Array<{
    id: string
    name: string
    values: string[]
  }>
  variants: Omit<ProductVariant, 'id'>[]
}
