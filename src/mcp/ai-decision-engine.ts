export interface ProjectAnalysisInput {
  description: string
  requirements: string[]
  constraints: {
    budget: 'low' | 'medium' | 'high'
    timeline: 'fast' | 'normal' | 'flexible'
    team_size: number
    complexity: 'simple' | 'medium' | 'complex'
  }
}

export interface ProjectAnalysisResult {
  projectType: string
  recommendedStack: {
    database: string
    uiFramework: string
    features: string[]
  }
  complexity: number
  estimatedTime: string
}

export class AIDecisionEngine {
  async analyzeProject(input: ProjectAnalysisInput): Promise<ProjectAnalysisResult> {
    // 基于输入分析项目类型
    const projectType = this.detectProjectType(input.description, input.requirements)
    
    // 推荐技术栈
    const recommendedStack = this.recommendTechStack(projectType, input.constraints)
    
    // 计算复杂度分数
    const complexity = this.calculateComplexity(input.requirements, input.constraints)
    
    // 估算时间
    const estimatedTime = this.estimateTime(complexity, input.constraints.team_size)
    
    return {
      projectType,
      recommendedStack,
      complexity,
      estimatedTime
    }
  }

  private detectProjectType(description: string, requirements: string[]): string {
    const desc = description.toLowerCase()
    const reqs = requirements.join(' ').toLowerCase()
    
    if (desc.includes('电商') || desc.includes('ecommerce') || desc.includes('商城') || 
        reqs.includes('支付') || reqs.includes('购物车') || reqs.includes('商品')) {
      return 'ecommerce'
    }
    
    if (desc.includes('saas') || desc.includes('平台') || 
        reqs.includes('多租户') || reqs.includes('订阅') || reqs.includes('billing')) {
      return 'saas'
    }
    
    if (desc.includes('博客') || desc.includes('blog') || desc.includes('内容管理')) {
      return 'blog'
    }
    
    if (desc.includes('作品集') || desc.includes('portfolio') || desc.includes('个人网站')) {
      return 'portfolio'
    }
    
    if (desc.includes('仪表板') || desc.includes('dashboard') || desc.includes('管理后台')) {
      return 'dashboard'
    }
    
    // 默认返回 blog
    return 'blog'
  }

  private recommendTechStack(projectType: string, constraints: any) {
    const baseStack = {
      database: 'postgresql',
      uiFramework: 'tailwind-radix',
      features: ['auth']
    }

    switch (projectType) {
      case 'ecommerce':
        return {
          ...baseStack,
          features: ['auth', 'payment', 'admin', 'upload', 'email']
        }
      case 'saas':
        return {
          ...baseStack,
          features: ['auth', 'billing', 'admin', 'api', 'analytics']
        }
      case 'dashboard':
        return {
          ...baseStack,
          features: ['auth', 'admin', 'analytics', 'charts']
        }
      case 'blog':
        return {
          ...baseStack,
          features: ['auth', 'cms', 'upload']
        }
      case 'portfolio':
        return {
          ...baseStack,
          features: ['upload', 'cms']
        }
      default:
        return baseStack
    }
  }

  private calculateComplexity(requirements: string[], constraints: any): number {
    let complexity = 3 // 基础复杂度
    
    // 根据需求数量增加复杂度
    complexity += requirements.length * 0.5
    
    // 根据约束条件调整
    if (constraints.complexity === 'complex') {
      complexity += 3
    } else if (constraints.complexity === 'medium') {
      complexity += 1
    }
    
    // 根据预算调整
    if (constraints.budget === 'high') {
      complexity += 1
    }
    
    return Math.min(Math.max(complexity, 1), 10)
  }

  private estimateTime(complexity: number, teamSize: number): string {
    const baseWeeks = complexity * 0.5
    const adjustedWeeks = baseWeeks / Math.sqrt(teamSize)
    
    if (adjustedWeeks < 2) {
      return '1-2周'
    } else if (adjustedWeeks < 4) {
      return '2-3周'
    } else if (adjustedWeeks < 8) {
      return '1-2个月'
    } else {
      return '2-3个月'
    }
  }
}