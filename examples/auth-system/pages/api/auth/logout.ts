import { NextApiRequest, NextApiResponse } from 'next'
import { authService } from '@/lib/services/auth'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'
import { withErrorHandler, withRequestLogging } from '@/lib/middleware/auth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    let refreshToken: string | undefined

    // 从请求体或Cookie获取refreshToken
    if (req.body.refreshToken) {
      refreshToken = req.body.refreshToken
    } else if (req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken
    }

    if (refreshToken) {
      await authService.logout(refreshToken)
    }

    // 清除 HTTP-only cookies
    res.setHeader('Set-Cookie', [
      'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
      'accessToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
    ])

    res.status(200).json({
      success: true,
      message: '登出成功'
    })

  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    throw error
  }
}

export default withErrorHandler(withRequestLogging(withAuth(handler)))