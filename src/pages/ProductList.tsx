import { useCallback, useEffect, useState } from 'react'
import type { FC } from 'react'
import { message, Table, Typography } from 'antd'
import type { TableColumnsType } from 'antd'

import request from '@/api/request'
import type { Product, ProductType } from '@/types/product'

const { Title } = Typography

const TYPE_LABELS: Record<ProductType, string> = {
  NEW: '新品',
  SECOND_HAND: '二手',
  BARTER: '以物换物',
}

const columns: TableColumnsType<Product> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 100,
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '价格',
    dataIndex: 'price',
    key: 'price',
    width: 160,
    render: (price: number) => `¥ ${price.toFixed(2)}`,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 160,
    render: (type: ProductType) => TYPE_LABELS[type] ?? type,
  },
]

const ProductList: FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [messageApi, contextHolder] = message.useMessage()

  const fetchProducts = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      // 响应拦截器已直接返回 res.data，因此这里拿到的就是 Product[]
      const data = await request.get<Product[]>('/products')
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      messageApi.error(`商品列表加载失败：${detail}`)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [messageApi])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <Title level={3}>商品列表</Title>
      <Table<Product>
        rowKey="id"
        columns={columns}
        dataSource={products}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}

export default ProductList
