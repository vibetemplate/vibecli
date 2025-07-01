import { PromptTemplateEngine } from '../../prompts/dynamic/template-engine.js'
import { IntentAnalyzer } from '../../prompts/dynamic/intent-analyzer.js'
import type { PromptGenerationConfig, PromptContext } from '../../core/types.js'
import { jest } from '@jest/globals'
import fs from 'fs'

// Mock filesystem operations
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

describe('Prompt Generation Integration', () => {
  let templateEngine: PromptTemplateEngine
  let intentAnalyzer: IntentAnalyzer

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock template files
    mockFs.readFileSync.mockImplementation((filePath: any) => {
      const pathStr = filePath.toString()
      
      if (pathStr.includes('ecommerce/main-prompt.md')) {
        return `# VibeCLI 电商开发专家模式

我是专门为 **{{project_name}}** 电商项目提供指导的专家。

## 项目信息
- 类型: {{project_type}}
- 复杂度: {{complexity_level}}
- 功能: {{#each detected_features}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- 技术栈: {{tech_stack}}

{{#if has_payment_feature}}
## 支付功能
您的项目包含支付功能，建议使用 Stripe 进行集成。
{{/if}}

生成时间: {{current_date}}
VibeCLI 版本: {{vibecli_version}}`
      }
      
      if (pathStr.includes('saas/main-prompt.md')) {
        return `# VibeCLI SaaS 开发专家模式

专门为 **{{project_name}}** SaaS 平台提供指导。

## 项目信息
- 类型: {{project_type}}
- 复杂度: {{complexity_level}}
- 功能: {{#each detected_features}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

{{#if has_billing_feature}}
## 订阅计费
SaaS 平台需要订阅计费功能。
{{/if}}`
      }
      
      if (pathStr.includes('base/')) {
        return '# VibeCLI 基础指导'
      }
      
      throw new Error(`Template not found: ${pathStr}`)
    })

    templateEngine = new PromptTemplateEngine('/mock/templates')
    intentAnalyzer = new IntentAnalyzer()
  })

  describe('完整的提示词生成流程', () => {
    it('应该完整处理电商项目需求', async () => {
      // 1. 用户输入
      const config: PromptGenerationConfig = {
        userDescription: '我要开发一个名为ShopMaster的电商网站，需要用户注册、购物车、支付功能和管理后台'
      }

      // 2. 意图分析
      const intent = await intentAnalyzer.analyzeUserIntent(config)
      
      expect(intent.projectType).toBe('ecommerce')
      expect(intent.coreFeatures).toContain('auth')
      expect(intent.coreFeatures).toContain('payment')
      expect(intent.coreFeatures).toContain('admin')

      // 3. 构建上下文
      const context: PromptContext = {
        project_name: 'ShopMaster',
        project_type: intent.projectType,
        complexity_level: intent.complexityLevel,
        detected_features: intent.coreFeatures,
        tech_stack: 'Next.js + TypeScript + Prisma + Stripe',
        vibecli_version: '1.3.0',
        current_date: '2024-01-01',
        has_payment_feature: intent.coreFeatures.includes('payment')
      }

      // 4. 生成提示词
      const result = await templateEngine.renderPrompt(intent.projectType, context)

      expect(result.success).toBe(true)
      expect(result.prompt).toContain('ShopMaster')
      expect(result.prompt).toContain('ecommerce')
      expect(result.prompt).toContain('auth, payment, admin')
      expect(result.prompt).toContain('支付功能')
      expect(result.prompt).toContain('Stripe')
      expect(result.metadata.projectType).toBe('ecommerce')
    })

    it('应该正确处理SaaS项目需求', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '开发企业级SaaS平台CloudSync，支持多租户、订阅计费、团队管理和API接口'
      }

      const intent = await intentAnalyzer.analyzeUserIntent(config)
      
      expect(intent.projectType).toBe('saas')
      expect(intent.complexityLevel).toBe('complex') // 因为包含"企业级"关键词

      const context: PromptContext = {
        project_name: 'CloudSync',
        project_type: intent.projectType,
        complexity_level: intent.complexityLevel,
        detected_features: intent.coreFeatures,
        tech_stack: 'Next.js + TypeScript + Prisma',
        vibecli_version: '1.3.0',
        current_date: '2024-01-01',
        has_billing_feature: true
      }

      const result = await templateEngine.renderPrompt(intent.projectType, context)

      expect(result.success).toBe(true)
      expect(result.prompt).toContain('CloudSync')
      expect(result.prompt).toContain('SaaS')
      expect(result.prompt).toContain('complex')
      expect(result.prompt).toContain('订阅计费')
    })

    it('应该处理简单的博客项目', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '创建个人博客MyBlog，简单的文章发布功能'
      }

      const intent = await intentAnalyzer.analyzeUserIntent(config)
      
      expect(intent.projectType).toBe('blog')
      expect(intent.complexityLevel).toBe('simple')

      const context: PromptContext = {
        project_name: 'MyBlog',
        project_type: intent.projectType,
        complexity_level: intent.complexityLevel,
        detected_features: intent.coreFeatures,
        tech_stack: 'Next.js + TypeScript',
        vibecli_version: '1.3.0',
        current_date: '2024-01-01'
      }

      // 博客模板不存在，应该返回错误
      const result = await templateEngine.renderPrompt(intent.projectType, context)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('未找到项目类型')
    })
  })

  describe('边界情况处理', () => {
    it('应该处理模糊的项目描述', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '做个网站'
      }

      const intent = await intentAnalyzer.analyzeUserIntent(config)
      
      expect(intent.confidence).toBeLessThan(60)
      
      const validation = intentAnalyzer.validateIntent(intent)
      expect(validation.warnings.length).toBeGreaterThan(0)
    })

    it('应该处理包含多种项目特征的描述', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '开发一个电商平台，需要博客功能展示产品，还要管理后台分析数据'
      }

      const intent = await intentAnalyzer.analyzeUserIntent(config)
      
      // 应该识别为电商（权重最高）
      expect(intent.projectType).toBe('ecommerce')
      // 但应该包含其他功能
      expect(intent.coreFeatures).toContain('admin')
      expect(intent.coreFeatures).toContain('analytics')
    })

    it('应该处理英文项目描述', async () => {
      const config: PromptGenerationConfig = {
        userDescription: 'Build an e-commerce website called TechStore with shopping cart and payment processing using Stripe'
      }

      const intent = await intentAnalyzer.analyzeUserIntent(config)
      
      expect(intent.projectType).toBe('ecommerce')
      expect(intent.coreFeatures).toContain('payment')
      expect(intent.techPreferences).toContain('Stripe')
    })
  })

  describe('与现有分析结果的集成', () => {
    it('应该使用现有的project_analyzer结果', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '电商网站',
        projectType: 'ecommerce', // 来自 project_analyzer
        detectedFeatures: ['auth', 'payment', 'upload'], // 来自 project_analyzer
        techStack: ['PostgreSQL', 'Stripe'] // 来自 project_analyzer
      }

      const intent = await intentAnalyzer.analyzeUserIntent(config)
      
      // 应该使用预设的值
      expect(intent.projectType).toBe('ecommerce')
      expect(intent.coreFeatures).toEqual(expect.arrayContaining(['auth', 'payment', 'upload']))
      expect(intent.techPreferences).toEqual(expect.arrayContaining(['PostgreSQL', 'Stripe']))
    })

    it('应该在现有分析基础上增强功能检测', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '电商网站需要实时聊天客服和邮件通知',
        projectType: 'ecommerce',
        detectedFeatures: ['auth', 'payment']
      }

      const intent = await intentAnalyzer.analyzeUserIntent(config)
      
      // 应该保留原有功能
      expect(intent.coreFeatures).toEqual(expect.arrayContaining(['auth', 'payment']))
      // 应该添加新检测到的功能
      expect(intent.coreFeatures).toContain('realtime') // 实时聊天
      expect(intent.coreFeatures).toContain('email') // 邮件通知
    })
  })
})