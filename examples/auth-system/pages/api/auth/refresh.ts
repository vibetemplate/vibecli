import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authService } from '@/lib/services/auth'
import { refreshTokenSchema } from '@/lib/validations/auth'
import { withErrorHandler, withRequestLogging } from '@/lib/middleware/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    let refreshToken: string

    // 从请求体或Cookie获取refreshToken
    if (req.body.refreshToken) {
      const data = refreshTokenSchema.parse(req.body)
      refreshToken = data.refreshToken
    } else if (req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken
    } else {
      return res.status(401).json({
        success: false,
        error: '未提供刷新令牌'
      })
    }

    // 刷新令牌
    const tokens = await authService.refreshTokens(refreshToken)

    // 更新 HTTP-only cookies
    res.setHeader('Set-Cookie', [
      `refreshToken=${tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
      `accessToken=${tokens.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60}`
    ])

    res.status(200).json({
      success: true,
      data: tokens,
      message: '令牌刷新成功'
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
        return res.status(401).json({
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