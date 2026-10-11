import type { FC } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'

import { login as loginApi } from '@/api/auth'
import { useUserStore } from '@/store/useUserStore'
import { getErrorMessage } from '@/utils/error'

const { Text } = Typography

interface LoginFormValues {
  username: string
  password: string
}

/**
 * 登录页（路由 `/login`）。
 *
 * 安全约定（见 docs/SECURITY.md）：
 * - 密码只在提交请求时使用，成功后立即 `resetFields()` 清空表单，任何地方都不保存密码；
 * - token 由 `useUserStore.login()` 写入 localStorage，后续请求由 request.ts 拦截器自动携带；
 * - 登录成功与否最终由后端判定，这里的校验只是即时反馈。
 */
const Login: FC = () => {
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [form] = Form.useForm<LoginFormValues>()

  const handleFinish = async (values: LoginFormValues): Promise<void> => {
    setSubmitting(true)
    try {
      const res = await loginApi({
        username: values.username.trim(),
        password: values.password,
      })

      if (!res || res.code !== 200 || !res.data) {
        throw new Error(res?.message || `登录失败：code=${res?.code}`)
      }

      useUserStore.getState().login(res.data.user, res.data.token)
      // 提交完成后立刻清空表单状态，避免密码停留在组件内存中
      form.resetFields()
      messageApi.success('登录成功')
      navigate('/', { replace: true })
    } catch (error) {
      messageApi.error(getErrorMessage(error, '登录失败，请检查用户名和密码'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      {contextHolder}
      <Card title="登录" style={{ width: '100%', maxWidth: 400 }}>
        <Form<LoginFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          disabled={submitting}
          onFinish={handleFinish}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { whitespace: true, message: '用户名不能只有空格' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              autoComplete="username"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <Space size={4} style={{ width: '100%', justifyContent: 'center' }}>
          <Text type="secondary">没有账号？</Text>
          <Link to="/register">去注册</Link>
        </Space>
      </Card>
    </div>
  )
}

export default Login
