export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: any
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    hasMore?: boolean
    searchTime?: number
    [key: string]: any
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface ListResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface SearchMeta extends PaginationMeta {
  query: string
  searchTime: number
  totalResults: number
}

export interface BulkOperationResult {
  count: number
  success: number
  failed: number
  errors?: Array<{
    id: string
    error: string
  }>
}

export type SortOrder = 'asc' | 'desc'

export interface FilterOptions {
  search?: string
  status?: string | string[]
  category?: string | string[]
  tags?: string | string[]
  authors?: string | string[]
  dateFrom?: Date
  dateTo?: Date
}

export interface ListOptions extends FilterOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
  includeDeleted?: boolean
  includeRelations?: boolean
}

export interface SearchOptions extends ListOptions {
  query: string
  fields?: string[]
  highlight?: boolean
}

export interface BulkOperationOptions {
  postIds: string[]
  userId: string
  userRole: string
  force?: boolean
  updateData?: Record<string, any>
  tags?: string[]
  tagMode?: 'replace' | 'add' | 'remove'
}