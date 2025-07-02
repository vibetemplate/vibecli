import fs from 'fs-extra'
import path from 'path'
import { jest } from '@jest/globals'
import {
  getInstalledTemplatePath,
  listInstalledTemplates,
  installTemplate,
  removeTemplate,
  fetchRemoteTemplateIndex,
  InstalledRegistry
} from '../../utils/template-store.js'

// Mock dependencies
jest.mock('fs-extra')
jest.mock('../../utils/signature.js')

const mockFs = fs as jest.Mocked<typeof fs> & {
  pathExists: jest.MockedFunction<any>  
  remove: jest.MockedFunction<any>
  readJson: jest.MockedFunction<any>
  writeJson: jest.MockedFunction<any>
  ensureDir: jest.MockedFunction<any>
  createReadStream: jest.MockedFunction<any>
}

describe('Template Store', () => {
  const mockTempDir = '/tmp/vibecli-test'
  const mockTemplatesDir = path.join(mockTempDir, '.vibecli', 'templates')
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock process.env
    process.env.HOME = mockTempDir
    process.env.USERPROFILE = mockTempDir
  })

  describe('getInstalledTemplatePath', () => {
    it('should return null for non-existent template', async () => {
      mockFs.pathExists.mockResolvedValue(false)
      
      const result = getInstalledTemplatePath('non-existent')
      expect(result).toBeNull()
    })

    it('should return path for existing template', async () => {
      const templateName = 'ecommerce'
      const expectedPath = path.join(mockTemplatesDir, templateName)
      
      mockFs.pathExists.mockResolvedValue(true)
      
      const result = getInstalledTemplatePath(templateName)
      expect(result).toBe(expectedPath)
    })
  })

  describe('listInstalledTemplates', () => {
    it('should return empty array when templates directory does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false)
      
      const result = await listInstalledTemplates()
      expect(result).toEqual([])
    })

    it('should list installed templates with metadata', async () => {
      const mockTemplates = ['ecommerce', 'blog']
      const mockManifest = {
        name: 'ecommerce',
        description: 'E-commerce template',
        version: '1.0.0'
      }

      mockFs.pathExists.mockImplementation((path: string) => {
        if (path === mockTemplatesDir) return Promise.resolve(true)
        if (path.includes('template.json')) return Promise.resolve(true)
        return Promise.resolve(false)
      })
      
      mockFs.readdir.mockResolvedValue(mockTemplates as any)
      mockFs.readJson.mockResolvedValue(mockManifest)

      const result = await listInstalledTemplates()
      
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        name: 'ecommerce',
        description: 'E-commerce template',
        version: '1.0.0'
      })
    })
  })

  describe('InstalledRegistry', () => {
    let registry: InstalledRegistry

    beforeEach(() => {
      registry = new InstalledRegistry()
    })

    it('should add and retrieve template', async () => {
      const templateInfo = {
        name: 'test-template',
        version: '1.0.0',
        installedAt: new Date().toISOString(),
        sourceUrl: 'https://example.com/template.zip'
      }

      mockFs.pathExists.mockResolvedValue(false)
      mockFs.writeJson.mockResolvedValue(undefined)

      await registry.add(templateInfo)
      
      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('registry.json'),
        expect.objectContaining({
          templates: expect.arrayContaining([templateInfo])
        }),
        { spaces: 2 }
      )
    })

    it('should remove template from registry', async () => {
      const existingRegistry = {
        templates: [
          { name: 'template1', version: '1.0.0' },
          { name: 'template2', version: '1.1.0' }
        ]
      }

      mockFs.pathExists.mockResolvedValue(true)
      mockFs.readJson.mockResolvedValue(existingRegistry)
      mockFs.writeJson.mockResolvedValue(undefined)

      await registry.remove('template1')

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('registry.json'),
        expect.objectContaining({
          templates: expect.arrayContaining([
            expect.objectContaining({ name: 'template2' })
          ])
        }),
        { spaces: 2 }
      )
    })
  })

  describe('fetchRemoteTemplateIndex', () => {
    // Mock fetch for Node.js environment
    const mockFetch = jest.fn()
    global.fetch = mockFetch as any

    beforeEach(() => {
      mockFetch.mockClear()
    })

    it('should fetch and cache remote template index', async () => {
      const mockIndex = {
        generatedAt: new Date().toISOString(),
        storeVersion: '1.0',
        templates: [
          {
            name: 'ecommerce',
            description: 'E-commerce template',
            latest: '1.0.0',
            versions: [{ version: '1.0.0', file: 'ecommerce.zip', sha256: 'abc123' }]
          }
        ]
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockIndex)
      })

      mockFs.pathExists.mockResolvedValue(false)
      mockFs.writeJson.mockResolvedValue(undefined)

      const result = await fetchRemoteTemplateIndex()

      expect(result).toEqual(mockIndex)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('index.json'),
        expect.objectContaining({ method: 'GET' })
      )
      expect(mockFs.writeJson).toHaveBeenCalled()
    })

    it('should use cached index when within TTL', async () => {
      const cachedIndex = {
        generatedAt: new Date().toISOString(),
        storeVersion: '1.0',
        templates: []
      }

      mockFs.pathExists.mockResolvedValue(true)
      mockFs.readJson.mockResolvedValue(cachedIndex)
      mockFs.stat.mockResolvedValue({
        mtime: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      } as any)

      const result = await fetchRemoteTemplateIndex()

      expect(result).toEqual(cachedIndex)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should refresh cache when TTL expired', async () => {
      const newIndex = {
        generatedAt: new Date().toISOString(),
        storeVersion: '1.0',
        templates: []
      }

      mockFs.pathExists.mockResolvedValue(true)
      mockFs.stat.mockResolvedValue({
        mtime: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago (expired)
      } as any)

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(newIndex)
      })
      mockFs.writeJson.mockResolvedValue(undefined)

      const result = await fetchRemoteTemplateIndex()

      expect(result).toEqual(newIndex)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      mockFs.pathExists.mockResolvedValue(false)

      await expect(fetchRemoteTemplateIndex()).rejects.toThrow('Network error')
    })
  })

  describe('installTemplate', () => {
    beforeEach(() => {
      // Mock fetch for download
      global.fetch = jest.fn()
    })

    it('should install template successfully', async () => {
      const templateName = 'ecommerce'
      const mockIndex = {
        templates: [
          {
            name: templateName,
            latest: '1.0.0',
            versions: [
              {
                version: '1.0.0',
                file: 'ecommerce.zip',
                sha256: 'valid-hash'
              }
            ]
          }
        ]
      }

      // Mock successful network and file operations
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      })

      mockFs.pathExists.mockImplementation((path: string) => {
        if (path.includes('templates')) return Promise.resolve(true)
        return Promise.resolve(false)
      })
      mockFs.ensureDir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)

      // Mock signature verification
      const { computeSha256, verifyEd25519 } = await import('../../utils/signature.js')
      ;(computeSha256 as jest.Mock).mockResolvedValue('valid-hash')
      ;(verifyEd25519 as jest.Mock).mockReturnValue(true)

      // Mock ADM-ZIP
      const mockZip = {
        extractAllTo: jest.fn()
      }
      jest.doMock('adm-zip', () => {
        return jest.fn().mockImplementation(() => mockZip)
      })

      const result = await installTemplate(templateName, mockIndex as any)

      expect(result.success).toBe(true)
      expect(result.installedPath).toContain(templateName)
    })

    it('should fail when template not found in index', async () => {
      const mockIndex = { templates: [] }

      const result = await installTemplate('non-existent', mockIndex as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should fail when signature verification fails', async () => {
      const templateName = 'ecommerce'
      const mockIndex = {
        templates: [
          {
            name: templateName,
            latest: '1.0.0',
            versions: [{ version: '1.0.0', file: 'ecommerce.zip', sha256: 'hash' }]
          }
        ]
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      })

      // Mock signature verification failure
      const { verifyEd25519 } = await import('../../utils/signature.js')
      ;(verifyEd25519 as jest.Mock).mockReturnValue(false)

      const result = await installTemplate(templateName, mockIndex as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('signature verification failed')
    })
  })

  describe('removeTemplate', () => {
    it('should remove template successfully', async () => {
      const templateName = 'ecommerce'
      
      mockFs.pathExists.mockResolvedValue(true)
      mockFs.remove.mockResolvedValue(undefined)

      // Mock the registry functions
      jest.doMock('../../utils/template-store.js', () => ({
        ...jest.requireActual('../../utils/template-store.js'),
        getInstalledRegistry: jest.fn().mockReturnValue({ ecommerce: ['1.0.0'] })
      }))

      const result = await removeTemplate(templateName)

      expect(result.success).toBe(true)
      expect(mockFs.remove).toHaveBeenCalledWith(
        expect.stringContaining(templateName)
      )
    })

    it('should handle removal of non-existent template', async () => {
      const templateName = 'non-existent'
      
      mockFs.pathExists.mockResolvedValue(false)

      const result = await removeTemplate(templateName)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not installed')
    })
  })
})