import { NextApiRequest, NextApiResponse } from 'next'
import { authService } from '@/lib/services/auth'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'
import { withErrorHandler, withRequestLogging } from '@/lib/middleware/auth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        return await handleGetSessions(req, res)
      case 'DELETE':
        return await handleRevokeSession(req, res)
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        })
    }
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

async function handleGetSessions(req: AuthenticatedRequest, res: NextApiResponse) {
  const sessions = await authService.getUserSessions(req.user.id)
  
  // 格式化会话信息，隐藏敏感数据
  const formattedSessions = sessions.map(session => ({
    id: session.id,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    // 判断是否为当前会话（这里需要改进，可以通过比较refreshToken）
    isCurrent: false // 临时设置，实际需要比较当前请求的refreshToken
  }))

  res.status(200).json({
    success: true,
    data: formattedSessions
  })
}

async function handleRevokeSession(req: AuthenticatedRequest, res: NextApiResponse) {
  const { sessionId } = req.query

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      success: false,
      error: '会话ID不能为空'
    })
  }

  await authService.revokeSession(sessionId, req.user.id)

  res.status(200).json({
    success: true,
    message: '会话已撤销'
  })
}

export default withErrorHandler(withRequestLogging(withAuth(handler)))