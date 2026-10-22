import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, InputNumber, Radio, Select, Space, Switch, Typography, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'

import { createItem } from '@/api/item'
import { useUserStore } from '@/store/useUserStore'
import type { CreateItemPayload, ItemCategory, ItemCondition, ItemMode } from '@/types/item'
import { getErrorMessage, getHttpStatus } from '@/utils/error'
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
  /** BARTER / BOTH 必填（至少一个） */
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

/** 选填文本：去掉首尾空格后为空就不传，避免把 `""` 写进库 */
function toOptionalText(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * 按交易模式清洗表单数据，得到 `POST /api/items` 的请求体。
 *
 * 三种模式对字段的要求不完全一样：
 * - `BARTER`（只换）：不卖钱 → **不传 `price`**；传 `wantCategories` 等换物偏好；
 * - `SALE`（只卖）：**不传换物偏好**（`wantCategories` / `wantDescription` / `allowPriceDiff`），
 *   只传 `price`；
 * - `BOTH`（都可）：价格与换物偏好都传。
 *
 * 为什么要「删字段」而不是传 `null` / `0`：后端按字段是否出现来判断业务含义，
 * 例如给纯换物物品带上 `price`，列表页就会把它显示成有售价。
 *
 * 另一个容易踩的点：antd `Form` 默认 `preserve: true`，被条件渲染隐藏的
 * `Form.Item` 的值**仍留在 form store 里**（用户先选 SALE 填了价格，再切回 BARTER，
 * `onFinish` 拿到的 `values.price` 依然存在）。所以必须在这里按 `mode` 显式剔除，
 * 不能把 `values` 原样提交。
 */
function buildCreatePayload(values: PublishFormValues): CreateItemPayload {
  const payload: CreateItemPayload = {
    title: values.title.trim(),
    description: toOptionalText(values.description),
    category: values.category,
    condition: values.condition,
    mode: values.mode,
  }

  // 价格：只有 SALE / BOTH 才带。后端对这两种模式强制要求 price > 0（前端 rules 已先拦一次）。
  if (values.mode === 'SALE' || values.mode === 'BOTH') {
    payload.price = values.price
  }

  // 换物偏好：只有 BARTER / BOTH 才带。SALE 模式下即使 form store 里还有残留值也不提交。
  if (values.mode === 'BARTER' || values.mode === 'BOTH') {
    payload.wantCategories = values.wantCategories?.length ? [...values.wantCategories] : undefined
    payload.wantDescription = toOptionalText(values.wantDescription)
    payload.allowPriceDiff = Boolean(values.allowPriceDiff)
  }

  return payload
}

/**
 * 发布物品页。
 *
 * 提交链路：`Form` 校验通过 → `buildCreatePayload` 按 mode 清洗 → `createItem`
 * （`POST /api/items`）→ 成功后跳 `/items/{新物品 id}`。
 *
 * 登录约定（与 `BarterApply` 一致）：
 * - 进入页面先幂等调用一次 `useUserStore.getState().init()`，避免 `App.tsx` 的 effect
 *   尚未执行时把已登录用户误判为未登录（子组件 effect 先于父组件执行）；
 * - 未登录只做提示 + 跳 `/login`，真正是否允许发布仍由后端按 token 判定（401）。
 */
const PublishItem: FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm<PublishFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const [submitting, setSubmitting] = useState<boolean>(false)
  // 登录态检查完成前不渲染表单，避免未登录用户看到可填的表单又被打断
  const [loginChecked, setLoginChecked] = useState<boolean>(false)

  // 监听模式，用于条件显示价格 / 换物诉求字段
  const mode = Form.useWatch('mode', form) ?? DEFAULT_MODE
  const needPrice = mode === 'SALE' || mode === 'BOTH'
  const needWant = mode === 'BARTER' || mode === 'BOTH'

  // 登录守卫：刷新本页时 store 里的 user 可能还没恢复，先 init() 再判断
  useEffect(() => {
    useUserStore.getState().init()

    if (!useUserStore.getState().user) {
      messageApi.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }

    setLoginChecked(true)
  }, [messageApi, navigate])

  /**
   * 提交发布。
   *
   * 前端校验只是体验优化，后端仍会独立校验全部入参（见 docs/SECURITY.md 1.4）；
   * 失败原因（400 参数 / 401 未登录）一律用 `getErrorMessage` 展示后端 message。
   */
  const handleFinish = async (values: PublishFormValues): Promise<void> => {
    // 提交时再确认一次登录态：可能在页面停留期间被 401 清掉（例如另一个标签页 token 过期）
    if (!useUserStore.getState().user) {
      messageApi.warning('请先登录')
      navigate('/login', { replace: true })
      return
    }

    setSubmitting(true)
    try {
      const res = await createItem(buildCreatePayload(values))

      if (!res || res.code !== 200 || !res.data) {
        throw new Error(res?.message || `发布失败：code=${res?.code}`)
      }

      messageApi.success('发布成功')
      // 用后端返回的新 id 跳详情页，不在前端猜 id
      navigate(`/items/${res.data.id}`)
    } catch (error) {
      if (getHttpStatus(error) === 401) {
        messageApi.warning('请先登录')
        navigate('/login', { replace: true })
        return
      }

      messageApi.error(getErrorMessage(error, '发布失败，请稍后重试'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!loginChecked) {
    // 仍要渲染 contextHolder，否则上面的「请先登录」提示不会显示
    return <>{contextHolder}</>
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}

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
          disabled={submitting}
          onFinish={handleFinish}
          style={{ maxWidth: 640 }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[
              { required: true, message: '请填写标题' },
              { whitespace: true, message: '标题不能只有空格' },
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

          <Form.Item name="description" label="描述" rules={[{ max: 500, message: '描述最多 500 个字' }]}>
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
              rules={[
                { required: true, message: '请填写价格' },
                { type: 'number', min: 0.01, message: '价格必须大于 0' },
                { type: 'number', max: 9999999, message: '价格超出合理范围' },
              ]}
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
              <Form.Item
                name="wantCategories"
                label="想换什么分类"
                rules={[
                  { required: true, type: 'array', min: 1, message: '请至少选择一个想换的分类' },
                ]}
              >
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="想换的分类（至少一个，可多选）"
                  options={CATEGORY_OPTIONS}
                />
              </Form.Item>

              <Form.Item
                name="wantDescription"
                label="想换什么补充说明"
                rules={[{ max: 200, message: '补充说明最多 200 个字' }]}
              >
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
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting}>
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
