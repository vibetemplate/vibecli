import type { PromptGenerationConfig } from '../../core/types.js'

export interface ProjectIntent {
  projectType: string
  coreFeatures: string[]
  complexityLevel: 'simple' | 'medium' | 'complex'
  techPreferences: string[]
  confidence: number
}

export interface KeywordMapping {
  keywords: string[]
  weight: number
  category: 'type' | 'feature' | 'complexity' | 'tech'
}

export class IntentAnalyzer {
  private projectTypeKeywords: Record<string, KeywordMapping[]> = {
    ecommerce: [
      { keywords: ['电商', '商城', '购物', '支付', '订单', '商品', 'shop', 'cart', 'payment', 'store', '网店', 'ecommerce', 'e-commerce', '在线商店', '零售', 'marketplace', '电商平台', 'platform', '平台', '购买', '销售', '交易'], weight: 10, category: 'type' },
      { keywords: ['库存', '商品管理', 'inventory', '商户', '多商户', '供应商', '分销', '仓储', '物流', 'logistics'], weight: 8, category: 'feature' },
      { keywords: ['stripe', 'paypal', '支付宝', '微信支付', 'alipay', 'wechat pay', '收银台', '结算'], weight: 6, category: 'tech' },
      { keywords: ['优惠券', '促销', '折扣', 'coupon', 'discount', '营销', 'marketing'], weight: 7, category: 'feature' },
      { keywords: ['购物车', '结账', '下单', 'checkout', 'order', '配送', 'shipping', '结算', '购买流程', '支付处理', '支付集成'], weight: 9, category: 'type' }
    ],
    saas: [
      { keywords: ['saas', '订阅', '多租户', '仪表板', 'dashboard', 'subscription', 'tenant', '企业级', 'software as a service', '软件服务'], weight: 10, category: 'type' },
      { keywords: ['计费', '订阅管理', 'billing', '团队管理', '权限', 'rbac', '角色', 'role', '定价', 'pricing'], weight: 8, category: 'feature' },
      { keywords: ['api', '集成', 'webhook', 'integration', '接口', 'rest api', 'graphql'], weight: 6, category: 'tech' },
      { keywords: ['工作流', 'workflow', '自动化', 'automation', '流程', 'process'], weight: 7, category: 'feature' },
      { keywords: ['企业', '组织', 'organization', '部门', 'department', '协作', 'collaboration'], weight: 8, category: 'type' }
    ],
    blog: [
      { keywords: ['博客', '文章', '内容管理', 'cms', '发布', 'blog', 'post', '写作', 'content', '新闻', 'news'], weight: 10, category: 'type' },
      { keywords: ['评论', 'seo', '搜索', '标签', '分类', 'comment', 'tag', 'category', '归档', 'archive'], weight: 8, category: 'feature' },
      { keywords: ['markdown', '富文本', 'editor', 'wysiwyg', '编辑器', 'tinymce', 'quill'], weight: 6, category: 'tech' },
      { keywords: ['订阅', '推送', '通知', 'subscription', 'notification', 'rss', '邮件列表'], weight: 7, category: 'feature' },
      { keywords: ['作者', 'author', '编辑', '审核', 'review', '发布流程'], weight: 6, category: 'feature' }
    ],
    portfolio: [
      { keywords: ['作品集', '个人网站', '展示', 'portfolio', '简历', 'resume', '个人主页', 'personal website', '个人品牌'], weight: 10, category: 'type' },
      { keywords: ['项目展示', '技能', '联系表单', '关于我', 'about', 'contact', '经历', 'experience', '成就'], weight: 8, category: 'feature' },
      { keywords: ['动画', 'animation', '响应式', 'responsive', '交互', 'interactive', 'parallax'], weight: 6, category: 'tech' },
      { keywords: ['设计师', 'designer', '开发者', 'developer', '创意', 'creative', '艺术家', 'artist'], weight: 7, category: 'type' },
      { keywords: ['案例研究', 'case study', '展示页', 'showcase', '画廊', 'gallery'], weight: 6, category: 'feature' }
    ],
    dashboard: [
      { keywords: ['仪表板', '管理后台', '数据可视化', '图表', '分析', 'admin', 'dashboard', '后台', 'analytics', '控制台'], weight: 10, category: 'type' },
      { keywords: ['用户管理', '权限', '数据表格', '统计', 'statistics', '报表', 'report', '监控', 'monitoring'], weight: 8, category: 'feature' },
      { keywords: ['echarts', 'chart.js', 'd3', '图表库', 'recharts', 'plotly', 'highcharts'], weight: 6, category: 'tech' },
      { keywords: ['kpi', '指标', 'metrics', '绩效', 'performance', '趋势', 'trend'], weight: 7, category: 'feature' },
      { keywords: ['实时', 'real-time', '刷新', '更新', 'live data', '数据源'], weight: 6, category: 'tech' }
    ]
  }

