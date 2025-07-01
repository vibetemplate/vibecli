/**
 * 智能模板匹配引擎
 * 
 * 功能：
 * 1. 分析用户需求并提取特征
 * 2. 计算模板匹配度和相似性
 * 3. 提供智能降级和组合方案
 * 4. 生成定制化实施指导
 */

import { PromptTemplate } from '../../core/types.js'

// 需求特征类型定义
export interface RequirementFeature {
  category: 'core' | 'auth' | 'data' | 'ui' | 'integration' | 'business'
  name: string
  importance: 'high' | 'medium' | 'low'
  keywords: string[]
  techStack?: string[]
  complexity: number // 1-10
}

// 模板匹配结果
export interface TemplateMatchResult {
  template: PromptTemplate | null
  matchScore: number // 0-100
  confidence: 'high' | 'medium' | 'low'
  matchedFeatures: RequirementFeature[]
  missingFeatures: RequirementFeature[]
  suggestedApproach: MatchingStrategy
  customizations: TemplateCustomization[]
  implementation: ImplementationPlan
}

// 匹配策略
export interface MatchingStrategy {
  type: 'exact' | 'feature_combination' | 'similarity_based' | 'dynamic_generation' | 'fallback'
  reasoning: string
  alternatives: AlternativeOption[]
}

// 模板定制化建议
export interface TemplateCustomization {
  type: 'add_feature' | 'modify_structure' | 'tech_stack_change' | 'custom_prompt'
  description: string
  priority: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  guidance: string
}

// 实施计划
export interface ImplementationPlan {
  phases: ImplementationPhase[]
  estimatedTime: string
  complexity: 'simple' | 'medium' | 'complex'
  recommendations: string[]
}

export interface ImplementationPhase {
  name: string
  description: string
  tools: string[]
  timeEstimate: string
  dependencies: string[]
}

// 替代方案
export interface AlternativeOption {
  description: string
  pros: string[]
  cons: string[]
  matchScore: number
}

export class IntelligentTemplateMatcher {
  private predefinedFeatures: Map<string, RequirementFeature[]> = new Map()
  private templateFeatures: Map<string, RequirementFeature[]> = new Map()

  constructor() {
    this.initializePredefinedFeatures()
    this.initializeTemplateFeatures()
  }

  /**
   * 主要匹配入口：分析用户需求并找到最佳模板方案
   */
  async findBestMatch(
    userDescription: string,
    extractedFeatures: string[],
    techStack: string[] = [],
    constraints: { complexity?: string, timeline?: string } = {}
  ): Promise<TemplateMatchResult> {
    
    // 1. 需求特征提取和分析
    const requirements = this.extractRequirementFeatures(userDescription, extractedFeatures, techStack)
    
    // 2. 计算与所有现有模板的匹配度
    const templateScores = this.calculateTemplateScores(requirements)
    
    // 3. 选择最佳匹配策略
    const strategy = this.selectMatchingStrategy(templateScores, requirements, constraints)
    
    // 4. 生成匹配结果和实施方案
    return this.generateMatchResult(requirements, templateScores, strategy)
  }

