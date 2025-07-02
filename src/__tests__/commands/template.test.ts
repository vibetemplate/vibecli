import { jest } from '@jest/globals'
import { templateCmd } from '../../commands/template.js'

// Mock dependencies
jest.mock('../../utils/template-store.js')
jest.mock('chalk', () => ({
  green: jest.fn((text) => text),
  red: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  gray: jest.fn((text) => text)
}))

import * as templateStore from '../../utils/template-store.js'
const mockTemplateStore = templateStore as jest.Mocked<typeof templateStore>

describe('Template Command', () => {
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

  describe('list command', () => {
    it('should list remote templates when available', async () => {
      const mockIndex = {
        templates: [
          {
            name: 'ecommerce',
            description: 'E-commerce template',
            latest: '1.0.0',
            versions: [{ version: '1.0.0', file: 'ecommerce.zip' }]
          },
          {
            name: 'blog',
            description: 'Blog template',
            latest: '1.1.0',
            versions: [{ version: '1.1.0', file: 'blog.zip' }]
          }
        ]
      }

      ;(mockTemplateStore.fetchRemoteTemplateIndex as jest.Mock).mockResolvedValue(mockIndex)
      ;(mockTemplateStore.listInstalledTemplates as jest.Mock).mockResolvedValue([
        { name: 'ecommerce', version: '1.0.0', installedAt: '2024-01-01' }
      ])

      await templateCmd('list')

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('远程模板商店'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ecommerce'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('blog'))
    })

    it('should show installed templates', async () => {
      const mockIndex = { templates: [] }
      const mockInstalled = [
        { name: 'ecommerce', version: '1.0.0', installedAt: '2024-01-01' },
        { name: 'custom-template', version: '2.0.0', installedAt: '2024-01-02' }
      ]

      ;(mockTemplateStore.fetchRemoteTemplateIndex as jest.Mock).mockResolvedValue(mockIndex)
      ;(mockTemplateStore.listInstalledTemplates as jest.Mock).mockResolvedValue(mockInstalled)

      await templateCmd('list')

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('已安装的模板'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ecommerce'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('custom-template'))
    })

    it('should handle network errors gracefully', async () => {
      ;(mockTemplateStore.fetchRemoteTemplateIndex as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      )
      ;(mockTemplateStore.listInstalledTemplates as jest.Mock).mockResolvedValue([])

      await templateCmd('list')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('获取远程模板失败')
      )
    })

    it('should show empty state when no templates available', async () => {
      const mockIndex = { templates: [] }

      ;(mockTemplateStore.fetchRemoteTemplateIndex as jest.Mock).mockResolvedValue(mockIndex)
      ;(mockTemplateStore.listInstalledTemplates as jest.Mock).mockResolvedValue([])

      await templateCmd('list')

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('暂无可用模板'))
    })
  })

  describe('install command', () => {
    it('should install template successfully', async () => {
      const templateName = 'ecommerce'
      const mockIndex = {
        templates: [
          {
            name: templateName,
            latest: '1.0.0',
            versions: [{ version: '1.0.0', file: 'ecommerce.zip' }]
          }
        ]
      }

      ;(mockTemplateStore.fetchRemoteTemplateIndex as jest.Mock).mockResolvedValue(mockIndex)
      ;(mockTemplateStore.installTemplate as jest.Mock).mockResolvedValue({
        success: true,
        installedPath: '/path/to/template'
      })

      await templateCmd('install', templateName)

      expect(mockTemplateStore.installTemplate).toHaveBeenCalledWith(templateName, mockIndex)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('安装成功')
      )
    })

    it('should handle installation failures', async () => {
      const templateName = 'nonexistent'
      const mockIndex = { templates: [] }

      ;(mockTemplateStore.fetchRemoteTemplateIndex as jest.Mock).mockResolvedValue(mockIndex)
      ;(mockTemplateStore.installTemplate as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Template not found in remote index'
      })

      await templateCmd('install', templateName)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('安装失败')
      )
    })

    it('should require template name for install', async () => {
      await templateCmd('install')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('请指定模板名称')
      )
    })

    it('should handle network errors during install', async () => {
      const templateName = 'ecommerce'

      ;(mockTemplateStore.fetchRemoteTemplateIndex as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      )

      await templateCmd('install', templateName)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('网络错误')
      )
    })
  })

  describe('remove command', () => {
    it('should remove template successfully', async () => {
      const templateName = 'ecommerce'

      ;(mockTemplateStore.removeTemplate as jest.Mock).mockResolvedValue({
        success: true
      })

      await templateCmd('remove', templateName)

      expect(mockTemplateStore.removeTemplate).toHaveBeenCalledWith(templateName)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('移除成功')
      )
    })

    it('should handle removal failures', async () => {
      const templateName = 'nonexistent'

      ;(mockTemplateStore.removeTemplate as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Template not installed'
      })

      await templateCmd('remove', templateName)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('移除失败')
      )
    })

    it('should require template name for remove', async () => {
      await templateCmd('remove')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('请指定模板名称')
      )
    })
  })

  describe('invalid commands', () => {
    it('should show error for unknown action', async () => {
      await templateCmd('unknown-action' as any)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('未知操作')
      )
    })

    it('should show usage help for invalid commands', async () => {
      await templateCmd('invalid' as any)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('使用方法')
      )
    })
  })

  describe('table formatting', () => {
    it('should format template table correctly', async () => {
      const mockIndex = {
        templates: [
          {
            name: 'very-long-template-name-that-might-overflow',
            description: 'This is a very long description that should be truncated properly',
            latest: '1.0.0'
          }
        ]
      }

      ;(mockTemplateStore.fetchRemoteTemplateIndex as jest.Mock).mockResolvedValue(mockIndex)
      ;(mockTemplateStore.listInstalledTemplates as jest.Mock).mockResolvedValue([])

      await templateCmd('list')

      // Check that table headers are displayed
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('模板名称')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('描述')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('版本')
      )
    })

    it('should indicate installed status in template list', async () => {
      const mockIndex = {
        templates: [
          { name: 'ecommerce', description: 'E-commerce', latest: '1.0.0' },
          { name: 'blog', description: 'Blog template', latest: '1.1.0' }
        ]
      }

      ;(mockTemplateStore.fetchRemoteTemplateIndex as jest.Mock).mockResolvedValue(mockIndex)
      ;(mockTemplateStore.listInstalledTemplates as jest.Mock).mockResolvedValue([
        { name: 'ecommerce', version: '1.0.0' }
      ])

      await templateCmd('list')

      // Should show installed indicator for ecommerce template
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('已安装')
      )
    })
  })
})