export interface Post {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  status: PostStatus
  featured: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  authorId: string
  categoryId: string | null
  author: {
    id: string
    name: string | null
    email: string
  }
  category?: {
    id: string
    name: string
    slug: string
    color: string | null
  } | null
  tags: Array<{
    id: string
    name: string
    slug: string
    color: string | null
  }>
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface PostCreateData {
  title: string
  content?: string
  excerpt?: string
  status: PostStatus
  featured: boolean
  publishedAt?: string
  categoryId?: string
  tagIds: string[]
}

export interface PostUpdateData {
  title?: string
  content?: string
  excerpt?: string
  status?: PostStatus
  featured?: boolean
  publishedAt?: string
  categoryId?: string
  tagIds?: string[]
  version: number
}

export interface PostFilters {
  search?: string
  status?: PostStatus
  categoryId?: string
  authorId?: string
  featured?: boolean
  page: number
  limit: number
  sortBy: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title'
  sortOrder: 'asc' | 'desc'
  includeDeleted?: boolean
}

export interface PostsResponse {
  posts: Post[]
  total: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  name: string
  slug: string
  color: string | null
  createdAt: Date
}

export interface BulkAction {
  action: 'delete' | 'publish' | 'archive' | 'feature' | 'unfeature'
  postIds: string[]
}

export interface AuditLog {
  id: string
  action: AuditAction
  tableName: string
  recordId: string
  oldData: any
  newData: any
  userId: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
  }
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RESTORE = 'RESTORE',
  BULK_UPDATE = 'BULK_UPDATE',
  BULK_DELETE = 'BULK_DELETE'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
}