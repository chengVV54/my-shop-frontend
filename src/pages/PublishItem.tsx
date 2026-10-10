import type { FC } from 'react'
import { Button, Card, Form, Input, InputNumber, Radio, Select, Space, Switch, Typography } from 'antd'
import { SendOutlined } from '@ant-design/icons'

import type { ItemCategory, ItemCondition, ItemMode } from '@/types/item'
import { ITEM_CATEGORIES, ITEM_CONDITIONS, getCategoryLabel, getConditionLabel } from '@/utils/item'

const { Title, Text } = Typography
const { TextArea } = Input

/** 表单字段结构 */
interface PublishFormValues {
  title: string
  category: ItemCategory
  condition: ItemCondition
  description?: string
  mode: ItemMode
  /** SALE / BOTH 必填 */
  price?: number
  /** BARTER / BOTH 选填 */
  wantCategories?: ItemCategory[]
  wantDescription?: string
  allowPriceDiff?: boolean
}

const CATEGORY_OPTIONS = ITEM_CATEGORIES.map((category) => ({
  label: getCategoryLabel(category),
  value: category,
}))

const CONDITION_OPTIONS = ITEM_CONDITIONS.map((condition) => ({
  label: getConditionLabel(condition),
  value: condition,
}))

const MODE_OPTIONS: { label: string; value: ItemMode }[] = [
  { label: '换物', value: 'BARTER' },
  { label: '二手', value: 'SALE' },
  { label: '都可以', value: 'BOTH' },
]

const DEFAULT_MODE: ItemMode = 'BARTER'

/**
 * 发布物品页。
 *
 * 提交逻辑尚未对接后端，仅在控制台打印表单值。
 */
const PublishItem: FC = () => {
  const [form] = Form.useForm<PublishFormValues>()

  // 监听模式，用于条件显示价格 / 换物诉求字段
  const mode = Form.useWatch('mode', form) ?? DEFAULT_MODE
  const needPrice = mode === 'SALE' || mode === 'BOTH'
  const needWant = mode === 'BARTER' || mode === 'BOTH'

  const handleFinish = (values: PublishFormValues): void => {
    console.log('TODO: 提交发布', values)
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          发布闲置
        </Title>
        <Text type="secondary">换物为主，二手为辅。信息填得越清楚，越容易被换走。</Text>
      </div>

      <Card styles={{ body: { padding: 24 } }}>
        <Form<PublishFormValues>
          form={form}
          layout="vertical"
          initialValues={{ mode: DEFAULT_MODE, allowPriceDiff: false }}
          onFinish={handleFinish}
          style={{ maxWidth: 640 }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[
              { required: true, message: '请填写标题' },
              { max: 60, message: '标题最多 60 个字' },
            ]}
          >
            <Input placeholder="例如：九成新 Sony A7M3 机身，想换镜头" allowClear />
          </Form.Item>

          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="请选择分类" options={CATEGORY_OPTIONS} />
          </Form.Item>

          <Form.Item name="condition" label="成色" rules={[{ required: true, message: '请选择成色' }]}>
            <Select placeholder="请选择成色" options={CONDITION_OPTIONS} />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea
              rows={4}
              maxLength={500}
              showCount
              placeholder="补充物品的来源、使用情况、瑕疵等（选填）"
            />
          </Form.Item>

          <Form.Item name="mode" label="模式" rules={[{ required: true, message: '请选择模式' }]}>
            <Radio.Group options={MODE_OPTIONS} optionType="button" buttonStyle="solid" />
          </Form.Item>

          {needPrice && (
            <Form.Item
              name="price"
              label="价格"
              rules={[{ required: true, message: '请填写价格' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: 200 }}
                addonBefore="¥"
                placeholder="请输入价格"
              />
            </Form.Item>
          )}

          {needWant && (
            <>
              <Form.Item name="wantCategories" label="想换什么分类">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="想换的分类（选填，可多选）"
                  options={CATEGORY_OPTIONS}
                />
              </Form.Item>

              <Form.Item name="wantDescription" label="想换什么补充说明">
                <TextArea rows={3} maxLength={200} showCount placeholder="例如：优先换定焦镜头（选填）" />
              </Form.Item>

              <Form.Item
                name="allowPriceDiff"
                label="是否接受补差价"
                valuePropName="checked"
                style={{ marginBottom: 24 }}
              >
                <Switch checkedChildren="接受" unCheckedChildren="不接受" />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                提交发布
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  )
}

export default PublishItem
