// 从MCP上下文管理器中获取项目意图类型
export interface ProjectIntent {
  projectType: string
  coreFeatures: string[]
  complexityLevel: string
  techPreferences?: string[]
  confidence: number
  reasoning: string
  suggestions?: string[]
}

export interface TemplateSelectionContext {
  projectIntent: ProjectIntent
  userExperience: 'beginner' | 'intermediate' | 'expert'
  developmentPhase: 'planning' | 'development' | 'optimization'
  previousFeedback?: TemplateFeedback[]
}

export interface TemplateFeedback {
  templateId: string
  rating: number // 1-5
  comments: string
  usage: 'helpful' | 'partially_helpful' | 'not_helpful'
}

export interface TemplateVariant {
  id: string
  name: string
  description: string
  targetAudience: 'beginner' | 'intermediate' | 'expert'
  focus: 'implementation' | 'architecture' | 'best-practices' | 'troubleshooting'
  templatePath: string
  weight: number
}

/**
 * 上下文感知的模板选择器
 * 使用AI来选择最适合的提示词模板和变体
 */
export class ContextAwareTemplateSelector {
  private templateVariants: Record<string, TemplateVariant[]> = {}

  constructor() {
    this.initializeTemplateVariants()
  }

  /**
   * 初始化模板变体
   */
  private initializeTemplateVariants() {
    // 电商项目的多个变体
    this.templateVariants.ecommerce = [
      {
        id: 'ecommerce-beginner',
        name: '电商新手指导版',
        description: '适合初学者的详细步骤指导',
        targetAudience: 'beginner',
        focus: 'implementation',
        templatePath: 'project-types/ecommerce/beginner-guide.md',
        weight: 1.0
      },
      {
        id: 'ecommerce-architecture',
        name: '电商架构深度版',
        description: '重点关注系统架构和扩展性',
        targetAudience: 'expert',
        focus: 'architecture',
        templatePath: 'project-types/ecommerce/architecture-focused.md',
        weight: 1.0
      },
      {
        id: 'ecommerce-practices',
        name: '电商最佳实践版',
        description: '强调安全性和性能优化',
        targetAudience: 'intermediate',
        focus: 'best-practices',
        templatePath: 'project-types/ecommerce/best-practices.md',
        weight: 1.0
      }
    ]

    // SaaS项目的多个变体
    this.templateVariants.saas = [
      {
        id: 'saas-mvp',
        name: 'SaaS MVP版',
        description: '快速构建最小可行产品',
        targetAudience: 'beginner',
        focus: 'implementation',
        templatePath: 'project-types/saas/mvp-focused.md',
        weight: 1.0
      },
      {
        id: 'saas-enterprise',
        name: 'SaaS 企业级版',
        description: '企业级SaaS架构和安全考虑',
        targetAudience: 'expert',
        focus: 'architecture',
        templatePath: 'project-types/saas/enterprise-grade.md',
        weight: 1.0
      }
    ]

    // 为其他项目类型添加变体...
    this.templateVariants.blog = [
      {
        id: 'blog-simple',
        name: '简单博客版',
        description: '适合个人博客的简化指导',
        targetAudience: 'beginner',
        focus: 'implementation',
        templatePath: 'project-types/blog/simple-blog.md',
        weight: 1.0
      }
    ]

    this.templateVariants.portfolio = [
      {
        id: 'portfolio-creative',
        name: '创意作品集版',
        description: '注重视觉效果和创意展示',
        targetAudience: 'intermediate',
        focus: 'implementation',
        templatePath: 'project-types/portfolio/creative-focused.md',
        weight: 1.0
      }
    ]

    this.templateVariants.dashboard = [
      {
        id: 'dashboard-analytics',
        name: '数据分析仪表板版',
        description: '专注于数据可视化和分析',
        targetAudience: 'intermediate',
        focus: 'implementation',
        templatePath: 'project-types/dashboard/analytics-focused.md',
        weight: 1.0
      }
    ]
  }

  /**
   * 基于上下文智能选择最佳模板
   */
  async selectOptimalTemplate(context: TemplateSelectionContext): Promise<TemplateVariant> {
    const projectType = context.projectIntent.projectType
    const availableVariants = this.templateVariants[projectType] || []

    if (availableVariants.length === 0) {
      // 回退到默认模板
      return this.getDefaultTemplate(projectType)
    }

    if (availableVariants.length === 1) {
      return availableVariants[0]
    }

    // 使用基于规则的智能选择（MCP原生）
    return this.ruleBasedSelection(context, availableVariants)
  }


  /**
   * 基于规则的模板选择（回退方案）
   */
  private ruleBasedSelection(
    context: TemplateSelectionContext,
    variants: TemplateVariant[]
  ): TemplateVariant {
    // 按用户经验筛选
    let filtered = variants.filter(v => v.targetAudience === context.userExperience)
    
    if (filtered.length === 0) {
      // 如果没有完全匹配的，选择最接近的
      if (context.userExperience === 'beginner') {
        filtered = variants.filter(v => v.targetAudience === 'intermediate')
      } else if (context.userExperience === 'expert') {
        filtered = variants.filter(v => v.targetAudience === 'intermediate')
      }
    }

    if (filtered.length === 0) {
      filtered = variants
    }

    // 按开发阶段和复杂度选择
    const priorityOrder = this.getPriorityOrder(context)
    
    for (const focus of priorityOrder) {
      const match = filtered.find(v => v.focus === focus)
      if (match) {
        return match
      }
    }

    // 默认返回第一个
    return filtered[0] || variants[0]
  }

  /**
   * 获取优先级顺序
   */
  private getPriorityOrder(context: TemplateSelectionContext): string[] {
    if (context.developmentPhase === 'planning') {
      return ['architecture', 'implementation', 'best-practices', 'troubleshooting']
    } else if (context.developmentPhase === 'development') {
      return ['implementation', 'best-practices', 'troubleshooting', 'architecture']
    } else { // optimization
      return ['best-practices', 'troubleshooting', 'architecture', 'implementation']
    }
  }

  /**
   * 获取默认模板
   */
  private getDefaultTemplate(projectType: string): TemplateVariant {
    return {
      id: `${projectType}-default`,
      name: `${projectType} 默认模板`,
      description: '通用的项目指导模板',
      targetAudience: 'intermediate',
      focus: 'implementation',
      templatePath: `project-types/${projectType}/main-prompt.md`,
      weight: 1.0
    }
  }

  /**
   * 根据用户反馈更新模板权重
   */
  updateTemplateWeights(feedback: TemplateFeedback[]) {
    feedback.forEach(f => {
      Object.values(this.templateVariants).flat().forEach(variant => {
        if (variant.id === f.templateId) {
          // 根据反馈调整权重
          if (f.usage === 'helpful' && f.rating >= 4) {
            variant.weight = Math.min(2.0, variant.weight + 0.1)
          } else if (f.usage === 'not_helpful' || f.rating <= 2) {
            variant.weight = Math.max(0.1, variant.weight - 0.1)
          }
        }
      })
    })
  }

  /**
   * 获取所有可用的模板变体
   */
  getAvailableVariants(projectType: string): TemplateVariant[] {
    return this.templateVariants[projectType] || []
  }

  /**
   * 获取模板使用统计
   */
  getTemplateStats(): Record<string, { usage: number; avgRating: number }> {
    // 这里可以集成真实的使用统计
    // 目前返回模拟数据
    return {}
  }
}

/**
 * 单例实例
 */
export const contextAwareTemplateSelector = new ContextAwareTemplateSelector()