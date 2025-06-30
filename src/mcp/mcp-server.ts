#!/usr/bin/env node

// VibeCLI MCP Server - 基于官方SDK的正确实现
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { VibeCLICore } from '../core/vibecli-core.js'
import { AIDecisionEngine } from './ai-decision-engine.js'

// 创建MCP服务器实例
const server = new McpServer({
  name: 'vibecli-mcp',
  version: '1.2.1'
})

// 初始化核心组件
const vibecliCore = new VibeCLICore()
const aiEngine = new AIDecisionEngine()

// 注册项目分析器工具
server.registerTool(
  'project_analyzer',
  {
    title: '项目分析器',
    description: '智能分析项目需求并推荐最佳技术栈',
    inputSchema: {
      description: z.string().describe('项目描述（支持自然语言）'),
      requirements: z.array(z.string()).optional().describe('功能需求列表'),
      constraints: z.object({
        budget: z.enum(['low', 'medium', 'high']).optional().describe('预算约束'),
        timeline: z.enum(['urgent', 'normal', 'flexible']).optional().describe('时间要求'),
        team_size: z.number().min(1).max(100).optional().describe('团队规模'),
        complexity: z.enum(['simple', 'medium', 'complex']).optional().describe('项目复杂度')
      }).optional().describe('项目约束条件')
    }
  },
  async ({ description, requirements = [], constraints = {} }) => {
    try {
      console.error('🤖 启动AI智能项目分析...')
      
      const aiInput = {
        description,
        requirements,
        constraints: {
          budget: constraints.budget || 'medium',
          timeline: constraints.timeline || 'normal',
          team_size: constraints.team_size || 2,
          complexity: constraints.complexity || 'medium'
        }
      }

      const aiResult = await aiEngine.analyzeProject(aiInput)
      
      const result = {
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

      console.error('🎯 AI分析完成，生成智能推荐')
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    } catch (error) {
      console.error('项目分析失败:', error)
      return {
        content: [{
          type: 'text',
          text: `❌ 项目分析失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      }
    }
  }
)

// 注册模板生成器工具
server.registerTool(
  'template_generator',
  {
    title: '模板生成器',
    description: '基于分析结果生成完整项目模板',
    inputSchema: {
      analysis_result: z.object({
        projectType: z.string(),
        recommendedStack: z.object({
          database: z.string().optional(),
          uiFramework: z.string().optional(),
          features: z.array(z.string()).optional()
        }).optional()
      }).describe('来自project_analyzer的分析结果'),
      project_name: z.string().regex(/^[a-zA-Z0-9-_]+$/).describe('项目名称（符合文件命名规范）'),
      target_directory: z.string().optional().describe('目标生成目录'),
      customizations: z.object({}).optional().describe('定制化选项')
    }
  },
  async ({ analysis_result, project_name, target_directory, customizations = {} }) => {
    try {
      console.error('🏗️ 开始生成项目模板...')
      
      const projectConfig = {
        name: project_name,
        template: determineTemplate(analysis_result.projectType),
        database: (analysis_result.recommendedStack?.database as 'postgresql' | 'mysql' | 'sqlite') || 'postgresql',
        uiFramework: (analysis_result.recommendedStack?.uiFramework as 'tailwind-radix' | 'antd' | 'mui' | 'chakra') || 'tailwind-radix',
        features: {
          auth: analysis_result.recommendedStack?.features?.includes('auth') || false,
          admin: analysis_result.recommendedStack?.features?.includes('admin') || false,
          upload: analysis_result.recommendedStack?.features?.includes('upload') || false,
          email: analysis_result.recommendedStack?.features?.includes('email') || false,
          payment: analysis_result.recommendedStack?.features?.includes('payment') || false,
          realtime: analysis_result.recommendedStack?.features?.includes('realtime') || false
        },
        targetDirectory: target_directory
      }

      const result = await vibecliCore.createProject(projectConfig)
      
      console.error('✅ 项目模板生成完成')
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            message: result.message,
            projectPath: result.projectPath,
            generatedFiles: result.generatedFiles,
            nextSteps: result.nextSteps,
            error: result.error
          }, null, 2)
        }]
      }
    } catch (error) {
      console.error('模板生成失败:', error)
      return {
        content: [{
          type: 'text',
          text: `❌ 模板生成失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      }
    }
  }
)

// 注册功能组合器工具
server.registerTool(
  'feature_composer',
  {
    title: '功能组合器',
    description: '动态添加和组合复杂功能模块',
    inputSchema: {
      project_path: z.string().describe('项目路径'),
      feature_type: z.enum(['auth', 'payment', 'search', 'analytics', 'real-time', 'ai-integration']).describe('功能类型'),
      integration_method: z.enum(['component', 'service', 'middleware', 'plugin']).optional().describe('集成方式'),
      customization: z.object({}).optional().describe('定制化配置')
    }
  },
  async ({ project_path, feature_type, integration_method = 'component', customization = {} }) => {
    try {
      console.error(`⚡ 开始添加${feature_type}功能...`)
      
      const featureConfig = {
        name: feature_type as any,
        options: customization,
        force: false
      }

      const result = await vibecliCore.addFeature(project_path, featureConfig)
      
      console.error('✅ 功能添加完成')
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            feature: result.feature,
            message: result.message,
            addedFiles: result.addedFiles,
            modifiedFiles: result.modifiedFiles,
            instructions: result.instructions,
            error: result.error
          }, null, 2)
        }]
      }
    } catch (error) {
      console.error('功能添加失败:', error)
      return {
        content: [{
          type: 'text',
          text: `❌ 功能添加失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      }
    }
  }
)

// 注册部署管理器工具
server.registerTool(
  'deployment_manager',
  {
    title: '部署管理器',
    description: '智能部署配置和多平台发布',
    inputSchema: {
      project_path: z.string().describe('项目路径'),
      platform: z.enum(['vercel', 'netlify', 'aws', 'gcp', 'azure', 'docker']).describe('部署平台'),
      environment: z.enum(['development', 'staging', 'production']).optional().describe('部署环境'),
      custom_config: z.object({}).optional().describe('自定义配置')
    }
  },
  async ({ project_path, platform, environment = 'production', custom_config = {} }) => {
    try {
      console.error(`🚀 开始部署到${platform}...`)
      
      const deployConfig = {
        platform: platform as any,
        environment,
        customConfig: custom_config
      }

      const result = await vibecliCore.deployProject(project_path, deployConfig)
      
      console.error('✅ 部署完成')
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            platform: result.platform,
            url: result.url,
            deploymentId: result.deploymentId,
            message: result.message,
            error: result.error
          }, null, 2)
        }]
      }
    } catch (error) {
      console.error('部署失败:', error)
      return {
        content: [{
          type: 'text',
          text: `❌ 部署失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      }
    }
  }
)

