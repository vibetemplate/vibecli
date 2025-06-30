import { createApp } from '../../commands/create'
import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'
import { createTempDir, cleanupTempDir, mockConsole, mockProcessExit } from '../setup'

// Mock dependencies
jest.mock('child_process')
jest.mock('inquirer')
jest.mock('ora')

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>

import inquirer from 'inquirer'
const mockInquirer = inquirer as jest.Mocked<typeof inquirer>

import ora from 'ora'
const mockOra = ora as jest.Mocked<typeof ora>

// Mock ora spinner
function createMockSpinner() {
  return {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis()
  }
}

const mockSpinner = createMockSpinner()
;(mockOra as any).mockReturnValue(mockSpinner)

describe('create command', () => {
  let tempDir: string
  let consoleMock: ReturnType<typeof mockConsole>
  let processExitMock: ReturnType<typeof mockProcessExit>

  beforeEach(async () => {
    tempDir = await createTempDir()
    consoleMock = mockConsole()
    processExitMock = mockProcessExit()
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock cwd to return temp directory
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir)
    jest.spyOn(process, 'chdir').mockImplementation()
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
    consoleMock.restore()
    processExitMock.restore()
    jest.restoreAllMocks()
  })

  describe('项目名称验证', () => {
    test('应该拒绝无效的项目名称', async () => {
      await createApp('Invalid Name', {})
      
      expect(processExitMock.mockExit).toHaveBeenCalledWith(1)
      expect(consoleMock.errors.some(err => err.includes('项目名称无效'))).toBe(true)
    })

    test('应该通过有效的项目名称', async () => {
      // Mock inquirer responses
      mockInquirer.prompt.mockResolvedValueOnce({
        overwrite: false
      })

      await createApp('valid-app-name', {})
      
      expect(processExitMock.mockExit).toHaveBeenCalledWith(0)
      expect(consoleMock.logs.some(log => log.includes('操作已取消'))).toBe(true)
    })
  })

  describe('目录覆盖处理', () => {
    test('如果目录存在且用户选择不覆盖，应该取消操作', async () => {
      const projectName = 'existing-project'
      const projectPath = path.join(tempDir, projectName)
      await fs.ensureDir(projectPath)

      mockInquirer.prompt.mockResolvedValueOnce({
        overwrite: false
      })

      await createApp(projectName, {})
      
      expect(processExitMock.mockExit).toHaveBeenCalledWith(0)
      expect(consoleMock.logs.some(log => log.includes('操作已取消'))).toBe(true)
    })

    test('如果目录存在且用户选择覆盖，应该删除旧目录', async () => {
      const projectName = 'existing-project'
      const projectPath = path.join(tempDir, projectName)
      await fs.ensureDir(projectPath)
      await fs.writeFile(path.join(projectPath, 'old-file.txt'), 'old content')

      // Mock all inquirer prompts
      mockInquirer.prompt
        .mockResolvedValueOnce({ overwrite: true })
        .mockResolvedValueOnce({
          template: 'default',
          database: 'postgresql',
          features: ['auth'],
          uiFramework: 'tailwind-radix'
        })

      mockExecSync.mockImplementation(() => Buffer.from(''))

      await createApp(projectName, {})
      
      // Check that old file was removed
      expect(await fs.pathExists(path.join(projectPath, 'old-file.txt'))).toBe(false)
      expect(mockSpinner.succeed).toHaveBeenCalledWith('项目创建成功!')
    })
  })

  describe('项目生成', () => {
    test('应该生成基本的项目结构', async () => {
      const projectName = 'test-project'

      mockInquirer.prompt.mockResolvedValueOnce({
        template: 'default',
        database: 'postgresql',
        features: ['auth'],
        uiFramework: 'tailwind-radix'
      })

      mockExecSync.mockImplementation(() => Buffer.from(''))

      await createApp(projectName, {
        template: 'default',
        database: 'postgresql',
        auth: true,
        admin: false
      })

      const projectPath = path.join(tempDir, projectName)
      
      // Check that basic files were created
      expect(await fs.pathExists(path.join(projectPath, 'package.json'))).toBe(true)
      expect(await fs.pathExists(path.join(projectPath, 'tsconfig.json'))).toBe(true)
      expect(await fs.pathExists(path.join(projectPath, 'next.config.js'))).toBe(true)
      expect(await fs.pathExists(path.join(projectPath, 'src', 'app', 'layout.tsx'))).toBe(true)
      expect(await fs.pathExists(path.join(projectPath, 'src', 'app', 'page.tsx'))).toBe(true)
      expect(await fs.pathExists(path.join(projectPath, 'prisma', 'schema.prisma'))).toBe(true)

      // Check package.json content
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'))
      expect(packageJson.name).toBe(projectName)
      expect(packageJson.dependencies).toHaveProperty('next')
      expect(packageJson.dependencies).toHaveProperty('@prisma/client')
    })

    test('应该根据配置选择正确的依赖', async () => {
      const projectName = 'tailwind-project'

      mockInquirer.prompt.mockResolvedValueOnce({
        template: 'default',
        database: 'mysql',
        features: ['auth', 'admin'],
        uiFramework: 'tailwind-radix'
      })

      mockExecSync.mockImplementation(() => Buffer.from(''))

      await createApp(projectName, {
        template: 'default',
        database: 'mysql'
      })

      const projectPath = path.join(tempDir, projectName)
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'))
      
      // Check Tailwind dependencies
      expect(packageJson.devDependencies).toHaveProperty('tailwindcss')
      expect(packageJson.dependencies).toHaveProperty('@radix-ui/react-slot')
      
      // Check Prisma schema database provider
      const prismaSchema = await fs.readFile(path.join(projectPath, 'prisma', 'schema.prisma'), 'utf-8')
      expect(prismaSchema).toContain('provider = "mysql"')
    })
  })

  describe('依赖安装', () => {
    test('应该运行npm install', async () => {
      const projectName = 'install-test'

      mockInquirer.prompt.mockResolvedValueOnce({
        template: 'default',
        database: 'sqlite',
        features: [],
        uiFramework: 'tailwind-radix'
      })

      mockExecSync.mockImplementation(() => Buffer.from(''))

      await createApp(projectName, {})

      expect(mockExecSync).toHaveBeenCalledWith('npm install', { stdio: 'pipe' })
      expect(mockSpinner.succeed).toHaveBeenCalledWith('依赖安装完成!')
    })

    test('应该为非SQLite数据库初始化Prisma', async () => {
      const projectName = 'prisma-test'

      mockInquirer.prompt.mockResolvedValueOnce({
        template: 'default',
        database: 'postgresql',
        features: [],
        uiFramework: 'tailwind-radix'
      })

      mockExecSync.mockImplementation(() => Buffer.from(''))

      await createApp(projectName, { database: 'postgresql' })

      expect(mockExecSync).toHaveBeenCalledWith('npx prisma generate', { stdio: 'pipe' })
      expect(mockSpinner.succeed).toHaveBeenCalledWith('数据库初始化完成!')
    })

    test('应该跳过SQLite的数据库初始化', async () => {
      const projectName = 'sqlite-test'

      mockInquirer.prompt.mockResolvedValueOnce({
        template: 'default',
        database: 'sqlite',
        features: [],
        uiFramework: 'tailwind-radix'
      })

      mockExecSync.mockImplementation(() => Buffer.from(''))

      await createApp(projectName, { database: 'sqlite' })

      expect(mockExecSync).not.toHaveBeenCalledWith('npx prisma generate', { stdio: 'pipe' })
    })
  })

  describe('错误处理', () => {
    test('应该处理项目生成失败', async () => {
      const projectName = 'error-test'

      mockInquirer.prompt.mockResolvedValueOnce({
        template: 'default',
        database: 'postgresql',
        features: [],
        uiFramework: 'tailwind-radix'
      })

      // Mock fs.ensureDir to throw an error
      const mockEnsureDir = jest.spyOn(fs, 'ensureDir') as any
      mockEnsureDir.mockRejectedValue(new Error('Permission denied'))

      await createApp(projectName, {})

      expect(mockSpinner.fail).toHaveBeenCalledWith('项目创建失败')
      expect(processExitMock.mockExit).toHaveBeenCalledWith(1)
    })

    test('应该处理依赖安装失败', async () => {
      const projectName = 'install-error-test'

      mockInquirer.prompt.mockResolvedValueOnce({
        template: 'default',
        database: 'sqlite',
        features: [],
        uiFramework: 'tailwind-radix'
      })

      // Mock execSync to throw error on npm install
      mockExecSync.mockImplementation((command) => {
        if (command === 'npm install') {
          throw new Error('npm install failed')
        }
        return Buffer.from('')
      })

      await createApp(projectName, {})

      expect(mockSpinner.fail).toHaveBeenCalledWith('项目创建失败')
      expect(processExitMock.mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('选项处理', () => {
    test('应该使用命令行选项而不是交互式提示', async () => {
      const projectName = 'options-test'

      mockExecSync.mockImplementation(() => Buffer.from(''))

      await createApp(projectName, {
        template: 'blog',
        database: 'mysql',
        auth: false,
        admin: true
      })

      // Should not prompt for template and database since they're provided
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1)
      
      // Check that the prompt only asks for features and UI framework
      const promptCall = mockInquirer.prompt.mock.calls[0][0]
      const questionNames = (promptCall as any[]).map((q: any) => q.name)
      expect(questionNames).not.toContain('template')
      expect(questionNames).not.toContain('database')
    })
  })
})