import type { PromptGenerationConfig, PromptContext } from '../core/types.js'

/**
 * MCP上下文对话历史
 */
export interface MCPConversationTurn {
  timestamp: Date
  userMessage: string
  toolCall?: {
    name: string
    args: any
    result: any
  }
  context: {
    projectType?: string
    features?: string[]
    userExperience?: 'beginner' | 'intermediate' | 'expert'
    developmentPhase?: 'planning' | 'development' | 'optimization'
  }
}

/**
 * MCP会话状态
 */
export interface MCPSessionState {
  sessionId: string
  conversationHistory: MCPConversationTurn[]
  accumulatedContext: {
    projectInsights: {
      confirmedType?: string
      likelyFeatures: string[]
      techPreferences: string[]
      complexityIndicators: string[]
    }
    userProfile: {
      experienceLevel?: 'beginner' | 'intermediate' | 'expert'
      preferredApproach?: 'step-by-step' | 'high-level' | 'code-first'
      previousProjects?: string[]
    }
    conversationFlow: {
      clarificationNeeded: string[]
      confidenceLevel: number
      nextSuggestedQuestions: string[]
    }
  }
}

/**
 * MCP智能上下文管理器
 * 通过多轮对话和协议上下文进行智能匹配
 */
export class MCPContextManager {
  private sessions: Map<string, MCPSessionState> = new Map()
  private currentSessionId: string | null = null

  /**
   * 开始新的MCP会话
   */
  startSession(sessionId?: string): string {
    const id = sessionId || this.generateSessionId()
    this.currentSessionId = id
    
    this.sessions.set(id, {
      sessionId: id,
      conversationHistory: [],
      accumulatedContext: {
        projectInsights: {
          likelyFeatures: [],
          techPreferences: [],
          complexityIndicators: []
        },
        userProfile: {},
        conversationFlow: {
          clarificationNeeded: [],
          confidenceLevel: 0,
          nextSuggestedQuestions: []
        }
      }
    })

    return id
  }