  private featureKeywords: Record<string, string[]> = {
    auth: ['登录', '注册', '认证', '用户', 'login', 'register', 'auth', 'user', '用户系统', '认证系统'],
    payment: ['支付', '付款', '交易', 'payment', 'pay', 'transaction', 'stripe'],
    admin: ['管理', '后台', '管理员', 'admin', 'management'],
    upload: ['上传', '文件', '图片', 'upload', 'file', 'image'],
    email: ['邮件', '邮箱', '通知', 'email', 'mail', 'notification'],
    realtime: ['实时', '即时', '聊天', 'realtime', 'chat', 'websocket'],
    search: ['搜索', '查找', 'search', 'find'],
    analytics: ['分析', '统计', '数据', 'analytics', 'statistics', 'data']
  }

  private complexityIndicators = {
    simple: ['简单', '基础', '入门', 'simple', 'basic', '个人用'],
    medium: ['中等', '标准', '企业', 'medium', 'standard', '团队'],
    complex: ['复杂', '大型', '企业级', 'complex', 'enterprise', '高级', 'advanced']
  }

  /**
   * 分析用户意图
   */
  async analyzeUserIntent(config: PromptGenerationConfig): Promise<ProjectIntent> {
    const description = config.userDescription.toLowerCase()
    
    // 1. 识别项目类型
    const projectType = this.identifyProjectType(description)
    
    // 2. 提取核心功能
    const coreFeatures = this.extractCoreFeatures(description)
    
    // 3. 评估复杂度
    const complexityLevel = this.assessComplexity(description, coreFeatures)
    
    // 4. 识别技术偏好
    const techPreferences = this.extractTechPreferences(description)
    
    // 5. 计算置信度
    const confidence = this.calculateConfidence(description, projectType, coreFeatures)

    return {
      projectType,
      coreFeatures,
      complexityLevel,
      techPreferences,
      confidence
    }
  }

  /**
   * 识别项目类型 - 增强版算法
   */
  private identifyProjectType(description: string): string {
    const scores: Record<string, number> = {}
    const lowerDescription = description.toLowerCase()

    // 遍历所有项目类型的关键词
    Object.entries(this.projectTypeKeywords).forEach(([type, mappings]) => {
      scores[type] = 0
      
      mappings.forEach(mapping => {
        mapping.keywords.forEach(keyword => {
          if (lowerDescription.includes(keyword.toLowerCase())) {
            // 根据类别给予不同权重加成
            let weightMultiplier = 1
            if (mapping.category === 'type') weightMultiplier = 1.5  // 类型关键词最重要
            else if (mapping.category === 'feature') weightMultiplier = 1.2  // 功能关键词次重要
            else if (mapping.category === 'tech') weightMultiplier = 0.8     // 技术关键词权重较低
            
            scores[type] += mapping.weight * weightMultiplier
            
            // 调试输出
            console.error(`🔍 匹配到关键词: "${keyword}" -> ${type} (+${mapping.weight * weightMultiplier}分)`);
          }
        })
      })
    })

    // 输出所有得分
    console.error('📊 项目类型得分:', scores);

    // 找到得分最高的项目类型
    const bestMatch = Object.entries(scores).reduce((best, [type, score]) => {
      return score > best.score ? { type, score } : best
    }, { type: 'portfolio', score: 0 }) // 改为默认 portfolio，避免博客偏向

    // 如果最高分太低，说明识别不够准确
    if (bestMatch.score < 10) {
      console.error('⚠️ 项目类型识别置信度过低，使用基于关键词数量的备选算法');
      return this.fallbackProjectTypeIdentification(lowerDescription);
    }

    console.error(`✅ 识别为项目类型: ${bestMatch.type} (得分: ${bestMatch.score})`);
    return bestMatch.type
  }

  /**
   * 提取核心功能
   */
  private extractCoreFeatures(description: string): string[] {
    const features: string[] = []

    Object.entries(this.featureKeywords).forEach(([feature, keywords]) => {
      const hasFeature = keywords.some(keyword => description.includes(keyword))
      if (hasFeature) {
        features.push(feature)
      }
    })

    return features
  }

