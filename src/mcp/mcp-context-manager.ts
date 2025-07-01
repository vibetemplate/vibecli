import type { PromptGenerationConfig, PromptContext } from '../core/types.js'
import { intelligentTemplateMatcher, type TemplateMatchResult, type RequirementFeature } from '../prompts/dynamic/intelligent-template-matcher.js'
import { intelligentFallbackHandler, type FallbackResult } from '../prompts/dynamic/intelligent-fallback-handler.js'

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
  templateMatchResult?: TemplateMatchResult
  fallbackResult?: FallbackResult
  clarificationQuestions?: ClarificationQuestion[]
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
   * 记录用户输入并分析上下文 - 增强版，支持智能模板匹配
   */
  async recordUserInput(sessionId: string, userMessage: string): Promise<MCPContextAnalysis> {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error(`会话 ${sessionId} 不存在`)
    }

    // 分析当前输入的上下文线索
    const contextClues = this.extractContextClues(userMessage, session)
    
    // 更新累积上下文
    this.updateAccumulatedContext(session, contextClues)
    
    // 使用智能模板匹配器分析需求
    const templateMatch = await this.performIntelligentTemplateMatching(session, userMessage, contextClues)
    
    // 记录对话轮次，包含模板匹配结果
    const turn: MCPConversationTurn = {
      timestamp: new Date(),
      userMessage,
      context: {
        projectType: contextClues.projectType,
        features: contextClues.features,
        userExperience: contextClues.userExperience,
        developmentPhase: contextClues.developmentPhase
      },
      templateMatchResult: templateMatch
    }
    
    session.conversationHistory.push(turn)

    // 基于模板匹配结果生成增强的智能响应
    return await this.generateEnhancedIntelligentResponse(session, contextClues, templateMatch)
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

  /**
   * 执行智能模板匹配
   */
  private async performIntelligentTemplateMatching(
    session: MCPSessionState,
    userMessage: string,
    contextClues: ContextClues
  ): Promise<TemplateMatchResult> {
    const context = session.accumulatedContext
    
    // 收集所有对话中的信息作为用户描述
    const allMessages = session.conversationHistory
      .map(turn => turn.userMessage)
      .concat([userMessage])
      .join(' ')

    // 准备约束条件
    const constraints = {
      complexity: context.userProfile.experienceLevel,
      timeline: this.inferTimelineFromContext(session)
    }

    // 使用智能模板匹配器
    return await intelligentTemplateMatcher.findBestMatch(
      allMessages,
      contextClues.features,
      context.projectInsights.techPreferences,
      constraints
    )
  }

  /**
   * 生成增强的智能响应
   */
  private async generateEnhancedIntelligentResponse(
    session: MCPSessionState,
    contextClues: ContextClues,
    templateMatch: TemplateMatchResult
  ): Promise<MCPContextAnalysis> {
    const context = session.accumulatedContext
    
    // 基础置信度计算
    let confidence = Math.min(contextClues.confidence, templateMatch.matchScore)
    
    // 根据模板匹配结果调整响应策略
    const suggestions: string[] = []
    const clarifications: string[] = []
    let fallbackGuidance: FallbackResult | undefined
    let smartQuestions: ClarificationQuestion[] = []

    if (templateMatch.confidence === 'high') {
      suggestions.push(`推荐使用 ${templateMatch.template?.name || '默认模板'} 模板`)
      if (templateMatch.missingFeatures.length > 0) {
        suggestions.push('需要额外添加以下功能：' + templateMatch.missingFeatures.map(f => f.name).join('、'))
        
        // 为缺失功能生成智能问题
        smartQuestions = this.generateSmartQuestions(templateMatch.missingFeatures, 'enhancement')
      }
    } else if (templateMatch.confidence === 'medium') {
      suggestions.push(`建议基于 ${templateMatch.template?.name || '默认模板'} 模板进行定制`)
      clarifications.push('请详细描述以下需求以获得更精确的匹配')
      
      // 生成具体的澄清问题
      smartQuestions = this.generateSmartQuestions(templateMatch.missingFeatures, 'clarification')
    } else {
      // 低置信度时启用智能降级处理
      try {
        fallbackGuidance = await intelligentFallbackHandler.handleFallback(
          templateMatch,
          [...templateMatch.matchedFeatures, ...templateMatch.missingFeatures],
          {
            experience: contextClues.userExperience || 'intermediate',
            timeline: this.inferTimelineFromContext(session),
            preferences: context.projectInsights.techPreferences
          }
        )

        suggestions.push('为您提供智能的实现方案：')
        suggestions.push(`• 推荐策略: ${fallbackGuidance.strategy.reasoning}`)
        fallbackGuidance.alternatives.forEach(alt => {
          suggestions.push(`• ${alt.title} (匹配度: ${alt.matchScore}%)`)
        })
        
        // 生成基于降级方案的问题
        smartQuestions = this.generateFallbackQuestions(fallbackGuidance)
      } catch (error) {
        // 降级处理失败时的备用方案
        suggestions.push('为您提供以下基础实现方案：')
        templateMatch.suggestedApproach.alternatives.forEach(alt => {
          suggestions.push(`• ${alt.description} (匹配度: ${alt.matchScore}%)`)
        })
        clarifications.push('请选择一个最符合您需求的方案，或提供更多项目细节')
      }
    }

    // 添加实施计划建议
    if (templateMatch.implementation) {
      suggestions.push(`开发复杂度: ${templateMatch.implementation.complexity}`)
      suggestions.push(`预估时间: ${templateMatch.implementation.estimatedTime}`)
    }

    return {
      confidence,
      projectType: templateMatch.template?.projectType || contextClues.projectType,
      features: [
        ...contextClues.features,
        ...templateMatch.matchedFeatures.map(f => f.name)
      ],
      userExperience: contextClues.userExperience,
      suggestions,
      clarifications,
      readyForGeneration: confidence >= 70 && templateMatch.confidence !== 'low',
      fallbackGuidance,
      smartQuestions
    }
  }

  /**
   * 从上下文推断时间线要求
   */
  private inferTimelineFromContext(session: MCPSessionState): string {
    const messages = session.conversationHistory.map(t => t.userMessage).join(' ').toLowerCase()
    
    if (messages.includes('紧急') || messages.includes('急') || messages.includes('尽快')) {
      return 'urgent'
    }
    if (messages.includes('灵活') || messages.includes('不急') || messages.includes('慢慢')) {
      return 'flexible'  
    }
    return 'normal'
  }

  /**
   * 生成智能澄清问题
   */
  private generateSmartQuestions(
    features: RequirementFeature[],
    type: 'clarification' | 'enhancement'
  ): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = []

    features.forEach((feature, index) => {
      if (feature.importance === 'high' || (type === 'enhancement' && feature.complexity > 6)) {
        const questionId = `q_${Date.now()}_${index}`
        
        switch (feature.category) {
          case 'auth':
            questions.push({
              id: questionId,
              type: 'choice',
              question: '您希望实现哪种类型的用户认证？',
              context: '选择适合的认证方式将影响系统的安全性和用户体验',
              importance: 'high',
              options: [
                {
                  value: 'simple',
                  label: '简单的邮箱密码认证',
                  description: '传统的用户名密码登录',
                  implications: ['开发简单', '安全性一般']
                },
                {
                  value: 'oauth',
                  label: '社交账号登录 (Google, GitHub等)',
                  description: '使用第三方OAuth服务',
                  implications: ['用户体验好', '开发复杂度中等']
                },
                {
                  value: 'advanced',
                  label: '多因素认证',
                  description: '包含短信、邮箱验证等',
                  implications: ['安全性高', '开发复杂度高']
                }
              ]
            })
            break

          case 'integration':
            if (feature.name === 'payment') {
              questions.push({
                id: questionId,
                type: 'choice',
                question: '您需要支持哪些支付方式？',
                context: '支付方式的选择会影响用户转化率和开发复杂度',
                importance: 'high',
                options: [
                  {
                    value: 'stripe',
                    label: 'Stripe (国际标准)',
                    description: '支持信用卡、数字钱包等',
                    implications: ['国际化支持好', '手续费较高']
                  },
                  {
                    value: 'local',
                    label: '本地支付 (支付宝、微信)',
                    description: '适合中国市场',
                    implications: ['本地化好', '国际化受限']
                  },
                  {
                    value: 'both',
                    label: '多种支付方式',
                    description: '覆盖更多用户群体',
                    implications: ['覆盖面广', '开发复杂度高']
                  }
                ]
              })
            }
            break

          case 'data':
            questions.push({
              id: questionId,
              type: 'choice',
              question: '您预期的数据规模是多少？',
              context: '数据规模将影响数据库选择和架构设计',
              importance: 'medium',
              options: [
                {
                  value: 'small',
                  label: '小规模 (< 10万条记录)',
                  description: 'SQLite或简单配置的PostgreSQL',
                  implications: ['部署简单', '扩展性有限']
                },
                {
                  value: 'medium',
                  label: '中等规模 (10万-100万条记录)',
                  description: 'PostgreSQL或MySQL',
                  implications: ['性能平衡', '维护成本适中']
                },
                {
                  value: 'large',
                  label: '大规模 (> 100万条记录)',
                  description: '分布式数据库或云服务',
                  implications: ['高性能', '复杂度和成本高']
                }
              ]
            })
            break

          default:
            // 通用问题
            questions.push({
              id: questionId,
              type: 'text',
              question: `请详细描述您对 ${feature.name} 功能的具体需求`,
              context: '具体的需求描述将帮助我们提供更精确的实现方案',
              importance: feature.importance,
              expectedAnswer: `${feature.name} 功能的详细说明`
            })
        }
      }
    })

    return questions
  }

  /**
   * 基于降级方案生成问题
   */
  private generateFallbackQuestions(fallbackResult: FallbackResult): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = []

    // 策略选择问题
    if (fallbackResult.alternatives.length > 1) {
      questions.push({
        id: `fallback_strategy_${Date.now()}`,
        type: 'choice',
        question: '请选择您偏好的实现方案',
        context: '不同方案有不同的优劣势，请根据您的实际情况选择',
        importance: 'high',
        options: fallbackResult.alternatives.map(alt => ({
          value: alt.approach,
          label: alt.title,
          description: alt.description,
          implications: alt.tradeoffs
        }))
      })
    }

    // 重要决策问题
    fallbackResult.guidance.keyDecisions.forEach((decision, index) => {
      if (decision.impact === 'high') {
        questions.push({
          id: `decision_${Date.now()}_${index}`,
          type: 'choice',
          question: decision.decision,
          context: '这是一个关键决策，将显著影响项目的开发和维护',
          importance: 'high',
          options: decision.options.map(opt => ({
            value: opt.choice,
            label: opt.choice,
            description: `优点: ${opt.pros.join(', ')}`,
            implications: [`缺点: ${opt.cons.join(', ')}`, `复杂度: ${opt.complexity}/10`]
          }))
        })
      }
    })

    // 时间线确认
    questions.push({
      id: `timeline_${Date.now()}`,
      type: 'confirmation',
      question: `根据分析，您的项目预计需要 ${fallbackResult.progressive.milestones[0]?.timeEstimate || '2-3周'} 完成第一阶段，这个时间安排是否合适？`,
      context: '时间安排会影响功能范围和实现策略的选择',
      importance: 'medium'
    })

    return questions
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
  fallbackGuidance?: FallbackResult
  smartQuestions?: ClarificationQuestion[]
}

/**
 * 澄清问题类型
 */
export interface ClarificationQuestion {
  id: string
  type: 'choice' | 'text' | 'priority' | 'confirmation'
  question: string
  context: string
  importance: 'high' | 'medium' | 'low'
  options?: QuestionOption[]
  expectedAnswer?: string
  followUp?: string[]
}

export interface QuestionOption {
  value: string
  label: string
  description?: string
  implications?: string[]
}

/**
 * 全局MCP上下文管理器实例
 */
export const mcpContextManager = new MCPContextManager()