  /**
   * 从用户描述中提取需求特征
   */
  private extractRequirementFeatures(
    description: string, 
    features: string[], 
    techStack: string[]
  ): RequirementFeature[] {
    const extractedFeatures: RequirementFeature[] = []
    const lowerDesc = description.toLowerCase()

    // 核心业务类型识别
    const businessPatterns = [
      { pattern: /(电商|商城|购物|支付|订单)/, feature: 'ecommerce', importance: 'high' as const },
      { pattern: /(博客|文章|内容|CMS)/, feature: 'blog', importance: 'high' as const },
      { pattern: /(仪表板|数据|图表|分析)/, feature: 'dashboard', importance: 'high' as const },
      { pattern: /(SaaS|多租户|订阅|计费)/, feature: 'saas', importance: 'high' as const },
      { pattern: /(作品集|个人|展示)/, feature: 'portfolio', importance: 'high' as const }
    ]

    businessPatterns.forEach(({ pattern, feature, importance }) => {
      if (pattern.test(lowerDesc)) {
        extractedFeatures.push({
          category: 'business',
          name: feature,
          importance,
          keywords: pattern.source.split('|').map(k => k.replace(/[()]/g, '')),
          complexity: this.getBusinessComplexity(feature)
        })
      }
    })

    // 认证和用户管理
    const authPatterns = /(登录|注册|认证|用户|权限|角色)/
    if (authPatterns.test(lowerDesc) || features.includes('auth')) {
      extractedFeatures.push({
        category: 'auth',
        name: 'authentication',
        importance: 'high',
        keywords: ['登录', '注册', '认证', 'auth'],
        complexity: 6
      })
    }

    // 数据和存储需求
    const dataPatterns = [
      { pattern: /(数据库|存储|PostgreSQL|MySQL|SQLite)/, name: 'database', complexity: 5 },
      { pattern: /(文件|上传|图片|附件)/, name: 'file_upload', complexity: 4 },
      { pattern: /(搜索|检索|索引)/, name: 'search', complexity: 6 }
    ]

    dataPatterns.forEach(({ pattern, name, complexity }) => {
      if (pattern.test(lowerDesc)) {
        extractedFeatures.push({
          category: 'data',
          name,
          importance: 'medium',
          keywords: pattern.source.split('|').map(k => k.replace(/[()]/g, '')),
          complexity
        })
      }
    })

    // 集成需求
    const integrationPatterns = [
      { pattern: /(支付|Stripe|PayPal|微信支付)/, name: 'payment', complexity: 8 },
      { pattern: /(邮件|Email|通知)/, name: 'email', complexity: 4 },
      { pattern: /(实时|WebSocket|推送)/, name: 'realtime', complexity: 7 },
      { pattern: /(API|接口|第三方)/, name: 'api_integration', complexity: 6 }
    ]

    integrationPatterns.forEach(({ pattern, name, complexity }) => {
      if (pattern.test(lowerDesc)) {
        extractedFeatures.push({
          category: 'integration',
          name,
          importance: 'medium',
          keywords: pattern.source.split('|').map(k => k.replace(/[()]/g, '')),
          complexity
        })
      }
    })

    // 技术栈特征
    if (techStack.length > 0) {
      extractedFeatures.push({
        category: 'core',
        name: 'tech_stack',
        importance: 'medium',
        keywords: techStack,
        techStack: techStack,
        complexity: 3
      })
    }

    return extractedFeatures
  }

  /**
   * 计算所有模板的匹配分数
   */
  private calculateTemplateScores(requirements: RequirementFeature[]): Map<string, number> {
    const scores = new Map<string, number>()
    const availableTemplates = ['default', 'ecommerce', 'saas', 'blog', 'portfolio', 'dashboard']

    for (const templateType of availableTemplates) {
      const templateFeatures = this.templateFeatures.get(templateType) || []
      let score = this.calculateSimilarityScore(requirements, templateFeatures)
      
      // 根据业务类型给予额外权重
      const businessRequirement = requirements.find(r => r.category === 'business')
      if (businessRequirement && businessRequirement.name === templateType) {
        score += 30 // 业务类型完全匹配的额外分数
      }

      scores.set(templateType, Math.min(100, score))
    }

    return scores
  }

  /**
   * 计算两个特征集合的相似度分数
   */
  private calculateSimilarityScore(
    requirements: RequirementFeature[], 
    templateFeatures: RequirementFeature[]
  ): number {
    if (requirements.length === 0) return 50 // 基础分数

    let totalScore = 0
    let maxPossibleScore = 0

    for (const req of requirements) {
      const importanceWeight = this.getImportanceWeight(req.importance)
      maxPossibleScore += importanceWeight

      // 寻找最匹配的模板特征
      const bestMatch = templateFeatures.find(tf => 
        tf.category === req.category && tf.name === req.name
      )

      if (bestMatch) {
        totalScore += importanceWeight
      } else {
        // 部分匹配：同类别或关键词重叠
        const partialMatch = templateFeatures.find(tf => 
          tf.category === req.category || 
          this.hasKeywordOverlap(req.keywords, tf.keywords)
        )
        if (partialMatch) {
          totalScore += importanceWeight * 0.3
        }
      }
    }

    return maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0
  }