  /**
   * 记录用户输入并分析上下文
   */
  recordUserInput(sessionId: string, userMessage: string): MCPContextAnalysis {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`)
    }

    // 分析当前输入的上下文线索
    const contextClues = this.extractContextClues(userMessage, session)
    
    // 更新累积上下文
    this.updateAccumulatedContext(session, contextClues)
    
    // 记录对话轮次
    const turn: MCPConversationTurn = {
      timestamp: new Date(),
      userMessage,
      context: {
        projectType: contextClues.projectType,
        features: contextClues.features,
        userExperience: contextClues.userExperience,
        developmentPhase: contextClues.developmentPhase
      }
    }
    
    session.conversationHistory.push(turn)

    // 生成智能响应建议
    return this.generateIntelligentResponse(session, contextClues)
  }

  /**
   * 记录工具调用结果
   */
  recordToolCall(sessionId: string, toolName: string, args: any, result: any) {
    const session = this.getSession(sessionId)
    if (!session) return

    const lastTurn = session.conversationHistory[session.conversationHistory.length - 1]
    if (lastTurn) {
      lastTurn.toolCall = { name: toolName, args, result }
    }

    // 从工具调用结果中学习
    this.learnFromToolCall(session, toolName, args, result)
  }

  /**
   * 提取上下文线索
   */
  private extractContextClues(userMessage: string, session: MCPSessionState): ContextClues {
    const message = userMessage.toLowerCase()
    const history = session.conversationHistory

    // 项目类型推断（基于对话历史和当前输入）
    const projectType = this.inferProjectType(message, history)
    
    // 功能需求提取（渐进式识别）
    const features = this.extractFeatures(message, history)
    
    // 用户经验水平推断
    const userExperience = this.inferUserExperience(message, history)
    
    // 开发阶段识别
    const developmentPhase = this.inferDevelopmentPhase(message, history)

    return {
      projectType,
      features,
      userExperience,
      developmentPhase,
      confidence: this.calculateContextConfidence(session)
    }
  }

  /**
   * 基于对话历史推断项目类型
   */
  private inferProjectType(currentMessage: string, history: MCPConversationTurn[]): string | undefined {
    // 收集所有对话中的线索
    const allMessages = [
      ...history.map(t => t.userMessage),
      currentMessage
    ].join(' ').toLowerCase()

    // 项目类型线索权重（基于对话上下文）
    const typeIndicators = {
      ecommerce: {
        primary: ['电商', '商城', '购物', '支付', 'shop', 'store', 'ecommerce'],
        secondary: ['订单', '商品', '库存', 'payment', 'cart'],
        contextual: ['销售', '客户', '商业', 'business']
      },
      saas: {
        primary: ['saas', '软件服务', '订阅', '平台', 'platform'],
        secondary: ['企业', '团队', '多租户', 'subscription'],
        contextual: ['用户管理', '计费', '集成', 'integration']
      },
      blog: {
        primary: ['博客', '文章', '内容', 'blog', 'content'],
        secondary: ['发布', '写作', '编辑', 'post'],
        contextual: ['作者', '评论', 'cms']
      },
      portfolio: {
        primary: ['作品集', '个人', '展示', 'portfolio'],
        secondary: ['简历', '项目', 'showcase'],
        contextual: ['设计师', '开发者', '创意']
      },
      dashboard: {
        primary: ['仪表板', '后台', '管理', 'dashboard', 'admin'],
        secondary: ['数据', '图表', '分析', 'analytics'],
        contextual: ['统计', '报表', '监控']
      }
    }

    let bestMatch = { type: '', score: 0 }

    Object.entries(typeIndicators).forEach(([type, indicators]) => {
      let score = 0
      
      // 主要指示词权重最高
      indicators.primary.forEach(word => {
        if (allMessages.includes(word)) score += 10
      })
      
      // 次要指示词中等权重
      indicators.secondary.forEach(word => {
        if (allMessages.includes(word)) score += 5
      })
      
      // 上下文指示词较低权重
      indicators.contextual.forEach(word => {
        if (allMessages.includes(word)) score += 2
      })

      if (score > bestMatch.score) {
        bestMatch = { type, score }
      }
    })

    return bestMatch.score >= 10 ? bestMatch.type : undefined
  }

  /**
   * 渐进式特征提取
   */
  private extractFeatures(currentMessage: string, history: MCPConversationTurn[]): string[] {
    const allMessages = [
      ...history.map(t => t.userMessage),
      currentMessage
    ].join(' ').toLowerCase()

    const featurePatterns = {
      auth: ['登录', '注册', '用户', '认证', 'login', 'auth', 'user'],
      payment: ['支付', '付款', '收费', 'payment', 'pay', 'billing'],
      admin: ['管理', '后台', '权限', 'admin', 'management'],
      upload: ['上传', '文件', '图片', 'upload', 'file'],
      email: ['邮件', '通知', '发送', 'email', 'notification'],
      search: ['搜索', '查找', '筛选', 'search', 'filter'],
      analytics: ['分析', '统计', '数据', 'analytics', 'stats'],
      realtime: ['实时', '即时', '聊天', 'realtime', 'chat', 'live']
    }

    const detectedFeatures: string[] = []

    Object.entries(featurePatterns).forEach(([feature, patterns]) => {
      const hasFeature = patterns.some(pattern => allMessages.includes(pattern))
      if (hasFeature) {
        detectedFeatures.push(feature)
      }
    })

    return detectedFeatures
  }

  /**
   * 推断用户经验水平
   */
  private inferUserExperience(
    currentMessage: string, 
    history: MCPConversationTurn[]
  ): 'beginner' | 'intermediate' | 'expert' | undefined {
    const allMessages = [
      ...history.map(t => t.userMessage),
      currentMessage
    ].join(' ').toLowerCase()

    // 新手指示词
    const beginnerIndicators = [
      '新手', '初学', '不懂', '学习', '教程', '怎么', '如何',
      'beginner', 'new', 'learn', 'tutorial', 'how to'
    ]

    // 专家指示词
    const expertIndicators = [
      '架构', '优化', '性能', '扩展', '微服务', '高并发',
      'architecture', 'optimize', 'scalable', 'microservice'
    ]

    const beginnerScore = beginnerIndicators.filter(word => allMessages.includes(word)).length
    const expertScore = expertIndicators.filter(word => allMessages.includes(word)).length

    if (expertScore >= 2) return 'expert'
    if (beginnerScore >= 2) return 'beginner'
    return 'intermediate' // 默认中级
  }

  /**
   * 识别开发阶段
   */
  private inferDevelopmentPhase(
    currentMessage: string,
    history: MCPConversationTurn[]
  ): 'planning' | 'development' | 'optimization' | undefined {
    const recentMessages = [
      ...history.slice(-3).map(t => t.userMessage),
      currentMessage
    ].join(' ').toLowerCase()

    if (recentMessages.match(/计划|设计|规划|架构|plan|design/)) {
      return 'planning'
    }
    if (recentMessages.match(/优化|性能|部署|deploy|optimize/)) {
      return 'optimization'
    }
    return 'development' // 默认开发阶段
  }

  /**
   * 更新累积上下文
   */
  private updateAccumulatedContext(session: MCPSessionState, clues: ContextClues) {
    const context = session.accumulatedContext

    // 更新项目洞察
    if (clues.projectType) {
      context.projectInsights.confirmedType = clues.projectType
    }
    
    // 累积特征（去重）
    context.projectInsights.likelyFeatures = [
      ...new Set([...context.projectInsights.likelyFeatures, ...clues.features])
    ]

    // 更新用户画像
    if (clues.userExperience) {
      context.userProfile.experienceLevel = clues.userExperience
    }

    // 更新置信度
    context.conversationFlow.confidenceLevel = clues.confidence
  }

  /**
   * 生成智能响应
   */
  private generateIntelligentResponse(
    session: MCPSessionState,
    clues: ContextClues
  ): MCPContextAnalysis {
    const context = session.accumulatedContext
    const suggestions: string[] = []
    const clarifications: string[] = []

    // 基于置信度决定下一步动作
    if (clues.confidence < 70) {
      if (!context.projectInsights.confirmedType) {
        clarifications.push('您的项目主要是做什么的？比如电商网站、管理系统还是个人博客？')
      }
      
      if (context.projectInsights.likelyFeatures.length < 2) {
        clarifications.push('您希望项目包含哪些主要功能？比如用户登录、支付处理等。')
      }
    } else {
      // 高置信度时提供建议
      suggestions.push(`基于对话，我理解您要开发一个${context.projectInsights.confirmedType}项目`)
      
      if (context.projectInsights.likelyFeatures.length > 0) {
        suggestions.push(`主要功能包括：${context.projectInsights.likelyFeatures.join('、')}`)
      }
    }

    return {
      confidence: clues.confidence,
      projectType: context.projectInsights.confirmedType,
      features: context.projectInsights.likelyFeatures,
      userExperience: context.userProfile.experienceLevel,
      suggestions,
      clarifications,
      readyForGeneration: clues.confidence >= 75 && !!context.projectInsights.confirmedType
    }
  }

  /**
   * 从工具调用中学习
   */
  private learnFromToolCall(
    session: MCPSessionState,
    toolName: string,
    args: any,
    result: any
  ) {
    // 从 project_analyzer 的结果学习
    if (toolName === 'project_analyzer' && result.success) {
      const analysis = result.analysis || {}
      session.accumulatedContext.projectInsights.confirmedType = analysis.projectType
      if (analysis.recommendedStack?.features) {
        session.accumulatedContext.projectInsights.likelyFeatures = 
          [...new Set([
            ...session.accumulatedContext.projectInsights.likelyFeatures,
            ...analysis.recommendedStack.features
          ])]
      }
    }

    // 从用户对生成结果的反应学习
    if (toolName === 'prompt_generator') {
      session.accumulatedContext.conversationFlow.confidenceLevel = 
        Math.max(session.accumulatedContext.conversationFlow.confidenceLevel, 85)
    }
  }

  /**
   * 计算上下文置信度
   */
  private calculateContextConfidence(session: MCPSessionState): number {
    let confidence = 30 // 基础置信度

    const context = session.accumulatedContext
    const history = session.conversationHistory

    // 项目类型明确性
    if (context.projectInsights.confirmedType) confidence += 25

    // 功能需求明确性
    confidence += Math.min(20, context.projectInsights.likelyFeatures.length * 5)

    // 对话历史丰富度
    confidence += Math.min(15, history.length * 3)

    // 技术偏好明确性
    confidence += Math.min(10, context.projectInsights.techPreferences.length * 3)

    return Math.min(100, confidence)
  }

  /**
   * 获取会话状态
   */
  getSession(sessionId: string): MCPSessionState | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `mcp_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取当前最佳的提示词生成配置
   */
  getOptimalPromptConfig(sessionId: string): PromptGenerationConfig | null {
    const session = this.getSession(sessionId)
    if (!session) return null

    const context = session.accumulatedContext
    
    if (context.conversationFlow.confidenceLevel < 70) {
      return null // 信息不足，无法生成
    }

    return {
      userDescription: this.reconstructUserIntent(session),
      projectType: context.projectInsights.confirmedType,
      detectedFeatures: context.projectInsights.likelyFeatures,
      complexityLevel: this.inferComplexityFromContext(session),
      techStack: context.projectInsights.techPreferences
    }
  }

  /**
   * 重构用户意图描述
   */
  private reconstructUserIntent(session: MCPSessionState): string {
    const context = session.accumulatedContext
    const parts: string[] = []

    if (context.projectInsights.confirmedType) {
      parts.push(`开发一个${context.projectInsights.confirmedType}项目`)
    }

    if (context.projectInsights.likelyFeatures.length > 0) {
      parts.push(`需要${context.projectInsights.likelyFeatures.join('、')}功能`)
    }

    if (context.projectInsights.techPreferences.length > 0) {
      parts.push(`使用${context.projectInsights.techPreferences.join('、')}技术`)
    }

    return parts.join('，') || '开发一个Web应用'
  }

  /**
   * 从上下文推断复杂度
   */
  private inferComplexityFromContext(session: MCPSessionState): 'simple' | 'medium' | 'complex' {
    const features = session.accumulatedContext.projectInsights.likelyFeatures
    const experience = session.accumulatedContext.userProfile.experienceLevel

    if (features.length >= 5 || experience === 'expert') return 'complex'
    if (features.length >= 3 || experience === 'intermediate') return 'medium'
    return 'simple'
  }
}

/**
 * 上下文线索接口
 */
interface ContextClues {
  projectType?: string
  features: string[]
  userExperience?: 'beginner' | 'intermediate' | 'expert'
  developmentPhase?: 'planning' | 'development' | 'optimization'
  confidence: number
}

/**
 * MCP上下文分析结果
 */
export interface MCPContextAnalysis {
  confidence: number
  projectType?: string
  features: string[]
  userExperience?: 'beginner' | 'intermediate' | 'expert'
  suggestions: string[]
  clarifications: string[]
  readyForGeneration: boolean
}

/**
 * 全局MCP上下文管理器实例
 */
export const mcpContextManager = new MCPContextManager()