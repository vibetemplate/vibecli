import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/middleware/auth'
import { postService } from '@/lib/services/post'
import { createPostSchema, listPostsSchema } from '@/lib/validations/post'
import { ApiResponse } from '@/types/api'
import { Post } from '@/types/post'

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGetPosts(req, res)
      case 'POST':
        return handleCreatePost(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`
        })
    }
  } catch (error) {
    console.error('Posts API error:', error)
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
}

// GET /api/posts - 获取文章列表
async function handleGetPosts(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 验证查询参数
    const queryValidation = listPostsSchema.safeParse(req.query)
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        error: '查询参数格式错误',
        details: queryValidation.error.format()
      })
    }

    const {
      page = 1,
      limit = 10,
      search,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false
    } = queryValidation.data

    const result = await postService.listPosts({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      category,
      sortBy,
      sortOrder,
      includeDeleted: includeDeleted === 'true'
    })

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
      message: '获取文章列表成功'
    })

  } catch (error) {
    console.error('Get posts error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取文章列表失败'
    })
  }
}

// POST /api/posts - 创建新文章
async function handleCreatePost(req: any, res: NextApiResponse) {
  try {
    // 验证请求体
    const bodyValidation = createPostSchema.safeParse(req.body)
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        error: '数据格式错误',
        details: bodyValidation.error.format()
      })
    }

    const postData = bodyValidation.data
    const userId = req.user.id

    // 创建文章
    const newPost = await postService.createPost({
      ...postData,
      authorId: userId
    })

    return res.status(201).json({
      success: true,
      data: newPost,
      message: '文章创建成功'
    })

  } catch (error) {
    console.error('Create post error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({
          success: false,
          error: '文章标题或URL已存在'
        })
      }
      
      if (error.message.includes('P2025')) {
        return res.status(404).json({
          success: false,
          error: '关联的资源不存在'
        })
      }
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建文章失败'
    })
  }
}

export default withAuth(handler)