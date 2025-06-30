import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authService } from '@/lib/services/auth'
import { loginSchema } from '@/lib/validations/auth'
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
    const credentials = loginSchema.parse(req.body)

    // 获取设备信息
    const deviceInfo = {
      ipAddress: (req.headers['x-forwarded-for'] as string) || 
                  (req.headers['x-real-ip'] as string) || 
                  req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceInfo: req.headers['x-device-info'] as string
    }

    // 登录用户
    const result = await authService.login(credentials, deviceInfo)

    // 设置 HTTP-only cookie (可选)
    res.setHeader('Set-Cookie', [
      `refreshToken=${result.tokens.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
      `accessToken=${result.tokens.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60}`
    ])

    res.status(200).json({
      success: true,
      data: result,
      message: '登录成功'
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
      // 统一返回"邮箱或密码错误"，不暴露具体错误信息
      if (error.message.includes('邮箱或密码错误') || 
          error.message.includes('用户不存在')) {
        return res.status(401).json({
          success: false,
          error: '邮箱或密码错误'
        })
      }

      if (error.message.includes('账户')) {
        return res.status(403).json({
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