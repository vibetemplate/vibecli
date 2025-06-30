import {
  validateProjectName,
  validateProjectDirectory,
  validateTemplate,
  validateDatabase,
  validateNodeVersion,
  validateFeatureName,
  validateApiType
} from '../../utils/validation'
import fs from 'fs-extra'
import path from 'path'
import { createTempDir, cleanupTempDir } from '../setup'

describe('Validation Utils', () => {
  describe('validateProjectName', () => {
    test('应该通过有效的项目名称', () => {
      const result = validateProjectName('my-awesome-app')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('应该拒绝空项目名称', () => {
      const result = validateProjectName('')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('项目名称不能为空')
    })

    test('应该拒绝包含大写字母的名称', () => {
      const result = validateProjectName('MyApp')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('项目名称只能包含小写字母')
    })

    test('应该拒绝以点开头的名称', () => {
      const result = validateProjectName('.hidden-app')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('项目名称不能以点或下划线开头')
    })

    test('应该拒绝以下划线开头的名称', () => {
      const result = validateProjectName('_private-app')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('项目名称不能以点或下划线开头')
    })

    test('应该拒绝超过214个字符的名称', () => {
      const longName = 'a'.repeat(215)
      const result = validateProjectName(longName)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('项目名称不能超过 214 个字符')
    })

    test('应该拒绝包含非法字符的名称', () => {
      const result = validateProjectName('my@app')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('项目名称只能包含小写字母、数字、连字符和点')
    })

    test('应该拒绝保留名称', () => {
      const result = validateProjectName('node_modules')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('"node_modules" 是保留名称，不能用作项目名称')
    })
  })

  describe('validateProjectDirectory', () => {
    let tempDir: string

    beforeEach(async () => {
      tempDir = await createTempDir()
    })

    afterEach(async () => {
      await cleanupTempDir(tempDir)
    })

    test('应该通过不存在的目录', async () => {
      const projectPath = path.join(tempDir, 'new-project')
      const result = await validateProjectDirectory(projectPath)
      expect(result.valid).toBe(true)
    })

    test('应该对存在的空目录发出警告', async () => {
      const projectPath = path.join(tempDir, 'existing-empty')
      await fs.ensureDir(projectPath)
      
      const result = await validateProjectDirectory(projectPath)
      expect(result.valid).toBe(true)
    })

    test('应该对非空目录发出警告', async () => {
      const projectPath = path.join(tempDir, 'existing-nonempty')
      await fs.ensureDir(projectPath)
      await fs.writeFile(path.join(projectPath, 'file.txt'), 'content')
      
      const result = await validateProjectDirectory(projectPath)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('目标目录不为空，可能会覆盖现有文件')
    })

    test('应该拒绝已存在的文件路径', async () => {
      const filePath = path.join(tempDir, 'existing-file.txt')
      await fs.writeFile(filePath, 'content')
      
      const result = await validateProjectDirectory(filePath)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('目标路径已存在且不是一个目录')
    })
  })

  describe('validateTemplate', () => {
    test('应该通过支持的模板', () => {
      const validTemplates = ['default', 'blog', 'ecommerce', 'dashboard', 'saas']
      
      validTemplates.forEach(template => {
        const result = validateTemplate(template)
        expect(result.valid).toBe(true)
      })
    })

    test('应该拒绝不支持的模板', () => {
      const result = validateTemplate('unknown-template')
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('不支持的模板: "unknown-template"')
    })
  })

  describe('validateDatabase', () => {
    test('应该通过支持的数据库', () => {
      const validDatabases = ['postgresql', 'mysql', 'sqlite', 'mongodb']
      
      validDatabases.forEach(db => {
        const result = validateDatabase(db)
        expect(result.valid).toBe(true)
      })
    })

    test('应该支持大小写不敏感', () => {
      const result = validateDatabase('POSTGRESQL')
      expect(result.valid).toBe(true)
    })

    test('应该拒绝不支持的数据库', () => {
      const result = validateDatabase('oracle')
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('不支持的数据库: "oracle"')
    })
  })

  describe('validateNodeVersion', () => {
    const originalVersion = process.version

    afterEach(() => {
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        writable: true
      })
    })

    test('应该通过Node.js 18.17.0+', async () => {
      Object.defineProperty(process, 'version', {
        value: 'v18.17.0',
        writable: true
      })
      
      const result = await validateNodeVersion()
      expect(result.valid).toBe(true)
    })

    test('应该通过Node.js 20+', async () => {
      Object.defineProperty(process, 'version', {
        value: 'v20.0.0',
        writable: true
      })
      
      const result = await validateNodeVersion()
      expect(result.valid).toBe(true)
    })

    test('应该拒绝Node.js 16', async () => {
      Object.defineProperty(process, 'version', {
        value: 'v16.20.0',
        writable: true
      })
      
      const result = await validateNodeVersion()
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('需要 Node.js 18 或更高版本')
    })

    test('应该拒绝Node.js 18.16', async () => {
      Object.defineProperty(process, 'version', {
        value: 'v18.16.0',
        writable: true
      })
      
      const result = await validateNodeVersion()
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('需要 Node.js 18.17.0 或更高版本')
    })
  })

  describe('validateFeatureName', () => {
    test('应该通过支持的功能', () => {
      const validFeatures = ['auth', 'admin', 'payment', 'blog', 'ecommerce', 'chat', 'api']
      
      validFeatures.forEach(feature => {
        const result = validateFeatureName(feature)
        expect(result.valid).toBe(true)
      })
    })

    test('应该支持大小写不敏感', () => {
      const result = validateFeatureName('AUTH')
      expect(result.valid).toBe(true)
    })

    test('应该拒绝不支持的功能', () => {
      const result = validateFeatureName('unknown-feature')
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('不支持的功能: "unknown-feature"')
    })
  })

  describe('validateApiType', () => {
    test('应该通过支持的API类型', () => {
      const validTypes = ['api', 'route', 'component', 'service', 'model']
      
      validTypes.forEach(type => {
        const result = validateApiType(type)
        expect(result.valid).toBe(true)
      })
    })

    test('应该支持大小写不敏感', () => {
      const result = validateApiType('API')
      expect(result.valid).toBe(true)
    })

    test('应该拒绝不支持的类型', () => {
      const result = validateApiType('unknown-type')
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('不支持的生成类型: "unknown-type"')
    })
  })
})