// 辅助函数
function determineTemplate(projectType: string): 'default' | 'blog' | 'ecommerce' | 'saas' | 'dashboard' {
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

// 启动服务器
async function main() {
  try {
    console.error('🚀 启动VibeCLI MCP服务器...')
    
    // 预热核心组件
    console.error('🔥 预热核心组件...')
    
    const transport = new StdioServerTransport()
    await server.connect(transport)
    
    console.error('✅ VibeCLI MCP服务器已启动，等待连接...')
  } catch (error) {
    console.error('❌ 启动失败:', error)
    process.exit(1)
  }
}

// 处理帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
⚡ VibeCLI MCP服务器

用法：
  vibecli-mcp-server [选项]

选项：
  --debug                  启用调试模式
  -h, --help              显示帮助信息
  -V, --version           显示版本号

可用工具：
  - project_analyzer: 智能分析项目需求并推荐技术栈
  - template_generator: 基于分析结果生成完整项目模板
  - feature_composer: 动态添加和组合复杂功能模块
  - deployment_manager: 智能部署配置和多平台发布

示例：
  vibecli-mcp-server
  
MCP工具使用：
  项目分析: project_analyzer({"description": "电商网站", "requirements": ["用户认证", "支付"]})
  生成模板: template_generator({"analysis_result": {...}, "project_name": "my-shop"})
  添加功能: feature_composer({"project_path": "./my-project", "feature_type": "auth"})
  部署项目: deployment_manager({"project_path": "./my-project", "platform": "vercel"})
`)
  process.exit(0)
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { server }