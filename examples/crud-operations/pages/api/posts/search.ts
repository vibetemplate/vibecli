import { NextApiRequest, NextApiResponse } from 'next'
import { postService } from '@/lib/services/post'
import { searchPostsSchema } from '@/lib/validations/post'
import { ApiResponse } from '@/types/api'

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    })
  }

  try {
    return handleSearchPosts(req, res)
  } catch (error) {
    console.error('Search posts API error:', error)
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    })
  }
}

// GET /api/posts/search - 搜索文章
async function handleSearchPosts(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 验证查询参数
    const queryValidation = searchPostsSchema.safeParse(req.query)
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        error: '查询参数格式错误',
        details: queryValidation.error.format()
      })
    }

    const {
      q: query,
      page = 1,
      limit = 10,
      fields = ['title', 'content', 'excerpt'],
      categories,
      tags,
      authors,
      status = ['PUBLISHED'],
      dateFrom,
      dateTo,
      sortBy = 'relevance',
      highlight = true
    } = queryValidation.data

    // 构建搜索选项
    const searchOptions = {
      query,
      page: Number(page),
      limit: Number(limit),
      fields: Array.isArray(fields) ? fields : [fields],
      filters: {
        categories: categories ? (Array.isArray(categories) ? categories : [categories]) : undefined,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
        authors: authors ? (Array.isArray(authors) ? authors : [authors]) : undefined,
        status: Array.isArray(status) ? status : [status],
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      },
      sortBy,
      highlight: highlight === 'true'
    }

    // 执行搜索
    const result = await postService.searchPosts(searchOptions)

    // 构建搜索统计信息
    const searchStats = {
      query,
      totalResults: result.meta.total,
      searchTime: result.meta.searchTime || 0,
      page: result.meta.page,
      totalPages: result.meta.totalPages,
      hasMore: result.meta.hasMore
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        ...result.meta,
        search: searchStats
      },
      message: `找到 ${result.meta.total} 个相关结果`
    })

  } catch (error) {
    console.error('Search posts error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '搜索失败'
    })
  }
}

export default handler