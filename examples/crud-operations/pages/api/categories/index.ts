import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/lib/middleware/auth'
import { categoryService } from '@/lib/services/category'
import { createCategorySchema, listCategoriesSchema } from '@/lib/validations/category'
import { ApiResponse } from '@/types/api'

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGetCategories(req, res)
      case 'POST':
        return handleCreateCategory(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`
        })
    }
  } catch (error) {
    console.error('Categories API error:', error)
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
}

// GET /api/categories - 获取分类列表
async function handleGetCategories(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 验证查询参数
    const queryValidation = listCategoriesSchema.safeParse(req.query)
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        error: '查询参数格式错误',
        details: queryValidation.error.format()
      })
    }

    const {
      includeHidden = false,
      includePostCount = true,
      sortBy = 'name',
      sortOrder = 'asc'
    } = queryValidation.data

    const categories = await categoryService.listCategories({
      includeHidden: includeHidden === 'true',
      includePostCount: includePostCount === 'true',
      sortBy,
      sortOrder
    })

    return res.status(200).json({
      success: true,
      data: categories,
      message: '获取分类列表成功'
    })

  } catch (error) {
    console.error('Get categories error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取分类列表失败'
    })
  }
}

// POST /api/categories - 创建新分类
async function handleCreateCategory(req: any, res: NextApiResponse) {
  try {
    // 检查权限 - 只有管理员和版主可以创建分类
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
      return res.status(403).json({
        success: false,
        error: '权限不足，只有管理员和版主可以创建分类'
      })
    }

    // 验证请求体
    const bodyValidation = createCategorySchema.safeParse(req.body)
    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        error: '数据格式错误',
        details: bodyValidation.error.format()
      })
    }

    const categoryData = bodyValidation.data

    // 创建分类
    const newCategory = await categoryService.createCategory({
      ...categoryData,
      createdBy: req.user.id
    })

    return res.status(201).json({
      success: true,
      data: newCategory,
      message: '分类创建成功'
    })

  } catch (error) {
    console.error('Create category error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({
          success: false,
          error: '分类名称或标识符已存在'
        })
      }
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建分类失败'
    })
  }
}

export default withAuth(handler, { optional: true })