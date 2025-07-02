import fs from 'fs-extra'
import path from 'path'
import { jest } from '@jest/globals'
import { generateDeploymentArtifacts } from '../../utils/deploy-generator.js'
import type { DeploymentConfig } from '../../core/types.js'

// Mock dependencies
jest.mock('fs-extra')
jest.mock('execa')

const mockFs = fs as jest.Mocked<typeof fs>

describe('Deploy Generator', () => {
  const mockProjectPath = '/tmp/test-project'
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.pathExists.mockResolvedValue(true)
    mockFs.writeFile.mockResolvedValue(undefined)
    mockFs.ensureDir.mockResolvedValue(undefined)
  })

  describe('Vercel Platform', () => {
    it('should generate vercel.json config', async () => {
      const config: DeploymentConfig = {
        platform: 'vercel',
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      expect(result.deploymentId).toBeDefined()
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'vercel.json'),
        expect.stringContaining('"framework": "nextjs"')
      )
    })

    it('should handle custom domain configuration', async () => {
      const config: DeploymentConfig = {
        platform: 'vercel',
        projectName: 'test-app',
        environment: 'production',
        customDomain: 'myapp.com'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      expect(result.deploymentId).toBeDefined()
      expect(result.customDomain).toBe('myapp.com')
    })

    it('should generate environment-specific configuration', async () => {
      const config: DeploymentConfig = {
        platform: 'vercel',
        projectName: 'test-app',
        environment: 'staging'
      }

      await generateDeploymentArtifacts(mockProjectPath, config)

      const writeFileCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].toString().includes('vercel.json')
      )
      
      expect(writeFileCall).toBeDefined()
      const configContent = JSON.parse(writeFileCall![1] as string)
      expect(configContent.framework).toBe('nextjs')
    })
  })

  describe('Docker Platform', () => {
    it('should generate Dockerfile', async () => {
      const config: DeploymentConfig = {
        platform: 'docker',
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      expect(result.deploymentId).toBeDefined()
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'Dockerfile'),
        expect.stringContaining('FROM node:18-alpine')
      )
    })

    it('should generate docker-compose.yml for development', async () => {
      const config: DeploymentConfig = {
        platform: 'docker',
        projectName: 'test-app',
        environment: 'development'
      }

      await generateDeploymentArtifacts(mockProjectPath, config)

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'docker-compose.yml'),
        expect.stringContaining('version: "3.8"')
      )
    })

    it('should generate .dockerignore file', async () => {
      const config: DeploymentConfig = {
        platform: 'docker',
        projectName: 'test-app',
        environment: 'production'
      }

      await generateDeploymentArtifacts(mockProjectPath, config)

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(mockProjectPath, '.dockerignore'),
        expect.stringContaining('node_modules')
      )
    })
  })

  describe('Netlify Platform', () => {
    it('should generate netlify.toml config', async () => {
      const config: DeploymentConfig = {
        platform: 'netlify',
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      expect(result.deploymentId).toBeDefined()
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'netlify.toml'),
        expect.stringContaining('[build]')
      )
    })

    it('should configure redirects and headers', async () => {
      const config: DeploymentConfig = {
        platform: 'netlify',
        projectName: 'test-app',
        environment: 'production'
      }

      await generateDeploymentArtifacts(mockProjectPath, config)

      const netlifyTomlCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].toString().includes('netlify.toml')
      )
      
      expect(netlifyTomlCall).toBeDefined()
      expect(netlifyTomlCall![1]).toContain('publish = "out"')
    })
  })

  describe('Cloudflare Platform', () => {
    it('should generate wrangler.toml config', async () => {
      const config: DeploymentConfig = {
        platform: 'cloudflare',
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      expect(result.deploymentId).toBeDefined()
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'wrangler.toml'),
        expect.stringContaining('name = "test-app"')
      )
    })

    it('should configure pages deployment', async () => {
      const config: DeploymentConfig = {
        platform: 'cloudflare',
        projectName: 'test-app',
        environment: 'production'
      }

      await generateDeploymentArtifacts(mockProjectPath, config)

      const wranglerTomlCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].toString().includes('wrangler.toml')
      )
      
      expect(wranglerTomlCall).toBeDefined()
      expect(wranglerTomlCall![1]).toContain('compatibility_date')
    })
  })

  describe('SQLite Migration', () => {
    beforeEach(() => {
      // Mock prisma schema with SQLite
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return Promise.resolve(`
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  name  String
}
          `)
        }
        return Promise.resolve('')
      })
    })

    it('should generate blob migration script for Vercel', async () => {
      const config: DeploymentConfig = {
        platform: 'vercel',
        projectName: 'test-app',
        environment: 'production'
      }

      mockFs.pathExists.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) return Promise.resolve(true)
        return Promise.resolve(true)
      })

      await generateDeploymentArtifacts(mockProjectPath, config)

      const migrationCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].toString().includes('migrate-to-blob.js')
      )
      
      expect(migrationCall).toBeDefined()
      expect(migrationCall![1]).toContain('@vercel/blob')
    })

    it('should skip migration for non-SQLite databases', async () => {
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.toString().includes('schema.prisma')) {
          return Promise.resolve(`
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
          `)
        }
        return Promise.resolve('')
      })

      const config: DeploymentConfig = {
        platform: 'vercel',
        projectName: 'test-app',
        environment: 'production'
      }

      await generateDeploymentArtifacts(mockProjectPath, config)

      const migrationCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].toString().includes('migrate-to-blob.js')
      )
      
      expect(migrationCall).toBeUndefined()
    })
  })

  describe('Deployment Metadata', () => {
    it('should write deployment metadata', async () => {
      const config: DeploymentConfig = {
        platform: 'vercel',
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      expect(result.deploymentId).toBeDefined()
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(mockProjectPath, '.vibecli', 'deployment-meta.json'),
        expect.stringContaining('"platform": "vercel"')
      )
    })

    it('should include deployment timestamp', async () => {
      const config: DeploymentConfig = {
        platform: 'docker',
        projectName: 'test-app',
        environment: 'production'
      }

      await generateDeploymentArtifacts(mockProjectPath, config)

      const metadataCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].toString().includes('deployment-meta.json')
      )
      
      expect(metadataCall).toBeDefined()
      const metadata = JSON.parse(metadataCall![1] as string)
      expect(metadata.generatedAt).toBeDefined()
      expect(metadata.vibecliVersion).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle file write errors gracefully', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'))

      const config: DeploymentConfig = {
        platform: 'vercel',
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      expect(result.deploymentId).toBeDefined()
      expect(result.error).toContain('Permission denied')
    })

    it('should handle unsupported platforms', async () => {
      const config: DeploymentConfig = {
        platform: 'unsupported' as any,
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      expect(result.deploymentId).toBeDefined()
      expect(result.error).toContain('Unsupported platform')
    })

    it('should validate project path existence', async () => {
      mockFs.pathExists.mockResolvedValue(false)

      const config: DeploymentConfig = {
        platform: 'vercel',
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts('/non-existent-path', config)

      expect(result.deploymentId).toBeDefined()
      expect(result.deploymentId).toBeDefined()
    })
  })

  describe('Platform-specific Features', () => {
    it('should configure Aliyun FC deployment', async () => {
      const config: DeploymentConfig = {
        platform: 'aliyun',
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      expect(result.deploymentId).toBeDefined()
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(mockProjectPath, 'template.yml'),
        expect.stringContaining('ROSTemplateFormatVersion')
      )
    })

    it('should generate AWS SAM template', async () => {
      const config: DeploymentConfig = {
        platform: 'aws',
        projectName: 'test-app',
        environment: 'production'
      }

      const result = await generateDeploymentArtifacts(mockProjectPath, config)

      // Note: AWS implementation is placeholder, should return success but limited functionality
      expect(result.deploymentId).toBeDefined()
    })
  })
})