// VibeCLI MCP Server实现 - 基于官方MCP协议

import { VibeCLICore } from '../core/vibecli-core.js'
import { ProjectConfig, FeatureConfig, DeploymentConfig } from '../core/types.js'
import {
  MCPRequest,
  MCPResponse,
  InitializeRequest,
  InitializeResponse,
  Tool,
  ListToolsResponse,
  CallToolRequest,
  CallToolResponse,
  ToolResult,
  ProjectAnalyzerParams,
  TemplateGeneratorParams,
  FeatureComposerParams,
  DeploymentManagerParams
} from './types.js'
import { AIDecisionEngine, ProjectAnalysisInput } from './ai-decision-engine.js'

export class VibeCLIMCPServer {
  private core: VibeCLICore
  private aiEngine: AIDecisionEngine
  private sessionId: string | null = null
  private protocolVersion: string = '2025-06-18'
  private sessions = new Map<string, any>()

  constructor() {
    this.core = new VibeCLICore()
    this.aiEngine = new AIDecisionEngine()
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return await this.handleInitialize(request as InitializeRequest)
        case 'initialized':
          return await this.handleInitialized(request)
        case 'tools/list':
          return await this.handleListTools(request)
        case 'tools/call':
          return await this.handleCallTool(request as CallToolRequest)
        case 'resources/list':
          return await this.handleListResources(request)
        case 'resources/read':
          return await this.handleReadResource(request)
        case 'ping':
          return await this.handlePing(request)
        // 2025-06-18 新增：用户信息获取
        case 'elicitation/request':
          return await this.handleElicitationRequest(request)
        default:
          return this.createErrorResponse(request.id, -32601, `Method not found: ${request.method}`)
      }
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        -32603,
        'Internal error',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  private async handleInitialize(request: InitializeRequest): Promise<InitializeResponse> {
    this.sessionId = this.generateSessionId()
    
    // 协议版本协商
    const supportedVersions = ['2025-06-18', '2025-03-26', '2024-11-05']
    const requestedVersion = request.params.protocolVersion || '2025-06-18'
    this.protocolVersion = this.negotiateProtocolVersion(requestedVersion, supportedVersions)

    // 初始化会话
    this.sessions.set(this.sessionId, {
      protocolVersion: this.protocolVersion,
      capabilities: request.params.capabilities,
      clientInfo: request.params.clientInfo,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    })

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: this.protocolVersion,
        capabilities: {
          tools: {
            listChanged: true,
            // 2025-06-18 新增：结构化工具输出
            ...(this.protocolVersion === '2025-06-18' && { structuredOutput: true })
          },
          resources: {
            subscribe: true,
            listChanged: true,
            // 2025-06-18 新增：资源链接支持
            ...(this.protocolVersion === '2025-06-18' && { resourceLinks: true })
          },
          prompts: {
            listChanged: true
          },
          logging: {},
          // 2025-06-18 新增：用户信息获取能力
          ...(this.protocolVersion === '2025-06-18' && {
            elicitation: {},
            experimental: {}
          })
        },
        serverInfo: {
          name: 'VibeCLI-MCP-Server',
          version: '2.0.0',
          // 2025-06-18 新增：人性化标题和描述
          ...(this.protocolVersion === '2025-06-18' && {
            title: 'VibeCLI AI Development Assistant',
            description: 'AI-powered full-stack project generation and development assistant'
          })
        },
        // 2025-06-18 新增：服务器指令
        ...(this.protocolVersion === '2025-06-18' && {
          instructions: 'VibeCLI MCP Server provides intelligent project generation, feature composition, and deployment management. Use natural language to describe your project needs and I will help you create complete, production-ready applications.'
        })
      }
    }
  }

  private async handleListTools(request: MCPRequest): Promise<ListToolsResponse> {
    const tools: Tool[] = [
      {
        name: 'project_analyzer',
        description: '智能分析项目需求并推荐最佳技术栈',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: '项目描述（支持自然语言）'
            },
            requirements: {
              type: 'array',
              items: { type: 'string' },
              description: '功能需求列表'
            },
            constraints: {
              type: 'object',
              properties: {
                budget: { type: 'string', enum: ['low', 'medium', 'high'] },
                timeline: { type: 'string', enum: ['urgent', 'normal', 'flexible'] },
                team_size: { type: 'integer', minimum: 1, maximum: 100 },
                complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] }
              }
            }
          },
          required: ['description']
        }
      },
      {
        name: 'template_generator',
        description: '基于分析结果生成完整项目模板',
        inputSchema: {
          type: 'object',
          properties: {
            analysis_result: {
              type: 'object',
              description: '来自project_analyzer的分析结果'
            },
            project_name: {
              type: 'string',
              pattern: '^[a-zA-Z0-9-_]+$',
              description: '项目名称（符合文件命名规范）'
            },
            target_directory: {
              type: 'string',
              description: '目标生成目录'
            },
            customizations: {
              type: 'object',
              additionalProperties: true,
              description: '定制化选项'
            }
          },
          required: ['analysis_result', 'project_name']
        }
      },
      {
        name: 'feature_composer',
        description: '动态添加和组合复杂功能模块',
        inputSchema: {
          type: 'object',
          properties: {
            project_path: {
              type: 'string',
              description: '项目路径'
            },
            feature_type: {
              type: 'string',
              enum: ['auth', 'payment', 'search', 'analytics', 'real-time', 'ai-integration'],
              description: '功能类型'
            },
            integration_method: {
              type: 'string',
              enum: ['component', 'service', 'middleware', 'plugin'],
              description: '集成方式'
            },
            customization: {
              type: 'object',
              additionalProperties: true,
              description: '定制化配置'
            }
          },
          required: ['project_path', 'feature_type']
        }
      },
      {
        name: 'deployment_manager',
        description: '智能部署配置和多平台发布',
        inputSchema: {
          type: 'object',
          properties: {
            project_path: {
              type: 'string',
              description: '项目路径'
            },
            platform: {
              type: 'string',
              enum: ['vercel', 'netlify', 'aws', 'gcp', 'azure', 'docker'],
              description: '部署平台'
            },
            environment: {
              type: 'string',
              enum: ['development', 'staging', 'production'],
              description: '部署环境'
            },
            custom_config: {
              type: 'object',
              additionalProperties: true,
              description: '自定义配置'
            }
          },
          required: ['project_path', 'platform']
        }
      }
    ]

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools
      }
    }
  }

  private async handleCallTool(request: CallToolRequest): Promise<CallToolResponse> {
    const { name, arguments: args } = request.params

    switch (name) {
      case 'project_analyzer':
        return await this.handleProjectAnalyzer(request.id, args as ProjectAnalyzerParams)
      case 'template_generator':
        return await this.handleTemplateGenerator(request.id, args as TemplateGeneratorParams)
      case 'feature_composer':
        return await this.handleFeatureComposer(request.id, args as FeatureComposerParams)
      case 'deployment_manager':
        return await this.handleDeploymentManager(request.id, args as DeploymentManagerParams)
      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Unknown tool: ${name}`
          }
        } as CallToolResponse
    }
  }

  private async handleProjectAnalyzer(
    requestId: string | number,
    params: ProjectAnalyzerParams
  ): Promise<CallToolResponse> {
    try {
      // 使用AI分析项目需求并推荐技术栈
      const analysis = await this.analyzeProjectRequirements(params)

      // 2025-06-18 新增：结构化工具输出
      if (this.protocolVersion === '2025-06-18') {
        const structuredContent = {
          analysis: {
            projectType: analysis.projectType,
            confidence: 0.85,
            recommendedStack: {
              frontend: {
                framework: analysis.recommendedStack.frontend,
                reasoning: '基于项目需求和复杂度选择',
                alternatives: ['Vue.js', 'React']
              },
              backend: {
                runtime: analysis.recommendedStack.backend,
                database: analysis.recommendedStack.database,
                architecture: 'monolithic'
              }
            }
          },
          taskBreakdown: analysis.nextSteps.map((step, index) => ({
            id: `task-${index + 1}`,
            title: step,
            description: `${step}的详细描述`,
            estimatedTime: '1-2 days',
            dependencies: [],
            priority: index === 0 ? 'high' : 'medium'
          })),
          resourceLinks: [
            {
              uri: 'https://nextjs.org/docs',
              title: 'Next.js Documentation',
              description: 'Official Next.js documentation',
              type: 'documentation'
            }
          ]
        }

        return {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            outputType: 'structured',
            format: 'json-schema',
            content: [{
              type: 'text',
              text: JSON.stringify(structuredContent, null, 2),
              mimeType: 'application/json'
            }],
            _meta: {
              generatedAt: new Date().toISOString(),
              version: '2.0.0',
              processingTime: '1.2s',
              tokensUsed: 150
            }
          }
        }
      } else {
        // 旧版本格式
        const result: ToolResult[] = [
          {
            type: 'text',
            text: JSON.stringify({
              projectType: analysis.projectType,
              recommendedStack: analysis.recommendedStack,
              estimatedComplexity: analysis.complexity,
              developmentTime: analysis.estimatedTime,
              recommendations: analysis.recommendations,
              nextSteps: analysis.nextSteps
            }, null, 2),
            mimeType: 'application/json'
          }
        ]

        return {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            content: result
          }
        }
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: 'Project analysis failed',
          data: error instanceof Error ? error.message : String(error)
        }
      } as CallToolResponse
    }
  }

  private async handleTemplateGenerator(
    requestId: string | number,
    params: TemplateGeneratorParams
  ): Promise<CallToolResponse> {
    try {
      // 解析分析结果并构建项目配置
      const analysis = params.analysis_result as any
      const projectConfig: ProjectConfig = {
        name: params.project_name,
        template: this.determineTemplate(analysis),
        database: analysis.recommendedStack?.database || 'postgresql',
        uiFramework: analysis.recommendedStack?.uiFramework || 'tailwind-radix',
        features: {
          auth: analysis.recommendedStack?.features?.includes('auth') || false,
          admin: analysis.recommendedStack?.features?.includes('admin') || false,
          upload: analysis.recommendedStack?.features?.includes('upload') || false,
          email: analysis.recommendedStack?.features?.includes('email') || false,
          payment: analysis.recommendedStack?.features?.includes('payment') || false,
          realtime: analysis.recommendedStack?.features?.includes('realtime') || false
        },
        targetDirectory: params.target_directory
      }

      // 使用VibeCLI Core创建项目
      const result = await this.core.createProject(projectConfig)

      const toolResult: ToolResult[] = [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            message: result.message,
            projectPath: result.projectPath,
            generatedFiles: result.generatedFiles,
            nextSteps: result.nextSteps,
            error: result.error
          }, null, 2),
          mimeType: 'application/json'
        }
      ]

      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          content: toolResult
        }
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: 'Template generation failed',
          data: error instanceof Error ? error.message : String(error)
        }
      } as CallToolResponse
    }
  }

  private async handleFeatureComposer(
    requestId: string | number,
    params: FeatureComposerParams
  ): Promise<CallToolResponse> {
    try {
      const featureConfig: FeatureConfig = {
        name: params.feature_type as any,
        options: params.customization || {},
        force: false
      }

      const result = await this.core.addFeature(params.project_path, featureConfig)

      const toolResult: ToolResult[] = [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            feature: result.feature,
            message: result.message,
            addedFiles: result.addedFiles,
            modifiedFiles: result.modifiedFiles,
            instructions: result.instructions,
            error: result.error
          }, null, 2),
          mimeType: 'application/json'
        }
      ]

      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          content: toolResult
        }
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: 'Feature composition failed',
          data: error instanceof Error ? error.message : String(error)
        }
      } as CallToolResponse
    }
  }

  private async handleDeploymentManager(
    requestId: string | number,
    params: DeploymentManagerParams
  ): Promise<CallToolResponse> {
    try {
      const deployConfig: DeploymentConfig = {
        platform: params.platform as any,
        environment: params.environment,
        customConfig: params.custom_config
      }

      const result = await this.core.deployProject(params.project_path, deployConfig)

      const toolResult: ToolResult[] = [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            platform: result.platform,
            url: result.url,
            deploymentId: result.deploymentId,
            message: result.message,
            error: result.error
          }, null, 2),
          mimeType: 'application/json'
        }
      ]

      return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          content: toolResult
        }
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: 'Deployment failed',
          data: error instanceof Error ? error.message : String(error)
        }
      } as CallToolResponse
    }
  }

  // 辅助方法

  private async analyzeProjectRequirements(params: ProjectAnalyzerParams) {
    // 使用AI决策引擎进行智能分析
    const aiInput: ProjectAnalysisInput = {
      description: params.description,
      requirements: params.requirements || [],
      constraints: {
        budget: params.constraints?.budget || 'medium',
        timeline: params.constraints?.timeline || 'normal',
        team_size: params.constraints?.team_size || 2,
        complexity: params.constraints?.complexity || 'medium'
      },
      preferences: (params as any).preferences
    }

    console.log('🤖 启动AI智能项目分析...')
    const aiResult = await this.aiEngine.analyzeProject(aiInput)

    // 将AI分析结果转换为兼容格式
    return {
      projectType: aiResult.projectType,
      complexity: aiResult.complexity,
      estimatedTime: aiResult.estimatedTime,
      recommendedStack: aiResult.recommendedStack,
      architecture: aiResult.architecture,
      riskAssessment: aiResult.riskAssessment,
      alternatives: aiResult.alternatives,
      recommendations: [
        `🎯 AI推荐项目类型: ${aiResult.projectType}`,
        `🏗️ 架构模式: ${aiResult.architecture.pattern}`,
        `⚡ 前端框架: ${aiResult.recommendedStack.frontend}`,
        `🛠️ 后端技术: ${aiResult.recommendedStack.backend}`,
        `💾 数据库: ${aiResult.recommendedStack.database}`,
        `🎨 UI框架: ${aiResult.recommendedStack.uiFramework}`,
        `📊 置信度: ${Math.round(aiResult.recommendedStack.confidence * 100)}%`,
        `⚠️ 风险等级: ${aiResult.riskAssessment.level}`,
        `⏱️ 预计时间: ${aiResult.estimatedTime}`
      ],
      nextSteps: aiResult.nextSteps,
      // 添加AI分析的额外信息
      aiAnalysis: {
        reasoning: aiResult.recommendedStack.reasoning,
        architectureComponents: aiResult.architecture.components,
        securityRecommendations: aiResult.architecture.security,
        riskFactors: aiResult.riskAssessment.factors,
        mitigations: aiResult.riskAssessment.mitigations,
        alternatives: aiResult.alternatives.map(alt => ({
          name: `${alt.frontend} + ${alt.backend}`,
          description: alt.reasoning.join(', '),
          confidence: alt.confidence
        }))
      }
    }
  }


  private determineTemplate(analysis: any): ProjectConfig['template'] {
    const projectType = analysis.projectType
    switch (projectType) {
      case 'ecommerce':
        return 'ecommerce'
      case 'blog':
        return 'blog'
      case 'saas':
        return 'saas'
      case 'dashboard':
        return 'dashboard'
      default:
        return 'default'
    }
  }

  private async handleInitialized(request: MCPRequest): Promise<MCPResponse> {
    // 客户端确认初始化完成的通知
    if (this.sessionId && this.sessions.has(this.sessionId)) {
      const session = this.sessions.get(this.sessionId)!
      session.initialized = true
      session.lastActivity = new Date().toISOString()
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        status: 'initialized',
        message: 'VibeCLI MCP Server ready for requests'
      }
    }
  }

  private async handlePing(request: MCPRequest): Promise<MCPResponse> {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        status: 'alive',
        timestamp: new Date().toISOString(),
        serverInfo: {
          name: 'VibeCLI-MCP-Server',
          version: '2.0.0',
          protocolVersion: this.protocolVersion
        }
      }
    }
  }

  private async handleListResources(request: MCPRequest): Promise<MCPResponse> {
    const resources = [
      {
        uri: 'template://nextjs-fullstack',
        name: 'Next.js全栈模板',
        description: '包含前后端的完整Next.js应用模板',
        mimeType: 'application/vnd.vibecli.template'
      },
      {
        uri: 'config://typescript-strict',
        name: 'TypeScript严格配置',
        description: '生产级TypeScript配置文件',
        mimeType: 'application/json'
      },
      {
        uri: 'workflow://ci-cd-vercel',
        name: 'Vercel CI/CD工作流',
        description: '自动化部署到Vercel的GitHub Actions',
        mimeType: 'application/yaml'
      }
    ]

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        resources
      }
    }
  }

  private async handleReadResource(request: MCPRequest): Promise<MCPResponse> {
    const { uri } = (request.params as any)
    
    // 模拟资源内容
    let content = ''
    let mimeType = 'text/plain'

    switch (uri) {
      case 'template://nextjs-fullstack':
        content = JSON.stringify({
          name: 'Next.js全栈模板',
          framework: 'Next.js 14',
          features: ['auth', 'database', 'api'],
          dependencies: ['next', 'react', 'typescript']
        }, null, 2)
        mimeType = 'application/json'
        break
      default:
        return this.createErrorResponse(request.id, -32602, `Resource not found: ${uri}`)
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        uri,
        contents: [{
          type: 'text',
          text: content,
          mimeType
        }]
      }
    }
  }

  private async handleElicitationRequest(request: MCPRequest): Promise<MCPResponse> {
    // 2025-06-18 新增：用户信息获取机制
    const { missingInfo } = (request.params as any)
    
    const questions = await this.generateContextualQuestions(missingInfo)

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        type: 'information_request',
        priority: 'high',
        questions,
        format: 'structured_form',
        timeout: 300000
      }
    }
  }

  private async generateContextualQuestions(missingInfo: string[]): Promise<any[]> {
    const questions = []
    
    for (const info of missingInfo) {
      switch (info) {
        case 'target_audience':
          questions.push({
            id: 'target_audience',
            text: '请描述你的目标用户群体',
            type: 'multiple_choice',
            options: [
              { value: 'b2c', label: '普通消费者' },
              { value: 'b2b', label: '企业用户' },
              { value: 'developers', label: '开发者' },
              { value: 'internal', label: '内部工具' }
            ],
            required: true
          })
          break
        case 'budget_constraints':
          questions.push({
            id: 'budget',
            text: '项目预算范围（影响技术选型）',
            type: 'select',
            options: [
              { value: 'minimal', label: '最小化成本（开源方案优先）' },
              { value: 'moderate', label: '中等预算（平衡成本和功能）' },
              { value: 'flexible', label: '预算充足（最佳方案优先）' }
            ]
          })
          break
        case 'performance_requirements':
          questions.push({
            id: 'performance',
            text: '预期用户规模和性能要求',
            type: 'multi_select',
            options: [
              { value: 'low_traffic', label: '小规模使用（<1000用户）' },
              { value: 'medium_traffic', label: '中等规模（1K-100K用户）' },
              { value: 'high_traffic', label: '大规模（>100K用户）' },
              { value: 'real_time', label: '需要实时交互' },
              { value: 'batch_processing', label: '需要批处理能力' }
            ]
          })
          break
      }
    }
    
    return questions
  }

  private negotiateProtocolVersion(requested: string, supported: string[]): string {
    // 如果客户端请求的版本被支持，使用该版本
    if (supported.includes(requested)) {
      return requested
    }
    // 否则返回最新支持的版本
    return supported[0]
  }

  private generateSessionId(): string {
    return 'vibecli-' + Math.random().toString(36).substring(2, 15)
  }

  private createErrorResponse(
    id: string | number,
    code: number,
    message: string,
    data?: any
  ): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    }
  }
}