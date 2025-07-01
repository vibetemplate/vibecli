import { IntentAnalyzer } from '../../prompts/dynamic/intent-analyzer.js'
import type { PromptGenerationConfig } from '../../core/types.js'

describe('IntentAnalyzer', () => {
  let analyzer: IntentAnalyzer

  beforeEach(() => {
    analyzer = new IntentAnalyzer()
  })

  describe('analyzeUserIntent', () => {
    it('应该正确识别电商项目类型', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '我想做一个电商网站，需要购物车和支付功能'
      }

      const result = await analyzer.analyzeUserIntent(config)

      expect(result.projectType).toBe('ecommerce')
      expect(result.coreFeatures).toContain('payment')
      expect(result.confidence).toBeGreaterThan(60)
    })

    it('应该正确识别SaaS项目类型', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '需要开发一个SaaS平台，支持订阅计费和多租户'
      }

      const result = await analyzer.analyzeUserIntent(config)

      expect(result.projectType).toBe('saas')
      expect(result.coreFeatures).toContain('auth')
      expect(result.confidence).toBeGreaterThan(60)
    })

    it('应该正确识别博客项目类型', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '我要创建一个个人博客，可以发布文章和评论'
      }

      const result = await analyzer.analyzeUserIntent(config)

      expect(result.projectType).toBe('blog')
      expect(result.confidence).toBeGreaterThan(50)
    })

    it('应该正确识别作品集项目类型', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '制作一个个人作品集网站展示我的项目'
      }

      const result = await analyzer.analyzeUserIntent(config)

      expect(result.projectType).toBe('portfolio')
      expect(result.confidence).toBeGreaterThan(50)
    })

    it('应该正确识别仪表板项目类型', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '开发一个管理后台，包含数据可视化和用户管理'
      }

      const result = await analyzer.analyzeUserIntent(config)

      expect(result.projectType).toBe('dashboard')
      expect(result.coreFeatures).toContain('admin')
      expect(result.confidence).toBeGreaterThan(60)
    })

    it('应该根据描述复杂度评估项目复杂度', async () => {
      const simpleConfig: PromptGenerationConfig = {
        userDescription: '简单的个人博客'
      }
      const simpleResult = await analyzer.analyzeUserIntent(simpleConfig)
      expect(simpleResult.complexityLevel).toBe('simple')

      const complexConfig: PromptGenerationConfig = {
        userDescription: '企业级SaaS平台，需要多租户、计费、API、分析、团队管理'
      }
      const complexResult = await analyzer.analyzeUserIntent(complexConfig)
      expect(complexResult.complexityLevel).toBe('complex')
    })

    it('应该识别技术偏好', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '用React和TypeScript开发一个电商网站，使用PostgreSQL数据库'
      }

      const result = await analyzer.analyzeUserIntent(config)

      expect(result.techPreferences).toContain('React')
      expect(result.techPreferences).toContain('TypeScript')
      expect(result.techPreferences).toContain('PostgreSQL')
    })

    it('应该处理英文描述', async () => {
      const config: PromptGenerationConfig = {
        userDescription: 'I want to build an ecommerce store with payment integration'
      }

      const result = await analyzer.analyzeUserIntent(config)

      expect(result.projectType).toBe('ecommerce')
      expect(result.coreFeatures).toContain('payment')
    })

    it('应该为短描述提供较低的置信度', async () => {
      const config: PromptGenerationConfig = {
        userDescription: '网站'
      }

      const result = await analyzer.analyzeUserIntent(config)

      expect(result.confidence).toBeLessThan(60)
    })
  })

  describe('getRecommendedFeatures', () => {
    it('应该为电商项目推荐正确的功能', () => {
      const features = analyzer.getRecommendedFeatures('ecommerce')
      
      expect(features).toContain('auth')
      expect(features).toContain('payment')
      expect(features).toContain('admin')
      expect(features).toContain('upload')
      expect(features).toContain('email')
    })

    it('应该为SaaS项目推荐正确的功能', () => {
      const features = analyzer.getRecommendedFeatures('saas')
      
      expect(features).toContain('auth')
      expect(features).toContain('admin')
      expect(features).toContain('analytics')
      expect(features).toContain('email')
    })

    it('应该为未知项目类型返回默认功能', () => {
      const features = analyzer.getRecommendedFeatures('unknown')
      
      expect(features).toContain('auth')
      expect(features).toHaveLength(1)
    })
  })

  describe('validateIntent', () => {
    it('应该为高置信度结果返回有效状态', () => {
      const intent = {
        projectType: 'ecommerce',
        coreFeatures: ['auth', 'payment'],
        complexityLevel: 'medium' as const,
        techPreferences: ['React'],
        confidence: 80
      }

      const validation = analyzer.validateIntent(intent)

      expect(validation.valid).toBe(true)
      expect(validation.warnings).toHaveLength(0)
    })

    it('应该为低置信度结果提供警告', () => {
      const intent = {
        projectType: 'blog',
        coreFeatures: [],
        complexityLevel: 'simple' as const,
        techPreferences: [],
        confidence: 30
      }

      const validation = analyzer.validateIntent(intent)

      expect(validation.valid).toBe(false)
      expect(validation.warnings.length).toBeGreaterThan(0)
      expect(validation.warnings[0]).toContain('置信度较低')
    })

    it('应该为缺少重要功能提供建议', () => {
      const intent = {
        projectType: 'ecommerce',
        coreFeatures: [],
        complexityLevel: 'medium' as const,
        techPreferences: [],
        confidence: 70
      }

      const validation = analyzer.validateIntent(intent)

      expect(validation.valid).toBe(true)
      expect(validation.warnings.length).toBeGreaterThan(0)
      expect(validation.warnings.some(w => w.includes('建议考虑添加'))).toBe(true)
    })
  })
})