import { jest } from '@jest/globals'
import inquirer from 'inquirer'
import { learn } from '../../commands/learn.js'

// Mock dependencies
jest.mock('inquirer')
jest.mock('chalk', () => ({
  blue: { bold: jest.fn((text) => text) },
  green: { bold: jest.fn((text) => text) },
  cyan: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  white: jest.fn((text) => text)
}))

const mockInquirer = inquirer as jest.Mocked<typeof inquirer>

describe('Learn Command', () => {
  let consoleLogSpy: jest.SpiedFunction<any>
  let consoleErrorSpy: jest.SpiedFunction<any>

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('topic selection', () => {
    it('should show topic menu when no topic specified', async () => {
      mockInquirer.prompt.mockResolvedValue({ topic: 'basic' })

      await learn()

      expect(mockInquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'list',
            name: 'topic',
            message: expect.stringContaining('选择学习主题')
          })
        ])
      )
    })

    it('should directly start tutorial when topic specified', async () => {
      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('基础使用教程')
      )
    })

    it('should show error for invalid topic', async () => {
      await learn('invalid-topic')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('未知的学习主题')
      )
    })
  })

  describe('basic tutorial', () => {
    beforeEach(() => {
      mockInquirer.prompt.mockImplementation(({ name }) => {
        if (name === 'continue') return Promise.resolve({ continue: true })
        if (name === 'projectName') return Promise.resolve({ projectName: 'my-test-app' })
        if (name === 'template') return Promise.resolve({ template: 'ecommerce' })
        return Promise.resolve({})
      })
    })

    it('should guide through basic project creation', async () => {
      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('基础使用教程')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('vibecli create')
      )
    })

    it('should show example commands', async () => {
      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('$ vibecli create my-test-app --template ecommerce')
      )
    })

    it('should handle user choosing to skip steps', async () => {
      mockInquirer.prompt.mockImplementation(({ name }) => {
        if (name === 'continue') return Promise.resolve({ continue: false })
        return Promise.resolve({})
      })

      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('教程结束')
      )
    })
  })

  describe('template tutorial', () => {
    beforeEach(() => {
      mockInquirer.prompt.mockResolvedValue({ continue: true })
    })

    it('should explain template system', async () => {
      await learn('template')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('模板系统教程')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('vibecli template list')
      )
    })

    it('should show template installation examples', async () => {
      await learn('template')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('vibecli template install')
      )
    })
  })

  describe('deployment tutorial', () => {
    beforeEach(() => {
      mockInquirer.prompt.mockImplementation(({ name }) => {
        if (name === 'continue') return Promise.resolve({ continue: true })
        if (name === 'platform') return Promise.resolve({ platform: 'vercel' })
        return Promise.resolve({})
      })
    })

    it('should guide through deployment process', async () => {
      await learn('deployment')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('部署教程')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('vibecli deploy')
      )
    })

    it('should show platform-specific commands', async () => {
      await learn('deployment')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('$ vibecli deploy --platform vercel')
      )
    })
  })

  describe('mcp tutorial', () => {
    beforeEach(() => {
      mockInquirer.prompt.mockResolvedValue({ continue: true })
    })

    it('should explain MCP integration', async () => {
      await learn('mcp')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('MCP协议集成教程')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('vibecli-mcp-server')
      )
    })

    it('should show configuration examples', async () => {
      await learn('mcp')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('mcpServers')
      )
    })
  })

  describe('interactive features', () => {
    it('should handle user interruption gracefully', async () => {
      mockInquirer.prompt.mockRejectedValue(new Error('User interrupted'))

      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('教程已终止')
      )
    })

    it('should provide helpful tips throughout tutorial', async () => {
      mockInquirer.prompt.mockResolvedValue({ continue: true })

      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('💡 提示')
      )
    })

    it('should show progress indicators', async () => {
      mockInquirer.prompt.mockResolvedValue({ continue: true })

      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('步骤')
      )
    })
  })

  describe('tutorial completion', () => {
    beforeEach(() => {
      mockInquirer.prompt.mockResolvedValue({ continue: true })
    })

    it('should show completion message', async () => {
      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('恭喜！')
      )
    })

    it('should suggest next steps', async () => {
      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('接下来你可以')
      )
    })

    it('should provide resource links', async () => {
      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('文档')
      )
    })
  })

  describe('error handling', () => {
    it('should handle inquirer errors', async () => {
      mockInquirer.prompt.mockRejectedValue(new Error('Input error'))

      await learn('basic')

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('教程已终止')
      )
    })

    it('should validate user input', async () => {
      mockInquirer.prompt.mockImplementation(({ name }) => {
        if (name === 'projectName') return Promise.resolve({ projectName: '' })
        return Promise.resolve({ continue: true })
      })

      await learn('basic')

      // Should handle empty project name gracefully
      expect(consoleLogSpy).toHaveBeenCalled()
    })
  })

  describe('tutorial content quality', () => {
    it('should provide executable examples', async () => {
      mockInquirer.prompt.mockResolvedValue({ continue: true })

      await learn('basic')

      // Should show commands that user can actually run
      const calls = consoleLogSpy.mock.calls.flat()
      const hasExecutableCommands = calls.some(call => 
        typeof call === 'string' && call.includes('$ vibecli')
      )
      expect(hasExecutableCommands).toBe(true)
    })

    it('should explain concepts clearly', async () => {
      mockInquirer.prompt.mockResolvedValue({ continue: true })

      await learn('template')

      // Should explain what templates are
      const calls = consoleLogSpy.mock.calls.flat()
      const hasExplanation = calls.some(call => 
        typeof call === 'string' && (
          call.includes('模板') || 
          call.includes('template')
        )
      )
      expect(hasExplanation).toBe(true)
    })

    it('should provide practical examples', async () => {
      mockInquirer.prompt.mockResolvedValue({ continue: true })

      await learn('deployment')

      // Should show real deployment scenarios
      const calls = consoleLogSpy.mock.calls.flat()
      const hasPracticalExamples = calls.some(call => 
        typeof call === 'string' && (
          call.includes('vercel') || 
          call.includes('netlify') ||
          call.includes('docker')
        )
      )
      expect(hasPracticalExamples).toBe(true)
    })
  })
})