  /**
   * 选择匹配策略
   */
  private selectMatchingStrategy(
    scores: Map<string, number>,
    requirements: RequirementFeature[],
    constraints: any
  ): MatchingStrategy {
    const maxScore = Math.max(...scores.values())
    const bestTemplate = Array.from(scores.entries()).find(([_, score]) => score === maxScore)?.[0]

    if (maxScore >= 80) {
      return {
        type: 'exact',
        reasoning: `找到高度匹配的模板 ${bestTemplate}（${maxScore}% 匹配度）`,
        alternatives: this.generateAlternatives(scores, 'exact')
      }
    } else if (maxScore >= 60) {
      return {
        type: 'similarity_based',
        reasoning: `基于 ${bestTemplate} 模板进行定制化开发（${maxScore}% 匹配度）`,
        alternatives: this.generateAlternatives(scores, 'similarity_based')
      }
    } else if (requirements.length > 3) {
      return {
        type: 'feature_combination',
        reasoning: '需求复杂，建议组合多个模板特性实现',
        alternatives: this.generateAlternatives(scores, 'feature_combination')
      }
    } else {
      return {
        type: 'dynamic_generation',
        reasoning: '需求独特，建议使用增强的默认模板并提供详细指导',
        alternatives: this.generateAlternatives(scores, 'dynamic_generation')
      }
    }
  }

  /**
   * 生成最终匹配结果
   */
  private generateMatchResult(
    requirements: RequirementFeature[],
    scores: Map<string, number>,
    strategy: MatchingStrategy
  ): TemplateMatchResult {
    const maxScore = Math.max(...scores.values())
    const bestTemplate = Array.from(scores.entries()).find(([_, score]) => score === maxScore)?.[0]
    
    const templateFeatures = this.templateFeatures.get(bestTemplate || 'default') || []
    const matchedFeatures = requirements.filter(req => 
      templateFeatures.some(tf => tf.category === req.category && tf.name === req.name)
    )
    const missingFeatures = requirements.filter(req => 
      !templateFeatures.some(tf => tf.category === req.category && tf.name === req.name)
    )

    return {
      template: bestTemplate ? this.createTemplateObject(bestTemplate) : null,
      matchScore: maxScore,
      confidence: this.getConfidenceLevel(maxScore),
      matchedFeatures,
      missingFeatures,
      suggestedApproach: strategy,
      customizations: this.generateCustomizations(missingFeatures, strategy),
      implementation: this.generateImplementationPlan(requirements, strategy)
    }
  }

  // 辅助方法
  private getBusinessComplexity(business: string): number {
    const complexityMap: Record<string, number> = {
      'portfolio': 3,
      'blog': 4,
      'ecommerce': 8,
      'saas': 9,
      'dashboard': 7
    }
    return complexityMap[business] || 5
  }

  private getImportanceWeight(importance: string): number {
    const weights = { 'high': 10, 'medium': 6, 'low': 3 }
    return weights[importance as keyof typeof weights] || 5
  }

