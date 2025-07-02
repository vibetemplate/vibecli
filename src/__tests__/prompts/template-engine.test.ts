// @ts-nocheck

import { PromptTemplateEngine } from '../../prompts/dynamic/template-engine.js'
import type { PromptContext } from '../../core/types.js'
import { jest } from '@jest/globals'
import fs from 'fs'
import path from 'path'

// Mock filesystem operations
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

describe('PromptTemplateEngine', () => {
  let engine: PromptTemplateEngine
  const mockTemplatesPath = '/mock/templates'

  beforeEach(() => {
    // 清除 mock
    jest.clearAllMocks()
    
    // Mock readFileSync to return template content
    mockFs.readFileSync.mockImplementation((filePath: any, options?: any): any => {
      const pathStr = filePath.toString()
      let content: string | null = null

      if (pathStr.includes('ecommerce/main-prompt.md')) {
        content = `# VibeCLI 电商开发专家模式

我是 VibeCLI 电商开发专家，专门为您的 **{{project_name}}** 电商项目提供专业技术指导。

## 🎯 项目概览

**项目类型**: {{project_type}}
**复杂度等级**: {{complexity_level}}
**检测到的核心功能**: {{#each detected_features}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
**推荐技术栈**: {{tech_stack}}

{{#if has_payment_feature}}
### 支付集成
您的项目已检测到 **支付** 功能，推荐使用 **Stripe**。
{{/if}}

## 🚀 下一步
请确认以上信息，VibeCLI 将为您生成量身定制的开发框架。

记住：专注于用户体验，确保购物流程顺畅！

---
*此提示词由 VibeCLI v{{vibecli_version}} 智能生成。*`
      }
      
      if (pathStr.includes('base/')) {
        content = `# VibeCLI 基础指导\\n\\n这是基础开发指导内容。`
      }

      if (content !== null) {
        if (options && (typeof options === 'string' || options?.encoding)) {
          return content as any
        }
        return Buffer.from(content) as any
      }
      
      if (options && (typeof options === 'string' || options?.encoding)) {
        return ''
      }
      return Buffer.from('')
    })

    mockFs.existsSync.mockImplementation((filePath: any) => {
      const p = filePath.toString()
      return p.includes('ecommerce') || p.includes('base/')
    })

    engine = new PromptTemplateEngine(mockTemplatesPath)
  })

  describe('getTemplate', () => {
    it('应该返回正确的模板信息', () => {
      const template = engine.getTemplate('ecommerce')
      
      expect(template).not.toBeNull()
      expect(template?.projectType).toBe('ecommerce')
      expect(template?.id).toBe('ecommerce-main')
      expect(template?.variables).toContain('project_name')
      expect(template?.variables).toContain('project_type')
    })

    it('应该为不存在的项目类型返回null', () => {
      const template = engine.getTemplate('nonexistent')
      
      expect(template).toBeNull()
    })

    it('应该不区分大小写', () => {
      const template = engine.getTemplate('ECOMMERCE')
      
      expect(template).not.toBeNull()
      expect(template?.projectType).toBe('ecommerce')
    })
  })

  describe('renderPrompt', () => {
    it('应该成功渲染电商模板', async () => {
      const context: PromptContext = {
        project_name: 'MyShop',
        project_type: 'ecommerce',
        complexity_level: 'medium',
        detected_features: ['auth', 'payment'],
        tech_stack: 'Next.js + TypeScript + Stripe',
        vibecli_version: '1.3.0',
        current_date: '2024-01-01',
        has_payment_feature: true
      }

      const result = await engine.renderPrompt('ecommerce', context)

      expect(result.success).toBe(true)
      expect(result.prompt).toContain('MyShop')
      expect(result.prompt).toContain('ecommerce')
      expect(result.prompt).toContain('medium')
      expect(result.prompt).toContain('auth, payment')
      expect(result.prompt).toContain('支付功能已启用')
      expect(result.metadata.templateUsed).toBe('ecommerce-main')
      expect(result.metadata.projectType).toBe('ecommerce')
    })

    it('应该为不存在的模板返回错误', async () => {
      const context: PromptContext = {
        project_name: 'Test',
        project_type: 'unknown',
        complexity_level: 'simple',
        detected_features: [],
        tech_stack: 'Next.js',
        vibecli_version: '1.3.0',
        current_date: '2024-01-01'
      }

      const result = await engine.renderPrompt('unknown', context)

      expect(result.success).toBe(false)
      expect(result.error).toContain('未找到项目类型')
    })

    it('应该处理文件读取错误', async () => {
      // Mock fs to throw error
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error')
      })

      const context: PromptContext = {
        project_name: 'Test',
        project_type: 'ecommerce',
        complexity_level: 'simple',
        detected_features: [],
        tech_stack: 'Next.js',
        vibecli_version: '1.3.0',
        current_date: '2024-01-01'
      }

      const result = await engine.renderPrompt('ecommerce', context)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File read error')
    })

    it('应该正确计算置信度分数', async () => {
      const context: PromptContext = {
        project_name: 'FullFeatureShop',
        project_type: 'ecommerce',
        complexity_level: 'complex',
        detected_features: ['auth', 'payment', 'admin', 'upload'],
        tech_stack: 'Next.js + TypeScript + Prisma + Stripe',
        vibecli_version: '1.3.0',
        current_date: '2024-01-01'
      }

      const result = await engine.renderPrompt('ecommerce', context)

      expect(result.success).toBe(true)
      expect(result.metadata.confidenceScore).toBeGreaterThan(70)
    })
  })

  describe('getAvailableTemplates', () => {
    it('应该返回所有可用模板', () => {
      const templates = engine.getAvailableTemplates()
      
      expect(templates).toHaveLength(5)
      expect(templates.map(t => t.projectType)).toContain('ecommerce')
      expect(templates.map(t => t.projectType)).toContain('saas')
      expect(templates.map(t => t.projectType)).toContain('blog')
      expect(templates.map(t => t.projectType)).toContain('portfolio')
      expect(templates.map(t => t.projectType)).toContain('dashboard')
    })
  })

  describe('previewTemplate', () => {
    it('应该返回模板预览', () => {
      const preview = engine.previewTemplate('ecommerce')
      
      expect(preview).not.toBeNull()
      expect(preview).toContain('VibeCLI 电商开发专家模式')
      expect(preview?.length).toBeLessThanOrEqual(203) // 200 + "..."
    })

    it('应该为不存在的模板返回null', () => {
      const preview = engine.previewTemplate('nonexistent')
      
      expect(preview).toBeNull()
    })

    it('应该处理文件读取错误', () => {
      // Mock fs to throw error
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      const preview = engine.previewTemplate('ecommerce')
      
      expect(preview).toBeNull()
    })
  })
})