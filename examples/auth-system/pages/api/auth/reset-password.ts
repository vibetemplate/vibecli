import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authService } from '@/lib/services/auth'
import { passwordResetRequestSchema, passwordResetConfirmSchema } from '@/lib/validations/auth'
import { withErrorHandler, withRequestLogging } from '@/lib/middleware/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  try {
    switch (method) {
      case 'POST':
        return await handlePasswordResetRequest(req, res)
      case 'PUT':
        return await handlePasswordResetConfirm(req, res)
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        success: false,
        error: '数据验证失败',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    throw error
  }
}

async function handlePasswordResetRequest(req: NextApiRequest, res: NextApiResponse) {
  // 验证请求数据
  const { email } = passwordResetRequestSchema.parse(req.body)

  // 发送重置邮件
  await authService.requestPasswordReset(email)

  // 无论用户是否存在，都返回成功信息（安全考虑）
  res.status(200).json({
    success: true,
    message: '如果该邮箱存在，您将收到密码重置邮件'
  })
}

async function handlePasswordResetConfirm(req: NextApiRequest, res: NextApiResponse) {
  // 验证请求数据
  const { token, newPassword } = passwordResetConfirmSchema.parse(req.body)

  // 重置密码
  await authService.resetPassword(token, newPassword)

  res.status(200).json({
    success: true,
    message: '密码重置成功，请使用新密码登录'
  })
}

export default withErrorHandler(withRequestLogging(handler))