  private hasKeywordOverlap(keywords1: string[], keywords2: string[]): boolean {
    return keywords1.some(k1 => keywords2.some(k2 => k1.includes(k2) || k2.includes(k1)))
  }

  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 80) return 'high'
    if (score >= 60) return 'medium'
    return 'low'
  }

  private generateAlternatives(scores: Map<string, number>, strategyType: string): AlternativeOption[] {
    const sortedScores = Array.from(scores.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    return sortedScores.map(([template, score]) => ({
      description: `使用 ${template} 模板作为基础`,
      pros: this.getTemplatePros(template),
      cons: this.getTemplateCons(template),
      matchScore: score
    }))
  }

  private generateCustomizations(missingFeatures: RequirementFeature[], strategy: MatchingStrategy): TemplateCustomization[] {
    return missingFeatures.map(feature => ({
      type: this.getCustomizationType(feature),
      description: `添加 ${feature.name} 功能`,
      priority: feature.importance,
      effort: feature.complexity > 7 ? 'high' : feature.complexity > 4 ? 'medium' : 'low',
      guidance: this.getFeatureGuidance(feature)
    }))
  }

  private generateImplementationPlan(requirements: RequirementFeature[], strategy: MatchingStrategy): ImplementationPlan {
    const totalComplexity = requirements.reduce((sum, req) => sum + req.complexity, 0)
    const avgComplexity = totalComplexity / requirements.length || 5

    return {
      phases: this.createImplementationPhases(requirements, strategy),
      estimatedTime: this.estimateTime(avgComplexity, requirements.length),
      complexity: avgComplexity > 7 ? 'complex' : avgComplexity > 4 ? 'medium' : 'simple',
      recommendations: this.generateRecommendations(requirements, strategy)
    }
  }

  // 初始化预定义特征和模板特征的方法
  private initializePredefinedFeatures(): void {
    // 实现预定义特征初始化
  }

  private initializeTemplateFeatures(): void {
    // 为每个模板定义其支持的特征
    this.templateFeatures.set('ecommerce', [
      { category: 'business', name: 'ecommerce', importance: 'high', keywords: ['电商', '购物'], complexity: 8 },
      { category: 'auth', name: 'authentication', importance: 'high', keywords: ['认证'], complexity: 6 },
      { category: 'integration', name: 'payment', importance: 'high', keywords: ['支付'], complexity: 8 },
      { category: 'data', name: 'database', importance: 'high', keywords: ['数据库'], complexity: 5 }
    ])

    this.templateFeatures.set('saas', [
      { category: 'business', name: 'saas', importance: 'high', keywords: ['SaaS', '多租户'], complexity: 9 },
      { category: 'auth', name: 'authentication', importance: 'high', keywords: ['认证'], complexity: 6 },
      { category: 'integration', name: 'payment', importance: 'high', keywords: ['计费'], complexity: 8 },
      { category: 'data', name: 'database', importance: 'high', keywords: ['数据库'], complexity: 5 }
    ])

    this.templateFeatures.set('blog', [
      { category: 'business', name: 'blog', importance: 'high', keywords: ['博客', '文章'], complexity: 4 },
      { category: 'data', name: 'database', importance: 'medium', keywords: ['内容'], complexity: 4 },
      { category: 'data', name: 'search', importance: 'medium', keywords: ['搜索'], complexity: 6 }
    ])

    this.templateFeatures.set('dashboard', [
      { category: 'business', name: 'dashboard', importance: 'high', keywords: ['仪表板', '数据'], complexity: 7 },
      { category: 'data', name: 'database', importance: 'high', keywords: ['数据库'], complexity: 5 },
      { category: 'auth', name: 'authentication', importance: 'medium', keywords: ['认证'], complexity: 6 }
    ])

    this.templateFeatures.set('portfolio', [
      { category: 'business', name: 'portfolio', importance: 'high', keywords: ['作品集', '展示'], complexity: 3 },
      { category: 'ui', name: 'responsive', importance: 'high', keywords: ['响应式'], complexity: 3 }
    ])

    this.templateFeatures.set('default', [
      { category: 'core', name: 'basic_structure', importance: 'high', keywords: ['基础'], complexity: 2 },
      { category: 'ui', name: 'responsive', importance: 'medium', keywords: ['响应式'], complexity: 3 }
    ])
  }

  // 其他辅助方法的占位实现
  private createTemplateObject(templateType: string): PromptTemplate {
    return {
      id: `${templateType}-main`,
      name: `${templateType} 模板`,
      projectType: templateType,
      templatePath: '',
      variables: [],
      description: `${templateType} 项目模板`
    }
  }

  private getTemplatePros(template: string): string[] {
    const prosMap: Record<string, string[]> = {
      'ecommerce': ['完整的电商功能', '支付集成', '用户管理'],
      'saas': ['多租户架构', '订阅管理', '企业级功能'],
      'blog': ['内容管理', 'SEO优化', '响应式设计'],
      'dashboard': ['数据可视化', '图表组件', '管理界面'],
      'portfolio': ['展示友好', '快速启动', '简洁设计'],
      'default': ['灵活性高', '易于定制', '轻量级']
    }
    return prosMap[template] || ['基础功能完善']
  }

  private getTemplateCons(template: string): string[] {
    const consMap: Record<string, string[]> = {
      'ecommerce': ['复杂度较高', '依赖较多'],
      'saas': ['学习成本高', '配置复杂'],
      'blog': ['功能相对简单', '扩展性有限'],
      'dashboard': ['设计较为固定', '定制需要技术知识'],
      'portfolio': ['功能较少', '不适合复杂项目'],
      'default': ['需要大量定制', '功能有限']
    }
    return consMap[template] || ['需要额外开发']
  }

  private getCustomizationType(feature: RequirementFeature): 'add_feature' | 'modify_structure' | 'tech_stack_change' | 'custom_prompt' {
    if (feature.category === 'integration') return 'add_feature'
    if (feature.category === 'core') return 'tech_stack_change'
    if (feature.category === 'business') return 'modify_structure'
    return 'custom_prompt'
  }

  private getFeatureGuidance(feature: RequirementFeature): string {
    const guidanceMap: Record<string, string> = {
      'payment': '建议使用 Stripe 或 PayPal 集成支付功能',
      'authentication': '推荐使用 NextAuth.js 实现认证系统',
      'database': '建议选择 PostgreSQL 作为主数据库',
      'search': '可以使用 Algolia 或 Elasticsearch 实现搜索',
      'email': '推荐使用 Resend 或 SendGrid 发送邮件',
      'file_upload': '建议使用 Cloudinary 或 AWS S3 处理文件上传'
    }
    return guidanceMap[feature.name] || `请查阅相关文档实现 ${feature.name} 功能`
  }

  private createImplementationPhases(requirements: RequirementFeature[], strategy: MatchingStrategy): ImplementationPhase[] {
    const phases: ImplementationPhase[] = []

    // 基础阶段
    phases.push({
      name: '项目初始化',
      description: '创建基础项目结构和核心功能',
      tools: ['VibeCLI', 'Next.js', 'TypeScript'],
      timeEstimate: '1-2天',
      dependencies: []
    })

    // 根据需求添加其他阶段
    const authReq = requirements.find(r => r.category === 'auth')
    if (authReq) {
      phases.push({
        name: '认证系统',
        description: '实现用户认证和权限管理',
        tools: ['NextAuth.js', 'Prisma', 'JWT'],
        timeEstimate: '2-3天',
        dependencies: ['项目初始化']
      })
    }

    const paymentReq = requirements.find(r => r.name === 'payment')
    if (paymentReq) {
      phases.push({
        name: '支付集成',
        description: '集成支付网关和订单管理',
        tools: ['Stripe', 'Webhook'],
        timeEstimate: '3-5天',
        dependencies: ['认证系统']
      })
    }

    return phases
  }

  private estimateTime(complexity: number, featureCount: number): string {
    const baseTime = Math.ceil(complexity * featureCount / 10)
    if (baseTime <= 7) return `${baseTime} 天`
    if (baseTime <= 21) return `${Math.ceil(baseTime / 7)} 周`
    return `${Math.ceil(baseTime / 30)} 个月`
  }

  private generateRecommendations(requirements: RequirementFeature[], strategy: MatchingStrategy): string[] {
    const recommendations = [
      '建议先实现核心功能，再逐步添加复杂特性',
      '推荐使用 TypeScript 确保代码质量',
      '建议配置完善的测试环境'
    ]

    if (requirements.some(r => r.complexity > 7)) {
      recommendations.push('项目复杂度较高，建议分阶段开发')
    }

    if (requirements.some(r => r.category === 'integration')) {
      recommendations.push('涉及第三方集成，建议仔细阅读相关文档')
    }

    return recommendations
  }
}

// 导出单例实例
export const intelligentTemplateMatcher = new IntelligentTemplateMatcher()