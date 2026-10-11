import type { FC } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'

import { register as registerApi } from '@/api/auth'
import { getErrorMessage } from '@/utils/error'

const { Text } = Typography

interface RegisterFormValues {
  username: string
  password: string
  confirmPassword: string
}

/**
 * 注册页（路由 `/register`）。
 *
 * 前端只做基础校验（必填 / 长度 / 两次密码一致），用于即时反馈、减少无效请求；
 * 用户名的唯一性、密码强度等最终校验以后端为准（见 docs/SECURITY.md 1.4）。
 * 密码同样只在提交请求时使用，注册成功后立即清空表单，不写入任何状态或 storage。
 */
const Register: FC = () => {
  const navigate = useNavigate()
  const [messageApi, contextHolder] = message.useMessage()
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [form] = Form.useForm<RegisterFormValues>()

  const handleFinish = async (values: RegisterFormValues): Promise<void> => {
    setSubmitting(true)
    try {
      const res = await registerApi({
        username: values.username.trim(),
        password: values.password,
      })

      if (!res || res.code !== 200) {
        throw new Error(res?.message || `注册失败：code=${res?.code}`)
      }

      // 注册接口不返回登录态，需要用户回到登录页换取 token
      form.resetFields()
      messageApi.success('注册成功，请登录')
      navigate('/login', { replace: true })
    } catch (error) {
      messageApi.error(getErrorMessage(error, '注册失败，请稍后重试'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      {contextHolder}
      <Card title="注册" style={{ width: '100%', maxWidth: 400 }}>
        <Form<RegisterFormValues>
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
              { min: 3, max: 20, message: '用户名需为 3~20 位' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="3~20 位用户名"
              autoComplete="username"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="至少 6 位密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_rule, value: string) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              注册
            </Button>
          </Form.Item>
        </Form>

        <Space size={4} style={{ width: '100%', justifyContent: 'center' }}>
          <Text type="secondary">已有账号？</Text>
          <Link to="/login">去登录</Link>
        </Space>
      </Card>
    </div>
  )
}

export default Register
