import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authService } from '@/lib/services/auth'
import { registerSchema } from '@/lib/validations/auth'
import { withErrorHandler, withRequestLogging } from '@/lib/middleware/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    // 验证请求数据
    const data = registerSchema.parse(req.body)

    // 注册用户
    const result = await authService.register(data)

    res.status(201).json({
      success: true,
      data: result,
      message: '注册成功，请查收验证邮件'
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
      if (error.message === '该邮箱已被注册') {
        return res.status(409).json({
          success: false,
          error: error.message
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

export default withErrorHandler(withRequestLogging(handler))