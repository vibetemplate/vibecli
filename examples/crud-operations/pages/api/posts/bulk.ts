import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/middleware/auth'
import { postService } from '@/lib/services/post'
import { bulkPostOperationSchema } from '@/lib/validations/post'
import { ApiResponse } from '@/types/api'

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    })
  }

  try {
    return handleBulkOperation(req, res)
  } catch (error) {
    console.error('Bulk posts API error:', error)
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
}

// POST /api/posts/bulk - 批量操作文章
async function handleBulkOperation(req: any, res: NextApiResponse) {
  try {
    // 验证请求体
    const bodyValidation = bulkPostOperationSchema.safeParse(req.body)
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        error: '数据格式错误',
        details: bodyValidation.error.format()
      })
    }

    const { operation, postIds, data } = bodyValidation.data
    const userId = req.user.id
    const userRole = req.user.role

    // 验证文章ID数组
    if (!postIds || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请选择要操作的文章'
      })
    }

    if (postIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: '一次最多只能操作100篇文章'
      })
    }

    let result
    let message = ''

    switch (operation) {
      case 'delete':
        // 批量删除（软删除）
        result = await postService.bulkDeletePosts({
          postIds,
          userId,
          userRole,
          force: data?.force || false
        })
        message = `成功删除 ${result.count} 篇文章`
        break

      case 'publish':
        // 批量发布
        result = await postService.bulkUpdatePosts({
          postIds,
          userId,
          userRole,
          updateData: { status: 'PUBLISHED', publishedAt: new Date() }
        })
        message = `成功发布 ${result.count} 篇文章`
        break

      case 'draft':
        // 批量设为草稿
        result = await postService.bulkUpdatePosts({
          postIds,
          userId,
          userRole,
          updateData: { status: 'DRAFT', publishedAt: null }
        })
        message = `成功设置 ${result.count} 篇文章为草稿`
        break

      case 'archive':
        // 批量归档
        result = await postService.bulkUpdatePosts({
          postIds,
          userId,
          userRole,
          updateData: { status: 'ARCHIVED' }
        })
        message = `成功归档 ${result.count} 篇文章`
        break

      case 'category':
        // 批量更新分类
        if (!data?.category) {
          return res.status(400).json({
            success: false,
            error: '请指定分类'
          })
        }
        result = await postService.bulkUpdatePosts({
          postIds,
          userId,
          userRole,
          updateData: { category: data.category }
        })
        message = `成功更新 ${result.count} 篇文章的分类`
        break

      case 'tags':
        // 批量更新标签
        if (!data?.tags || !Array.isArray(data.tags)) {
          return res.status(400).json({
            success: false,
            error: '请指定标签'
          })
        }
        result = await postService.bulkUpdatePostTags({
          postIds,
          userId,
          userRole,
          tags: data.tags,
          mode: data.tagMode || 'replace' // replace, add, remove
        })
        message = `成功更新 ${result.count} 篇文章的标签`
        break

      case 'restore':
        // 批量恢复已删除的文章
        result = await postService.bulkRestorePosts({
          postIds,
          userId,
          userRole
        })
        message = `成功恢复 ${result.count} 篇文章`
        break

      default:
        return res.status(400).json({
          success: false,
          error: '不支持的操作类型'
        })
    }

    return res.status(200).json({
      success: true,
      data: result,
      message
    })

  } catch (error) {
    console.error('Bulk operation error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('P2025')) {
        return res.status(404).json({
          success: false,
          error: '部分文章不存在或已被删除'
        })
      }
      
      if (error.message.includes('permission')) {
        return res.status(403).json({
          success: false,
          error: '权限不足，无法操作部分文章'
        })
      }
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '批量操作失败'
    })
  }
}

export default withAuth(handler)