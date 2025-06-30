'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/stores/auth'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
  redirectPath?: string
}

export function LoginForm({ onSuccess, onSwitchToRegister, redirectPath }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      await login(data.email, data.password)
      onSuccess?.()
      
      // 登录成功后重定向
      if (redirectPath) {
        window.location.href = redirectPath
      }
    } catch (err) {
      // 错误已由store处理
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
          <p className="text-gray-600 mt-2">登录您的账户</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">记住我</span>
            </label>
            
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-500"
              onClick={() => {
                // TODO: 实现忘记密码功能
                console.log('忘记密码')
              }}
            >
              忘记密码？
            </button>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            登录
          </Button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              还没有账户？
              <button
                type="button"
                className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
                onClick={onSwitchToRegister}
              >
                立即注册
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}