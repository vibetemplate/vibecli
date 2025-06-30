import * as fs from 'fs-extra'
import * as path from 'path'
import validateNpmName from 'validate-npm-package-name'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateProjectName(name: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  // 检查是否为空
  if (!name || name.trim().length === 0) {
    result.valid = false
    result.errors.push('项目名称不能为空')
    return result
  }

  // 检查长度
  if (name.length > 214) {
    result.valid = false
    result.errors.push('项目名称不能超过 214 个字符')
  }

  // 检查是否以点或下划线开头
  if (name.startsWith('.') || name.startsWith('_')) {
    result.valid = false
    result.errors.push('项目名称不能以点或下划线开头')
  }

  // 检查是否包含大写字母
  if (name !== name.toLowerCase()) {
    result.valid = false
    result.errors.push('项目名称只能包含小写字母')
  }

  // 检查是否包含非法字符
  const validNameRegex = /^[a-z0-9-_.]+$/
  if (!validNameRegex.test(name)) {
    result.valid = false
    result.errors.push('项目名称只能包含小写字母、数字、连字符和点')
  }

  // 检查是否为保留字
  const reservedNames = [
    'node_modules',
    'favicon.ico',
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ]
  if (reservedNames.includes(name)) {
    result.valid = false
    result.errors.push(`"${name}" 是保留名称，不能用作项目名称`)
  }

  // 使用 npm 包名验证
  const npmValidation = validateNpmName(name)
  if (!npmValidation.validForNewPackages) {
    result.valid = false
    if (npmValidation.errors) {
      result.errors.push(...npmValidation.errors)
    }
  }
  if (npmValidation.warnings) {
    result.warnings.push(...npmValidation.warnings)
  }

  return result
}

export async function validateProjectDirectory(projectPath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  try {
    // 检查目录是否已存在
    if (await fs.pathExists(projectPath)) {
      const stats = await fs.stat(projectPath)
      
      if (!stats.isDirectory()) {
        result.valid = false
        result.errors.push('目标路径已存在且不是一个目录')
        return result
      }

      // 检查目录是否为空
      const files = await fs.readdir(projectPath)
      const nonHiddenFiles = files.filter(file => !file.startsWith('.'))
      
      if (nonHiddenFiles.length > 0) {
        result.warnings.push('目标目录不为空，可能会覆盖现有文件')
      }
    }

    // 检查是否有写入权限
    const parentDir = path.dirname(projectPath)
    try {
      await fs.access(parentDir, fs.constants.W_OK)
    } catch (error) {
      result.valid = false
      result.errors.push('没有在目标位置创建目录的权限')
    }

  } catch (error) {
    result.valid = false
    result.errors.push(`验证目录时出错: ${error instanceof Error ? error.message : '未知错误'}`)
  }

  return result
}

export function validateTemplate(template: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  const supportedTemplates = [
    'default',
    'minimal',
    'blog',
    'ecommerce',
    'dashboard',
    'saas',
    'portfolio',
    'docs'
  ]

  if (!supportedTemplates.includes(template)) {
    result.valid = false
    result.errors.push(`不支持的模板: "${template}"`)
    result.errors.push(`支持的模板: ${supportedTemplates.join(', ')}`)
  }

  return result
}

export function validateDatabase(database: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  const supportedDatabases = [
    'postgresql',
    'mysql',
    'sqlite',
    'mongodb'
  ]

  if (!supportedDatabases.includes(database.toLowerCase())) {
    result.valid = false
    result.errors.push(`不支持的数据库: "${database}"`)
    result.errors.push(`支持的数据库: ${supportedDatabases.join(', ')}`)
  }

  return result
}

export async function validateNodeVersion(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])

  if (majorVersion < 18) {
    result.valid = false
    result.errors.push(`需要 Node.js 18 或更高版本，当前版本: ${nodeVersion}`)
  } else if (majorVersion === 18) {
    const minorVersion = parseInt(nodeVersion.slice(1).split('.')[1])
    if (minorVersion < 17) {
      result.valid = false
      result.errors.push(`需要 Node.js 18.17.0 或更高版本，当前版本: ${nodeVersion}`)
    }
  }

  return result
}

export function validateFeatureName(feature: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  const supportedFeatures = [
    'auth',
    'admin',
    'payment',
    'blog',
    'ecommerce',
    'chat',
    'api'
  ]

  if (!supportedFeatures.includes(feature.toLowerCase())) {
    result.valid = false
    result.errors.push(`不支持的功能: "${feature}"`)
    result.errors.push(`支持的功能: ${supportedFeatures.join(', ')}`)
  }

  return result
}

export function validateApiType(type: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  const supportedTypes = [
    'api',
    'route',
    'component',
    'service',
    'model'
  ]

  if (!supportedTypes.includes(type.toLowerCase())) {
    result.valid = false
    result.errors.push(`不支持的生成类型: "${type}"`)
    result.errors.push(`支持的类型: ${supportedTypes.join(', ')}`)
  }

  return result
}

export function displayValidationErrors(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error('❌ 验证失败:')
    result.errors.forEach(error => console.error(`  • ${error}`))
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  警告:')
    result.warnings.forEach(warning => console.warn(`  • ${warning}`))
  }
}