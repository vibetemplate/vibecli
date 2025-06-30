import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authService } from '@/lib/services/auth'
import { changePasswordSchema } from '@/lib/validations/auth'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'
import { withErrorHandler, withRequestLogging } from '@/lib/middleware/auth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    // 验证请求数据
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

    // 修改密码
    await authService.changePassword(req.user.id, currentPassword, newPassword)

    res.status(200).json({
      success: true,
      message: '密码修改成功'
    })

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
      if (error.message.includes('当前密码错误')) {
        return res.status(400).json({
          success: false,
          error: '当前密码错误'
        })
      }

      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    throw error
  }
}

export default withErrorHandler(withRequestLogging(withAuth(handler)))