import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/middleware/auth'
import { postService } from '@/lib/services/post'
import { updatePostSchema } from '@/lib/validations/post'
import { ApiResponse } from '@/types/api'

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: '文章ID无效'
    })
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetPost(req, res, id)
      case 'PUT':
        return handleUpdatePost(req, res, id)
      case 'DELETE':
        return handleDeletePost(req, res, id)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`
        })
    }
  } catch (error) {
    console.error('Post API error:', error)
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
}

// GET /api/posts/[id] - 获取单个文章
async function handleGetPost(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { includeDeleted = 'false', includeRelations = 'true' } = req.query

    const post = await postService.getPostById(id, {
      includeDeleted: includeDeleted === 'true',
      includeRelations: includeRelations === 'true'
    })

    if (!post) {
      return res.status(404).json({
        success: false,
        error: '文章不存在'
      })
    }

    return res.status(200).json({
      success: true,
      data: post,
      message: '获取文章成功'
    })

  } catch (error) {
    console.error('Get post error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取文章失败'
    })
  }
}

// PUT /api/posts/[id] - 更新文章
async function handleUpdatePost(req: any, res: NextApiResponse, id: string) {
  try {
    // 验证请求体
    const bodyValidation = updatePostSchema.safeParse(req.body)
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        error: '数据格式错误',
        details: bodyValidation.error.format()
      })
    }

    const updateData = bodyValidation.data
    const userId = req.user.id
    const userRole = req.user.role

    // 检查文章是否存在
    const existingPost = await postService.getPostById(id)
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: '文章不存在'
      })
    }

    // 权限检查：只有作者、管理员或版主可以更新
    const canUpdate = 
      existingPost.authorId === userId ||
      userRole === 'ADMIN' ||
      userRole === 'MODERATOR'

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: '无权限更新此文章'
      })
    }

    // 更新文章
    const updatedPost = await postService.updatePost(id, {
      ...updateData,
      updatedBy: userId
    })

    return res.status(200).json({
      success: true,
      data: updatedPost,
      message: '文章更新成功'
    })

  } catch (error) {
    console.error('Update post error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('P2025')) {
        return res.status(404).json({
          success: false,
          error: '文章不存在或已被删除'
        })
      }
      
      if (error.message.includes('P2002')) {
        return res.status(409).json({
          success: false,
          error: '文章标题或URL已存在'
        })
      }
      
      if (error.message.includes('P2034')) {
        return res.status(409).json({
          success: false,
          error: '数据已被其他用户修改，请刷新后重试'
        })
      }
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '更新文章失败'
    })
  }
}

// DELETE /api/posts/[id] - 删除文章
async function handleDeletePost(req: any, res: NextApiResponse, id: string) {
  try {
    const { force = 'false' } = req.query
    const userId = req.user.id
    const userRole = req.user.role
    const isForceDelete = force === 'true'

    // 检查文章是否存在
    const existingPost = await postService.getPostById(id, { includeDeleted: true })
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: '文章不存在'
      })
    }

    // 权限检查
    const canDelete = 
      existingPost.authorId === userId ||
      userRole === 'ADMIN' ||
      userRole === 'MODERATOR'

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: '无权限删除此文章'
      })
    }

    // 强制删除需要管理员权限
    if (isForceDelete && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: '只有管理员可以永久删除文章'
      })
    }

    let result
    if (isForceDelete) {
      // 永久删除
      result = await postService.deletePost(id, { force: true })
      return res.status(200).json({
        success: true,
        data: result,
        message: '文章已永久删除'
      })
    } else {
      // 软删除
      result = await postService.deletePost(id, { force: false })
      return res.status(200).json({
        success: true,
        data: result,
        message: '文章已删除'
      })
    }

  } catch (error) {
    console.error('Delete post error:', error)
    
    if (error instanceof Error && error.message.includes('P2025')) {
      return res.status(404).json({
        success: false,
        error: '文章不存在或已被删除'
      })
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除文章失败'
    })
  }
}

export default withAuth(handler)