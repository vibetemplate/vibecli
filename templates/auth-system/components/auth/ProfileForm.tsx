'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Calendar, MapPin, Phone, Edit2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/stores/auth'
import { updateProfileSchema, type UpdateProfileData } from '@/lib/validations/auth'

interface ProfileFormProps {
  onSuccess?: () => void
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { user, updateProfile, isLoading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
    }
  })

  const onSubmit = async (data: UpdateProfileData) => {
    try {
      clearError()
      
      // 转换日期格式
      const updateData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined
      }
      
      await updateProfile(updateData)
      setIsEditing(false)
      onSuccess?.()
    } catch (err) {
      // 错误已由store处理
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
    clearError()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未设置'
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">请先登录</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-gray-600" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-blue-100">{user.email}</p>
                <div className="flex items-center mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-red-500' :
                    user.role === 'MODERATOR' ? 'bg-yellow-500' :
                    'bg-green-500'
                  } text-white`}>
                    {user.role === 'ADMIN' ? '管理员' :
                     user.role === 'MODERATOR' ? '版主' : '用户'}
                  </span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'ACTIVE' ? 'bg-green-500' :
                    user.status === 'SUSPENDED' ? 'bg-red-500' :
                    'bg-yellow-500'
                  } text-white`}>
                    {user.status === 'ACTIVE' ? '正常' :
                     user.status === 'SUSPENDED' ? '已停用' : '待验证'}
                  </span>
                </div>
              </div>
            </div>
            
            {!isEditing && (
              <Button
                variant="outline"
                className="bg-white text-blue-600 border-white hover:bg-blue-50"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                编辑资料
              </Button>
            )}
          </div>
        </div>

        {/* 表单内容 */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 姓名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  姓名
                </label>
                {isEditing ? (
                  <Input
                    {...register('name')}
                    placeholder="请输入姓名"
                    error={errors.name?.message}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-lg">{user.name}</p>
                )}
              </div>

              {/* 邮箱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  邮箱地址
                </label>
                {isEditing ? (
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="请输入邮箱地址"
                    error={errors.email?.message}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-lg">{user.email}</p>
                )}
              </div>

              {/* 电话 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  电话号码
                </label>
                {isEditing ? (
                  <Input
                    {...register('phone')}
                    placeholder="请输入电话号码"
                    error={errors.phone?.message}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-lg">
                    {user.phone || '未设置'}
                  </p>
                )}
              </div>

              {/* 生日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  出生日期
                </label>
                {isEditing ? (
                  <Input
                    {...register('dateOfBirth')}
                    type="date"
                    error={errors.dateOfBirth?.message}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-lg">
                    {formatDate(user.dateOfBirth)}
                  </p>
                )}
              </div>

              {/* 位置 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  所在地
                </label>
                {isEditing ? (
                  <Input
                    {...register('location')}
                    placeholder="请输入所在地"
                    error={errors.location?.message}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-lg">
                    {user.location || '未设置'}
                  </p>
                )}
              </div>

              {/* 个人简介 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人简介
                </label>
                {isEditing ? (
                  <textarea
                    {...register('bio')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="介绍一下您自己..."
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-lg min-h-[100px]">
                    {user.bio || '这个人很懒，什么都没有留下...'}
                  </p>
                )}
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            {isEditing && (
              <div className="mt-8 flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  取消
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading || !isDirty}
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存更改
                </Button>
              </div>
            )}
          </form>

          {/* 账户信息 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">账户信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">注册时间：</span>
                <span className="font-medium">
                  {formatDate(user.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">最后登录：</span>
                <span className="font-medium">
                  {formatDate(user.lastLoginAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">邮箱验证：</span>
                <span className={`font-medium ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {user.emailVerified ? '已验证' : '未验证'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">双因子认证：</span>
                <span className={`font-medium ${user.twoFactorEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {user.twoFactorEnabled ? '已启用' : '未启用'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}