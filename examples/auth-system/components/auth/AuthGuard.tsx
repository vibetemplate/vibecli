'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { setupAuthInterceptor } from '@/lib/stores/auth'

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
  requiredRole?: 'USER' | 'MODERATOR' | 'ADMIN'
  redirectTo?: string
  fallback?: ReactNode
}

export function AuthGuard({
  children,
  requireAuth = true,
  requiredRole,
  redirectTo = '/auth/login',
  fallback
}: AuthGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    // 设置认证拦截器
    setupAuthInterceptor()
  }, [])

  // 加载中状态
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    )
  }

  // 需要认证但未登录
  if (requireAuth && !isAuthenticated) {
    router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`)
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">正在跳转到登录页面...</p>
          </div>
        </div>
      )
    )
  }

  // 检查角色权限
  if (requireAuth && requiredRole && user) {
    const hasRequiredRole = checkUserRole(user.role, requiredRole)
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h2>
            <p className="text-gray-600">您没有权限访问此页面</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回
            </button>
          </div>
        </div>
      )
    }
  }

  // 不需要认证或已通过认证检查
  return <>{children}</>
}

// 角色权限检查辅助函数
function checkUserRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'USER': 0,
    'MODERATOR': 1,
    'ADMIN': 2
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] ?? -1
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] ?? 0

  return userLevel >= requiredLevel
}

// 高阶组件版本
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}

// Hook版本，用于在组件内部进行权限检查
export function useAuthGuard(options?: {
  requireAuth?: boolean
  requiredRole?: 'USER' | 'MODERATOR' | 'ADMIN'
  redirectTo?: string
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { requireAuth = true, requiredRole, redirectTo = '/auth/login' } = options || {}

  const canAccess = (() => {
    if (isLoading) return null // 加载中
    if (requireAuth && !isAuthenticated) return false
    if (requireAuth && requiredRole && user) {
      return checkUserRole(user.role, requiredRole)
    }
    return true
  })()

  const redirectToLogin = () => {
    router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`)
  }

  return {
    canAccess,
    isLoading,
    isAuthenticated,
    user,
    redirectToLogin
  }
}