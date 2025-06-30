export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  status: UserStatus
  avatar: string | null
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
  lastActiveAt: Date | null
}

export interface UserSession {
  id: string
  userId: string
  refreshToken: string
  deviceInfo: string | null
  ipAddress: string | null
  userAgent: string | null
  expiresAt: Date
  createdAt: Date
  lastUsedAt: Date
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  terms: boolean
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: Omit<User, 'passwordHash'>
    tokens: AuthTokens
  }
  error?: string
  message?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ProfileUpdateData {
  name?: string
  avatar?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface SessionInfo {
  id: string
  deviceInfo: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  lastUsedAt: Date
  isCurrent: boolean
}