'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/stores/auth'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
  redirectPath?: string
}

export function RegisterForm({ onSuccess, onSwitchToLogin, redirectPath }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        terms: data.terms
      })
      onSuccess?.()
      
      // 注册成功后重定向
      if (redirectPath) {
        window.location.href = redirectPath
      }
    } catch (err) {
      // 错误已由store处理
    }
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: 'bg-gray-200' }
    
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    const levels = [
      { strength: 0, label: '', color: 'bg-gray-200' },
      { strength: 1, label: '很弱', color: 'bg-red-400' },
      { strength: 2, label: '弱', color: 'bg-orange-400' },
      { strength: 3, label: '中等', color: 'bg-yellow-400' },
      { strength: 4, label: '强', color: 'bg-green-400' },
      { strength: 5, label: '很强', color: 'bg-green-600' }
    ]

    return levels[score]
  }

  const passwordStrength = getPasswordStrength(password || '')

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">创建账户</h2>
          <p className="text-gray-600 mt-2">开始您的旅程</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              姓名
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                {...register('name')}
                type="text"
                placeholder="请输入您的姓名"
                className="pl-10"
                error={errors.name?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                {...register('email')}
                type="email"
                placeholder="请输入邮箱地址"
                className="pl-10"
                error={errors.email?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                className="pl-10 pr-10"
                error={errors.password?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* 密码强度指示器 */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{passwordStrength.label}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  密码应包含至少8个字符，包括大小写字母、数字和特殊字符
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              确认密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="请再次输入密码"
                className="pl-10 pr-10"
                error={errors.confirmPassword?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                {...register('terms')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label className="text-gray-600">
                我同意
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500 ml-1"
                  onClick={() => {
                    // TODO: 打开服务条款弹窗
                    console.log('打开服务条款')
                  }}
                >
                  服务条款
                </button>
                和
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500 ml-1"
                  onClick={() => {
                    // TODO: 打开隐私政策弹窗
                    console.log('打开隐私政策')
                  }}
                >
                  隐私政策
                </button>
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            创建账户
          </Button>
        </form>

        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              已有账户？
              <button
                type="button"
                className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
                onClick={onSwitchToLogin}
              >
                立即登录
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}