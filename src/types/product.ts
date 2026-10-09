/** 商品类型：新品 / 二手 / 以物换物 */
export type ProductType = 'NEW' | 'SECOND_HAND' | 'BARTER'

export interface Product {
  id: number
  name: string
  price: number
  type: ProductType
}
