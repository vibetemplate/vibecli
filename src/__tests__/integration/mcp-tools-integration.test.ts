import { AIDecisionEngine } from '../../mcp/ai-decision-engine.js'
import { promptTemplateEngine } from '../../prompts/dynamic/template-engine.js'
import { intentAnalyzer } from '../../prompts/dynamic/intent-analyzer.js'
import type { PromptGenerationConfig, PromptContext } from '../../core/types.js'
import { jest } from '@jest/globals'
import fs from 'fs'

// Mock filesystem operations for template engine
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

describe('MCP Tools Integration', () => {
  let aiEngine: AIDecisionEngine

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock template files
    mockFs.readFileSync.mockImplementation((filePath: any) => {
      const pathStr = filePath.toString()
      
      if (pathStr.includes('ecommerce/main-prompt.md')) {
        return `# VibeCLI 电商开发专家模式

我是专门为 **{{project_name}}** 电商项目提供指导的专家。

## 🎯 项目概览
**项目类型**: {{project_type}}
**复杂度**: {{complexity_level}}
**核心功能**: {{#each detected_features}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
**技术栈**: {{tech_stack}}

{{#if has_payment_feature}}
## 💳 支付集成
您的项目包含支付功能，建议使用以下配置：
- 支付网关: Stripe
- 安全措施: PCI DSS 合规
- 货币支持: 多货币
{{/if}}

## 🚀 开发建议
基于 VibeCLI 架构，确保遵循以下最佳实践：
1. 使用 TypeScript 进行类型安全
2. 实现完整的错误处理
3. 优化数据库查询性能

---
*此提示词由 VibeCLI v{{vibecli_version}} 智能生成*`
      }
      
      if (pathStr.includes('saas/main-prompt.md')) {
        return `# VibeCLI SaaS 开发专家模式

专门为 **{{project_name}}** SaaS 平台提供指导。

## 🎯 项目概览
**项目类型**: {{project_type}}
**复杂度**: {{complexity_level}}
**核心功能**: {{#each detected_features}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

{{#if has_billing_feature}}
## 💰 订阅计费
SaaS 平台的订阅计费系统配置：
- 计费周期: 月付/年付
- 试用期: 14天免费试用
- 升级路径: 平滑升级机制
{{/if}}

## 🏢 多租户架构
实现企业级多租户支持。

---
*VibeCLI v{{vibecli_version}} 生成*`
      }
      
      if (pathStr.includes('base/')) {
        return '# VibeCLI 基础开发指导\n\n这是通用的开发最佳实践。'
      }
      
      throw new Error(`Template not found: ${pathStr}`)
    })

    aiEngine = new AIDecisionEngine()
  })

  describe('project_analyzer + prompt_generator 工作流', () => {
    it('应该完整处理电商项目从分析到提示词生成', async () => {
      // 步骤1: 使用 project_analyzer 分析项目
      const projectAnalysis = await aiEngine.analyzeProject({
        description: '开发一个高端时尚电商平台FashionHub，需要用户认证、商品管理、购物车、支付处理和订单跟踪',
        requirements: ['用户认证', '商品展示', '购物车', '支付集成', '订单管理'],
        constraints: {
          budget: 'high',
          timeline: 'normal',
          team_size: 5,
          complexity: 'complex'
        }
      })

      // 验证 project_analyzer 的输出
      expect(projectAnalysis.projectType).toBe('ecommerce')
      expect(projectAnalysis.recommendedStack.features).toContain('auth')
      expect(projectAnalysis.recommendedStack.features).toContain('payment')
      expect(projectAnalysis.complexity).toBeGreaterThan(7) // 高复杂度

      // 步骤2: 使用 project_analyzer 结果生成提示词
      const promptConfig: PromptGenerationConfig = {
        userDescription: '开发FashionHub电商平台，专注高端时尚市场',
        projectType: projectAnalysis.projectType,
        detectedFeatures: projectAnalysis.recommendedStack.features,
        techStack: [
          projectAnalysis.recommendedStack.database,
          projectAnalysis.recommendedStack.uiFramework
        ].filter(Boolean) as string[]
      }

      // 步骤3: 意图分析（应该使用现有分析结果）
      const intent = await intentAnalyzer.analyzeUserIntent(promptConfig)
      
      expect(intent.projectType).toBe('ecommerce')
      expect(intent.coreFeatures).toEqual(expect.arrayContaining(projectAnalysis.recommendedStack.features))
      expect(intent.confidence).toBeGreaterThan(80) // 高置信度，因为有完整的分析结果

      // 步骤4: 生成提示词
      const promptContext: PromptContext = {
        project_name: 'FashionHub',
        project_type: intent.projectType,
        complexity_level: 'complex',
        detected_features: intent.coreFeatures,
        tech_stack: `${projectAnalysis.recommendedStack.database} + ${projectAnalysis.recommendedStack.uiFramework} + Stripe`,
        vibecli_version: '1.3.0',
        current_date: new Date().toLocaleDateString('zh-CN'),
        has_payment_feature: intent.coreFeatures.includes('payment')
      }

      const promptResult = await promptTemplateEngine.renderPrompt(intent.projectType, promptContext)

      // 验证最终提示词
      expect(promptResult.success).toBe(true)
      expect(promptResult.prompt).toContain('FashionHub')
      expect(promptResult.prompt).toContain('电商项目')
      expect(promptResult.prompt).toContain('complex')
      expect(promptResult.prompt).toContain('支付功能')
      expect(promptResult.prompt).toContain('Stripe')
      expect(promptResult.prompt).toContain('auth, payment') // 功能列表
      expect(promptResult.metadata.confidenceScore).toBeGreaterThan(85)
    })

    it('应该处理SaaS项目的完整工作流', async () => {
      // 步骤1: project_analyzer 分析
      const projectAnalysis = await aiEngine.analyzeProject({
        description: '企业级项目管理SaaS平台TeamFlow，支持多租户、订阅计费、团队协作和数据分析',
        requirements: ['多租户架构', '订阅管理', '团队协作', '数据分析', 'API集成'],
        constraints: {
          budget: 'high',
          timeline: 'flexible',
          team_size: 8,
          complexity: 'complex'
        }
      })

      expect(projectAnalysis.projectType).toBe('saas')

      // 步骤2: 提示词生成配置
      const promptConfig: PromptGenerationConfig = {
        userDescription: '企业级SaaS平台TeamFlow，重点是团队协作和项目管理',
        projectType: projectAnalysis.projectType,
        detectedFeatures: projectAnalysis.recommendedStack.features,
        complexityLevel: 'complex'
      }

      // 步骤3: 意图分析
      const intent = await intentAnalyzer.analyzeUserIntent(promptConfig)
      
      expect(intent.projectType).toBe('saas')
      expect(intent.complexityLevel).toBe('complex')

      // 步骤4: 提示词生成
      const promptContext: PromptContext = {
        project_name: 'TeamFlow',
        project_type: intent.projectType,
        complexity_level: intent.complexityLevel,
        detected_features: intent.coreFeatures,
        tech_stack: 'Next.js + TypeScript + Prisma + Stripe',
        vibecli_version: '1.3.0',
        current_date: new Date().toLocaleDateString('zh-CN'),
        has_billing_feature: true
      }

      const promptResult = await promptTemplateEngine.renderPrompt(intent.projectType, promptContext)

      expect(promptResult.success).toBe(true)
      expect(promptResult.prompt).toContain('TeamFlow')
      expect(promptResult.prompt).toContain('SaaS 平台')
      expect(promptResult.prompt).toContain('订阅计费')
      expect(promptResult.prompt).toContain('多租户')
    })

    it('应该在project_analyzer结果不完整时增强分析', async () => {
      // 模拟 project_analyzer 只提供基础信息
      const basicAnalysis = {
        projectType: 'ecommerce',
        recommendedStack: {
          database: 'postgresql',
          uiFramework: 'tailwind-radix',
          features: ['auth'] // 只有基础功能
        },
        complexity: 5,
        estimatedTime: '2-3周'
      }

      // prompt_generator 应该基于描述增强功能检测
      const promptConfig: PromptGenerationConfig = {
        userDescription: '电商网站需要支付、购物车、商品管理、库存跟踪、邮件通知和客户评价功能',
        projectType: basicAnalysis.projectType,
        detectedFeatures: basicAnalysis.recommendedStack.features
      }

      const intent = await intentAnalyzer.analyzeUserIntent(promptConfig)

      // 应该检测到更多功能
      expect(intent.coreFeatures).toContain('auth') // 保留原有
      expect(intent.coreFeatures).toContain('payment') // 新检测
      expect(intent.coreFeatures).toContain('email') // 新检测
      expect(intent.coreFeatures).toContain('admin') // 商品管理

      // 复杂度应该提升
      expect(intent.complexityLevel).toBe('medium') // 因为功能较多
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该处理project_analyzer输出不标准的情况', async () => {
      const invalidAnalysis = {
        projectType: 'unknown-type',
        recommendedStack: {
          features: [] // 空功能列表
        }
      }

      const promptConfig: PromptGenerationConfig = {
        userDescription: '做一个网站',
        projectType: invalidAnalysis.projectType,
        detectedFeatures: invalidAnalysis.recommendedStack.features
      }

      const intent = await intentAnalyzer.analyzeUserIntent(promptConfig)

      // 应该回退到基于描述的分析
      expect(intent.projectType).toBe('blog') // 默认项目类型
      expect(intent.confidence).toBeLessThan(60) // 低置信度

      const validation = intentAnalyzer.validateIntent(intent)
      expect(validation.warnings.length).toBeGreaterThan(0)
    })

    it('应该处理模板不存在的情况', async () => {
      const intent = {
        projectType: 'nonexistent',
        coreFeatures: ['auth'],
        complexityLevel: 'simple' as const,
        techPreferences: [],
        confidence: 70
      }

      const promptContext: PromptContext = {
        project_name: 'TestProject',
        project_type: intent.projectType,
        complexity_level: intent.complexityLevel,
        detected_features: intent.coreFeatures,
        tech_stack: 'Next.js',
        vibecli_version: '1.3.0',
        current_date: '2024-01-01'
      }

      const result = await promptTemplateEngine.renderPrompt(intent.projectType, promptContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('未找到项目类型')
    })
  })

  describe('性能和置信度评估', () => {
    it('使用完整分析结果应该提供更高的置信度', async () => {
      // 完整的 project_analyzer 结果
      const completeConfig: PromptGenerationConfig = {
        userDescription: '专业电商平台开发',
        projectType: 'ecommerce',
        detectedFeatures: ['auth', 'payment', 'admin', 'upload', 'email'],
        techStack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe']
      }

      const completeIntent = await intentAnalyzer.analyzeUserIntent(completeConfig)

      // 仅基于描述的分析
      const basicConfig: PromptGenerationConfig = {
        userDescription: '专业电商平台开发'
      }

      const basicIntent = await intentAnalyzer.analyzeUserIntent(basicConfig)

      // 完整配置应该有更高的置信度
      expect(completeIntent.confidence).toBeGreaterThan(basicIntent.confidence)
      expect(completeIntent.confidence).toBeGreaterThan(85)
      expect(basicIntent.confidence).toBeLessThan(75)
    })

    it('应该正确继承和合并功能特性', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '电商平台还需要实时聊天和推荐系统',
        projectType: 'ecommerce',
        detectedFeatures: ['auth', 'payment'] // 来自 project_analyzer
      }

      const intent = await intentAnalyzer.analyzeUserIntent(config)

      // 应该保留原有功能
      expect(intent.coreFeatures).toContain('auth')
      expect(intent.coreFeatures).toContain('payment')
      
      // 应该添加新检测的功能
      expect(intent.coreFeatures).toContain('realtime') // 实时聊天
    })
  })
})