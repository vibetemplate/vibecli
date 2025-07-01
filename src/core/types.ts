// 核心类型定义，供CLI和MCP接口共同使用

export interface ProjectConfig {
  name: string
  template: 'default' | 'ecommerce' | 'blog' | 'dashboard' | 'saas'
  database: 'postgresql' | 'mysql' | 'sqlite'
  uiFramework: 'tailwind-radix' | 'antd' | 'mui' | 'chakra'
  features: {
    auth: boolean
    admin: boolean
    upload: boolean
    email: boolean
    payment: boolean
    realtime: boolean
  }
  targetDirectory?: string
  overwrite?: boolean
}

export interface ProjectResult {
  success: boolean
  projectPath: string
  message: string
  generatedFiles: string[]
  nextSteps: string[]
  error?: string
}

export interface FeatureConfig {
  name: 'auth' | 'crud' | 'upload' | 'email' | 'payment' | 'realtime' | 'admin' | 'analytics'
  options?: Record<string, any>
  force?: boolean
}

export interface FeatureResult {
  success: boolean
  feature: string
  message: string
  addedFiles: string[]
  modifiedFiles: string[]
  instructions: string[]
  error?: string
}

export interface DeploymentConfig {
  platform: 'vercel' | 'netlify' | 'aws' | 'docker'
  environment: 'development' | 'staging' | 'production'
  envFile?: string
  customConfig?: Record<string, any>
}

export interface DeploymentResult {
  success: boolean
  platform: string
  url?: string
  message: string
  deploymentId?: string
  error?: string
}

export interface GenerationConfig {
  type: 'api' | 'component' | 'service' | 'model'
  name: string
  model?: string
  features?: string[]
  options?: Record<string, any>
}

export interface GenerationResult {
  success: boolean
  type: string
  name: string
  message: string
  generatedFiles: string[]
  instructions: string[]
  error?: string
}

// 验证结果接口 - 与utils/validation.ts保持兼容
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

// 项目状态接口
export interface ProjectStatus {
  exists: boolean
  isVibeCLIProject: boolean
  features: string[]
  framework: string
  database: string
  version: string
}

// 提示词相关类型定义
export interface PromptGenerationConfig {
  userDescription: string
  projectType?: string
  detectedFeatures?: string[]
  complexityLevel?: 'simple' | 'medium' | 'complex'
  techStack?: string[]
  projectContext?: ProjectConfig
}

export interface PromptGenerationResult {
  success: boolean
  prompt: string
  metadata: {
    projectType: string
    detectedFeatures: string[]
    confidenceScore: number
    templateUsed: string
    generatedAt: string
  }
  error?: string
}

export interface PromptTemplate {
  id: string
  name: string
  projectType: string
  templatePath: string
  variables: string[]
  description: string
}

export interface PromptContext {
  project_name: string
  project_type: string
  complexity_level: string
  detected_features: string[]
  tech_stack: string
  vibecli_version: string
  has_payment_feature?: boolean
  has_billing_feature?: boolean
  has_search_feature?: boolean
  current_date: string
  [key: string]: any
}