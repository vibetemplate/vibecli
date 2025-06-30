import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authService } from '@/lib/services/auth'
import { profileUpdateSchema } from '@/lib/validations/auth'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'
import { withErrorHandler, withRequestLogging } from '@/lib/middleware/auth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        return await handleGetProfile(req, res)
      case 'PUT':
        return await handleUpdateProfile(req, res)
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

async function handleGetProfile(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = await authService.getUserById(req.user.id)
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    })
  }

  res.status(200).json({
    success: true,
    data: user
  })
}

async function handleUpdateProfile(req: AuthenticatedRequest, res: NextApiResponse) {
  // 验证请求数据
  const data = profileUpdateSchema.parse(req.body)

  // 更新用户资料
  const updatedUser = await authService.updateProfile(req.user.id, data)

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: '资料更新成功'
  })
}

export default withErrorHandler(withRequestLogging(withAuth(handler)))