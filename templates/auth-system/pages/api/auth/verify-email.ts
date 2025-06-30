import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authService } from '@/lib/services/auth'
import { withErrorHandler, withRequestLogging } from '@/lib/middleware/auth'

const verifyEmailSchema = z.object({
  token: z.string().min(1, '验证令牌不能为空')
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    // 验证请求数据
    const { token } = verifyEmailSchema.parse(req.body)

    // 验证邮箱
    await authService.verifyEmail(token)

    res.status(200).json({
      success: true,
      message: '邮箱验证成功'
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
      if (error.message.includes('无效') || error.message.includes('过期')) {
        return res.status(400).json({
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