  /**
   * 评估复杂度
   */
  private assessComplexity(description: string, features: string[]): 'simple' | 'medium' | 'complex' {
    // 基于关键词的复杂度评估
    for (const [level, keywords] of Object.entries(this.complexityIndicators)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return level as 'simple' | 'medium' | 'complex'
      }
    }

    // 基于功能数量的复杂度评估
    if (features.length <= 2) return 'simple'
    if (features.length <= 4) return 'medium'
    return 'complex'
  }

  /**
   * 提取技术偏好
   */
  private extractTechPreferences(description: string): string[] {
    const techKeywords: Record<string, string[]> = {
      'React': ['react', 'jsx'],
      'Vue': ['vue', 'vuejs'],
      'Angular': ['angular'],
      'Next.js': ['nextjs', 'next.js'],
      'TypeScript': ['typescript', 'ts'],
      'JavaScript': ['javascript', 'js'],
      'Tailwind': ['tailwind', 'tailwindcss'],
      'Bootstrap': ['bootstrap'],
      'PostgreSQL': ['postgresql', 'postgres'],
      'MySQL': ['mysql'],
      'MongoDB': ['mongodb', 'mongo'],
      'Redis': ['redis'],
      'Docker': ['docker'],
      'AWS': ['aws', 'amazon'],
      'Vercel': ['vercel'],
      'Netlify': ['netlify']
    }

    const preferences: string[] = []
    
    Object.entries(techKeywords).forEach(([tech, keywords]) => {
      if (keywords.some(keyword => description.includes(keyword))) {
        preferences.push(tech)
      }
    })

    return preferences
  }

  /**
   * 备选项目类型识别算法（基于关键词频次）
   */
  private fallbackProjectTypeIdentification(description: string): string {
    // 简单的关键词计数方法
    const typeKeywordCounts: Record<string, number> = {
      ecommerce: 0,
      saas: 0,
      blog: 0,
      portfolio: 0,
      dashboard: 0
    }

    // 电商强特征词
    const ecommerceWords = ['电商', 'ecommerce', '购物', '商城', '支付', '订单', '商品', '购买', '结算', '购物车']
    ecommerceWords.forEach(word => {
      if (description.includes(word)) typeKeywordCounts.ecommerce += 1
    })

    // SaaS强特征词
    const saasWords = ['saas', '订阅', '企业级', '多租户', '仪表板', 'dashboard', '计费']
    saasWords.forEach(word => {
      if (description.includes(word)) typeKeywordCounts.saas += 1
    })

    // 博客强特征词
    const blogWords = ['博客', 'blog', '文章', '内容管理', 'cms', '发布']
    blogWords.forEach(word => {
      if (description.includes(word)) typeKeywordCounts.blog += 1
    })

    // 作品集强特征词
    const portfolioWords = ['作品集', 'portfolio', '个人网站', '展示', '简历']
    portfolioWords.forEach(word => {
      if (description.includes(word)) typeKeywordCounts.portfolio += 1
    })

    // 后台管理强特征词
    const dashboardWords = ['管理后台', '数据可视化', '图表', '分析', 'admin', '控制台']
    dashboardWords.forEach(word => {
      if (description.includes(word)) typeKeywordCounts.dashboard += 1
    })

    // 找到最高频次的类型
    const maxType = Object.entries(typeKeywordCounts).reduce((max, [type, count]) => {
      return count > max.count ? { type, count } : max
    }, { type: 'portfolio', count: 0 })

    console.error('🔄 备选算法得分:', typeKeywordCounts);
    console.error(`🎯 备选算法结果: ${maxType.type} (匹配${maxType.count}个关键词)`);

    return maxType.type
  }

  /**
   * 计算置信度 - 增强版算法
   */
  private calculateConfidence(description: string, projectType: string, features: string[]): number {
    let confidence = 30 // 降低基础置信度，让算法更严格

    // 1. 项目类型关键词匹配度（权重最高）
    const typeScore = this.calculateTypeMatchScore(description, projectType)
    confidence += typeScore
    console.error(`🎯 类型匹配得分: ${typeScore}`);

    // 2. 功能特征一致性评分
    const featureScore = this.calculateFeatureConsistencyScore(description, projectType, features)
    confidence += featureScore
    console.error(`🔧 功能一致性得分: ${featureScore}`);

    // 3. 描述质量评分
    const qualityScore = this.calculateDescriptionQualityScore(description)
    confidence += qualityScore

    // 4. 技术术语专业度评分
    const techScore = this.calculateTechnicalTermsScore(description)
    confidence += techScore

    // 5. 语义完整性评分
    const semanticScore = this.calculateSemanticCompletenessScore(description, projectType)
    confidence += semanticScore

    const finalConfidence = Math.min(100, confidence)
    console.error(`🎊 最终置信度: ${finalConfidence}%`);
    return finalConfidence
  }

  /**
   * 计算项目类型匹配评分
   */
  private calculateTypeMatchScore(description: string, projectType: string): number {
    const typeKeywords = this.projectTypeKeywords[projectType] || []
    let score = 0
    let maxPossibleScore = 0

    typeKeywords.forEach(mapping => {
      if (mapping.category === 'type') {
        const matchCount = mapping.keywords.filter(keyword => 
          description.toLowerCase().includes(keyword.toLowerCase())
        ).length
        
        // 按权重计算得分
        score += matchCount * mapping.weight
        maxPossibleScore += mapping.keywords.length * mapping.weight
      }
    })

    // 归一化到0-35分
    return maxPossibleScore > 0 ? Math.min(35, (score / maxPossibleScore) * 35) : 0
  }

  /**
   * 计算功能一致性评分
   */
  private calculateFeatureConsistencyScore(description: string, projectType: string, features: string[]): number {
    const recommendedFeatures = this.getRecommendedFeatures(projectType)
    const detectedFeatures = features

    // 推荐功能命中率
    const hitRate = detectedFeatures.filter(f => recommendedFeatures.includes(f)).length / recommendedFeatures.length
    
    // 功能数量合理性（避免过少或过多）
    const featureCountScore = this.getFeatureCountScore(detectedFeatures.length, projectType)
    
    // 功能与项目类型的匹配度
    const matchScore = this.calculateFeatureProjectTypeMatch(detectedFeatures, projectType)

    return Math.min(20, hitRate * 10 + featureCountScore * 5 + matchScore * 5)
  }

  /**
   * 计算描述质量评分
   */
  private calculateDescriptionQualityScore(description: string): number {
    let score = 0
    const text = description.toLowerCase()
    
    // 长度合理性（不要太短也不要太长）
    const wordCount = description.split(/\s+/).filter(word => word.length > 0).length
    if (wordCount >= 5 && wordCount <= 50) score += 5
    if (wordCount >= 10 && wordCount <= 30) score += 3
    
    // 包含具体的动词（表明明确的行动意图）
    const actionVerbs = ['开发', '创建', '构建', '设计', '实现', 'build', 'create', 'develop', 'design', 'implement']
    if (actionVerbs.some(verb => text.includes(verb))) score += 3
    
    // 包含领域词汇
    const domainWords = ['网站', '平台', '系统', '应用', '工具', 'website', 'platform', 'system', 'application', 'tool']
    if (domainWords.some(word => text.includes(word))) score += 2
    
    // 描述结构化程度（包含逗号、顿号等表示列举）
    if (/[，,、。；;]/.test(description)) score += 2
    
    // 避免过于简单的描述
    if (wordCount < 3) score -= 5
    
    return Math.max(0, Math.min(15, score))
  }

  /**
   * 计算技术术语专业度评分
   */
  private calculateTechnicalTermsScore(description: string): number {
    let score = 0
    const text = description.toLowerCase()
    
    // 技术栈术语
    const techTerms = [
      'react', 'vue', 'angular', 'nextjs', 'typescript', 'javascript',
      'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'aws',
      'api', 'rest', 'graphql', 'websocket', 'microservice',
      'tailwind', 'bootstrap', 'prisma', 'stripe', 'oauth'
    ]
    
    const techCount = techTerms.filter(term => text.includes(term)).length
    score += Math.min(8, techCount * 2)
    
    // 业务术语专业度
    const businessTerms = {
      ecommerce: ['订单', '库存', '支付', '购物车', '商品', 'inventory', 'payment', 'cart'],
      saas: ['租户', '订阅', '计费', '多租户', 'tenant', 'subscription', 'billing'],
      blog: ['文章', '评论', 'seo', '标签', '分类', 'post', 'comment', 'tag'],
      portfolio: ['作品', '展示', '简历', 'portfolio', 'showcase', 'resume'],
      dashboard: ['图表', '统计', '分析', '可视化', 'chart', 'analytics', 'visualization']
    }
    
    // 检查是否使用了相关的业务术语
    Object.entries(businessTerms).forEach(([type, terms]) => {
      const termCount = terms.filter(term => text.includes(term)).length
      if (termCount > 0) score += 2
    })
    
    return Math.min(12, score)
  }

  /**
   * 计算语义完整性评分
   */
  private calculateSemanticCompletenessScore(description: string, projectType: string): number {
    let score = 0
    const text = description.toLowerCase()
    
    // 包含目标受众信息
    const audienceTerms = ['用户', '客户', '企业', '个人', '团队', 'user', 'customer', 'enterprise', 'team']
    if (audienceTerms.some(term => text.includes(term))) score += 2
    
    // 包含功能描述
    const functionTerms = ['功能', '特性', '模块', '系统', 'feature', 'function', 'module', 'system']
    if (functionTerms.some(term => text.includes(term))) score += 2
    
    // 包含业务场景
    const scenarioTerms = ['管理', '展示', '处理', '集成', '分析', 'manage', 'display', 'process', 'integrate', 'analyze']
    if (scenarioTerms.some(term => text.includes(term))) score += 2
    
    // 项目名称或明确标识
    const hasProjectName = /[A-Za-z][A-Za-z0-9]*|[\u4e00-\u9fff]+(?:系统|平台|网站|应用)/.test(description)
    if (hasProjectName) score += 2
    
    // 包含需求层次（基础需求 vs 高级需求）
    const basicNeeds = ['基础', '简单', '基本', 'basic', 'simple']
    const advancedNeeds = ['高级', '企业级', '复杂', '专业', 'advanced', 'enterprise', 'complex', 'professional']
    if (basicNeeds.some(term => text.includes(term)) || advancedNeeds.some(term => text.includes(term))) {
      score += 2
    }
    
    return Math.min(10, score)
  }

  /**
   * 获取功能数量评分
   */
  private getFeatureCountScore(featureCount: number, projectType: string): number {
    const optimalCounts: Record<string, { min: number; max: number; optimal: number }> = {
      ecommerce: { min: 3, max: 8, optimal: 5 },
      saas: { min: 3, max: 7, optimal: 4 },
      blog: { min: 1, max: 5, optimal: 3 },
      portfolio: { min: 1, max: 4, optimal: 2 },
      dashboard: { min: 2, max: 6, optimal: 4 }
    }
    
    const config = optimalCounts[projectType] || { min: 1, max: 5, optimal: 3 }
    
    if (featureCount === config.optimal) return 2
    if (featureCount >= config.min && featureCount <= config.max) return 1
    if (featureCount < config.min || featureCount > config.max) return -1
    
    return 0
  }

  /**
   * 计算功能与项目类型匹配度
   */
  private calculateFeatureProjectTypeMatch(features: string[], projectType: string): number {
    const typeSpecificFeatures: Record<string, string[]> = {
      ecommerce: ['payment', 'cart', 'inventory'],
      saas: ['billing', 'tenant', 'subscription'],
      blog: ['search', 'seo', 'comment'],
      portfolio: ['showcase', 'contact'],
      dashboard: ['analytics', 'visualization', 'admin']
    }
    
    const specificFeatures = typeSpecificFeatures[projectType] || []
    const matchCount = features.filter(f => specificFeatures.includes(f)).length
    
    return specificFeatures.length > 0 ? matchCount / specificFeatures.length : 0
  }

  /**
   * 获取项目类型的推荐功能
   */
  getRecommendedFeatures(projectType: string): string[] {
    const recommendations: Record<string, string[]> = {
      ecommerce: ['auth', 'payment', 'admin', 'upload', 'email'],
      saas: ['auth', 'admin', 'analytics', 'email'],
      blog: ['auth', 'upload', 'search', 'email'],
      portfolio: ['upload', 'email'],
      dashboard: ['auth', 'admin', 'analytics']
    }

    return recommendations[projectType] || ['auth']
  }

  /**
   * 验证用户意图分析结果
   */
  validateIntent(intent: ProjectIntent): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []

    // 检查置信度
    if (intent.confidence < 60) {
      warnings.push('项目类型识别置信度较低，建议提供更详细的描述')
    }

    // 检查功能合理性
    const recommendedFeatures = this.getRecommendedFeatures(intent.projectType)
    const missingImportantFeatures = recommendedFeatures.filter(
      feature => !intent.coreFeatures.includes(feature)
    )

    if (missingImportantFeatures.length > 0) {
      warnings.push(`建议考虑添加以下功能：${missingImportantFeatures.join(', ')}`)
    }

    return {
      valid: intent.confidence >= 40,
      warnings
    }
  }
}

/**
 * 单例模式的意图分析器实例
 */
export const intentAnalyzer = new IntentAnalyzer()