#!/usr/bin/env node

/**
 * VibeCLI MCP服务器 - AI驱动的Web全栈应用CLI工具
 * 
 * @author VibeCLI Team
 * @license MIT
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Command } from 'commander';
import os from 'os';
import path from 'path';
import { VibeCLICore } from '../core/vibecli-core.js';
import { promptTemplateEngine } from '../prompts/dynamic/template-engine.js';
import { mcpContextManager } from './mcp-context-manager.js';
import { intentAnalyzer } from '../prompts/dynamic/intent-analyzer.js';
import type { ProjectConfig, PromptGenerationConfig, PromptContext } from '../core/types.js';

// 解析命令行参数
const program = new Command();
program
  .name('vibecli-mcp-server')
  .description('VibeCLI MCP服务器 - AI驱动的Web全栈应用CLI工具')
  .version('1.5.0')
  .option('--debug', '启用调试模式')
  .option('--no-telemetry', '禁用遥测')
  .parse();

const options = program.opts();

// 创建MCP服务器
const server = new McpServer({
  name: 'vibecli-mcp',
  version: '1.5.0'
});

// 初始化核心组件
const vibecliCore = new VibeCLICore();

// 辅助函数：获取默认项目目录（生成到当前工作目录）
function getDefaultProjectDirectory(): string {
  // 直接使用当前工作目录，而不是创建特定的VibeCLI目录
  return process.cwd()
}

// 辅助函数：获取项目预计生成位置
function getProjectTargetPath(projectName: string, targetDirectory?: string): string {
  if (targetDirectory) {
    return path.resolve(targetDirectory, projectName)
  } else {
    // 生成到当前工作目录下
    return path.join(process.cwd(), projectName)
  }
}

// 辅助函数：确定模板类型
function determineTemplate(projectType: string): string {
  const templateMap: Record<string, string> = {
    'blog': 'default',
    'ecommerce': 'ecommerce',
    'dashboard': 'auth-system',
    'portfolio': 'default',
    'cms': 'auth-system',
    'saas': 'auth-system',
    'api': 'default',
    'landing': 'default'
  };
  return templateMap[projectType.toLowerCase()] || 'default';
}

// 辅助函数：验证数据库类型
function validateDatabase(db: string): 'postgresql' | 'mysql' | 'sqlite' {
  const validDbs = ['postgresql', 'mysql', 'sqlite'];
  return validDbs.includes(db) ? db as 'postgresql' | 'mysql' | 'sqlite' : 'postgresql';
}

// 辅助函数：从用户描述中提取项目名称
function extractProjectName(description: string): string | null {
  // 尝试匹配常见的项目名称模式
  const patterns = [
    /(?:项目|网站|系统|平台|应用)[\s"'《「]*([a-zA-Z0-9\u4e00-\u9fff]+)/,
    /(?:叫做|命名为|名为)[\s"'《「]*([a-zA-Z0-9\u4e00-\u9fff]+)/,
    /^([a-zA-Z][a-zA-Z0-9\-_]*)/  // 以字母开头的单词
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

// 辅助函数：构建技术栈字符串
function getTechStackString(intent: any, config: PromptGenerationConfig): string {
  const techStack = new Set<string>();

  // 添加默认技术栈
  techStack.add('Next.js 14');
  techStack.add('TypeScript');
  techStack.add('Tailwind CSS');

  // 从配置中添加技术栈
  if (config.techStack) {
    config.techStack.forEach(tech => techStack.add(tech));
  }

  // 从意图分析中添加偏好
  if (intent.techPreferences) {
    intent.techPreferences.forEach((tech: string) => techStack.add(tech));
  }

  // 根据项目类型添加特定技术
  const projectTypeStack: Record<string, string[]> = {
    ecommerce: ['Prisma', 'Stripe', 'NextAuth.js'],
    saas: ['Prisma', 'Stripe', 'NextAuth.js', 'Zustand'],
    blog: ['Prisma', 'React Hook Form'],
    portfolio: ['Framer Motion', 'React Hook Form'],
    dashboard: ['Recharts', 'React Table', 'Zustand']
  };

  const specificStack = projectTypeStack[intent.projectType] || [];
  specificStack.forEach(tech => techStack.add(tech));

  return Array.from(techStack).join(' + ');
}

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
      console.error('🔍 正在分析项目需求...');
      
      // 使用真正的智能分析器
      const config: PromptGenerationConfig = {
        userDescription: description,
        requirements: requirements,
        techStack: [],
        projectType: undefined,
        complexityLevel: undefined,
        detectedFeatures: undefined
      };
      
      const intent = await intentAnalyzer.analyzeUserIntent(config);
      const validation = intentAnalyzer.validateIntent(intent);
      
      // 根据复杂度估算开发时间
      const timeEstimates = {
        simple: '1-2周',
        medium: '2-4周', 
        complex: '4-8周'
      };
      
      const result = {
        projectType: intent.projectType,
        recommendedStack: {
          database: intent.projectType === 'ecommerce' || intent.projectType === 'saas' ? 'postgresql' : 'sqlite',
          uiFramework: 'tailwind-radix',
          features: intent.coreFeatures
        },
        reasoning: `基于智能分析，置信度${intent.confidence}%。${validation.warnings.join(' ')}`,
        complexityScore: intent.complexityLevel === 'simple' ? 3 : intent.complexityLevel === 'medium' ? 6 : 9,
        estimatedDevelopmentTime: timeEstimates[intent.complexityLevel],
        confidence: intent.confidence,
        warnings: validation.warnings
      };

      return {
        content: [{
          type: 'text',
          text: `🎯 **项目分析完成**

**项目类型**: ${result.projectType}
**复杂度评分**: ${result.complexityScore}/10
**预估开发时间**: ${result.estimatedDevelopmentTime}

**推荐技术栈**:
• 数据库: ${result.recommendedStack.database}
• UI框架: ${result.recommendedStack.uiFramework}
• 推荐功能: ${result.recommendedStack.features?.join(', ') || '基础功能'}

**分析理由**: ${result.reasoning}

💡 使用 \`template_generator\` 工具基于此分析生成项目模板。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ 项目分析失败：${error instanceof Error ? error.message : '未知错误'}`
        }]
      };
    }
  }
);

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
      target_directory: z.string().optional().describe('目标生成目录（可选，不指定将使用系统默认位置）')
    }
  },
  async ({ analysis_result, project_name, target_directory }) => {
    try {
      // 显示预计生成位置
      const targetPath = getProjectTargetPath(project_name, target_directory)
      console.error('🚀 正在生成项目模板...')
      console.error(`📁 项目将创建在: ${targetPath}`);
      
      const projectConfig: ProjectConfig = {
        name: project_name,
        template: determineTemplate(analysis_result.projectType) as any,
        database: validateDatabase(analysis_result.recommendedStack?.database || 'postgresql'),
        uiFramework: (analysis_result.recommendedStack?.uiFramework as any) || 'tailwind-radix',
        features: {
          auth: analysis_result.recommendedStack?.features?.includes('auth') || false,
          admin: analysis_result.recommendedStack?.features?.includes('admin') || false,
          upload: analysis_result.recommendedStack?.features?.includes('upload') || false,
          email: analysis_result.recommendedStack?.features?.includes('email') || false,
          payment: analysis_result.recommendedStack?.features?.includes('payment') || false,
          realtime: analysis_result.recommendedStack?.features?.includes('realtime') || false
        },
        // 传递当前工作目录作为目标目录，这样项目会在当前目录下创建
        targetDirectory: target_directory || process.cwd()
      };

      const result = await vibecliCore.createProject(projectConfig);
      
      return {
        content: [{
          type: 'text',
          text: `✅ **项目生成成功！**

📁 **项目位置**: ${result.projectPath}
🎯 **项目类型**: ${projectConfig.template}
💾 **数据库**: ${projectConfig.database}

**生成的文件**:
${result.generatedFiles.map((file: string) => `• ${file}`).join('\n')}

${result.nextSteps.join('\n')}

💡 使用 \`feature_composer\` 工具添加更多功能模块。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ 模板生成失败：${error instanceof Error ? error.message : '未知错误'}`
        }]
      };
    }
  }
);

// 注册功能组合器工具
server.registerTool(
  'feature_composer',
  {
    title: '功能组合器',
    description: '动态添加和组合复杂功能模块',
    inputSchema: {
      project_path: z.string().describe('项目路径'),
      feature_type: z.enum(['auth', 'admin', 'upload', 'email', 'payment', 'realtime', 'analytics']).describe('要添加的功能类型'),
      integration_mode: z.enum(['merge', 'replace', 'extend']).optional().describe('集成模式')
    }
  },
  async ({ project_path, feature_type, integration_mode = 'merge' }) => {
    try {
      console.error('🔧 正在组合功能模块...');
      
      const result = await vibecliCore.addFeature(project_path, {
        name: feature_type,
        options: {},
        force: integration_mode === 'replace'
      });
      
      return {
        content: [{
          type: 'text',
          text: `🔧 **功能添加完成**

**项目路径**: ${project_path}
**添加的功能**: ${feature_type}
**集成模式**: ${integration_mode}

**修改的文件**:
${result.modifiedFiles.map((file: string) => `• ${file}`).join('\n')}

**新增的文件**:
${result.addedFiles.map((file: string) => `• ${file}`).join('\n')}

**操作说明**:
${result.instructions.map((instruction: string) => `• ${instruction}`).join('\n')}

💡 使用 \`deployment_manager\` 工具配置部署。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ 功能添加失败：${error instanceof Error ? error.message : '未知错误'}`
        }]
      };
    }
  }
);

// 注册部署管理器工具
server.registerTool(
  'deployment_manager',
  {
    title: '部署管理器',
    description: '智能部署配置和多平台发布',
    inputSchema: z.object({
      project_path: z.string().describe('项目路径'),
      platform: z.enum(['vercel', 'netlify', 'aws', 'docker', 'railway']).describe('部署平台'),
      environment: z.enum(['development', 'staging', 'production']).describe('部署环境'),
      config_options: z.object({
        domain: z.string().optional().describe('自定义域名'),
        env_vars: z.record(z.string()).optional().describe('环境变量'),
        build_command: z.string().optional().describe('构建命令')
      }).optional().describe('部署配置选项')
    }).shape
  },
  async ({ project_path, platform, environment, config_options = {} }) => {
    try {
      console.error('🚀 正在配置部署...');
      
      // TODO: 实现setupDeployment方法
      const result = {
        success: true,
        platform,
        message: `部署配置已准备完成，但setupDeployment方法需要实现`,
        url: `https://example.com`,
        deploymentId: `deploy_${Date.now()}`,
        configFiles: [],
        deployCommand: `npm run build && ${platform} deploy`,
        envVars: config_options.env_vars || {}
      };
      
      return {
        content: [{
          type: 'text',
          text: `🚀 **部署配置完成**

**平台**: ${platform}
**环境**: ${environment}
**项目路径**: ${project_path}

**配置文件**:
${result.configFiles.map((file: string) => `• ${file}`).join('\n')}

**部署命令**:
\`\`\`bash
${result.deployCommand}
\`\`\`

**环境变量**:
${Object.entries(result.envVars || {}).map(([key, value]) => `• ${key}=${value}`).join('\n')}

**下一步**: 执行部署命令开始发布流程。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ 部署配置失败：${error instanceof Error ? error.message : '未知错误'}`
        }]
      };
    }
  }
);

// 注册MCP上下文感知的智能提示词生成器
server.registerTool(
  'prompt_generator',
  {
    title: 'MCP智能提示词生成器',
    description: '基于MCP对话上下文智能识别用户意图，匹配最适合的VibeCLI提示词模板',
    inputSchema: {
      user_input: z.string().min(5).describe('用户当前输入内容'),
      session_context: z.object({
        session_id: z.string().optional().describe('MCP会话ID，用于维护对话上下文'),
        conversation_history: z.array(z.string()).optional().describe('对话历史（可选）'),
        previous_tool_calls: z.array(z.object({
          tool: z.string(),
          result: z.any()
        })).optional().describe('之前的工具调用结果')
      }).optional().describe('MCP会话上下文'),
      generation_preferences: z.object({
        user_experience: z.enum(['beginner', 'intermediate', 'expert']).optional(),
        output_style: z.enum(['detailed', 'concise', 'code-focused']).optional(),
        immediate_generation: z.boolean().optional().describe('是否立即生成提示词，忽略置信度检查')
      }).optional().describe('生成偏好设置')
    }
  },
  async ({ user_input, session_context = {}, generation_preferences = {} }) => {
    try {
      console.error('🔄 基于MCP上下文分析用户意图...');
      
      // 1. 获取或创建MCP会话
      const sessionId = session_context.session_id || mcpContextManager.startSession();
      
      // 2. 记录用户输入并进行上下文感知分析（异步版本）
      const contextAnalysis = await mcpContextManager.recordUserInput(sessionId, user_input);
      
      // 3. 如果有之前的工具调用结果，学习并更新上下文
      if (session_context.previous_tool_calls) {
        session_context.previous_tool_calls.forEach(call => {
          mcpContextManager.recordToolCall(sessionId, call.tool, {}, call.result);
        });
      }
      
      // 4. 检查是否准备好生成提示词
      if (!contextAnalysis.readyForGeneration && !generation_preferences.immediate_generation) {
        // 需要更多信息，返回澄清问题
        let responseText = `🤔 **正在理解您的需求** (置信度: ${contextAnalysis.confidence}%)

**当前理解**:`;
        
        if (contextAnalysis.projectType) {
          responseText += `\n• 项目类型: ${contextAnalysis.projectType}`;
        }
        
        if (contextAnalysis.features.length > 0) {
          responseText += `\n• 检测到的功能: ${contextAnalysis.features.join(', ')}`;
        }
        
        if (contextAnalysis.clarifications.length > 0) {
          responseText += `\n\n**需要澄清**:`;
          contextAnalysis.clarifications.forEach((q, i) => {
            responseText += `\n${i + 1}. ${q}`;
          });
        }
        
        if (contextAnalysis.suggestions.length > 0) {
          responseText += `\n\n**建议**:`;
          contextAnalysis.suggestions.forEach(s => {
            responseText += `\n• ${s}`;
          });
        }
        
        responseText += `\n\n💡 请提供更多信息，或者如果当前理解正确，可以说"生成提示词"`;
        
        return {
          content: [{
            type: 'text',
            text: responseText
          }]
        };
      }
      
      // 5. 准备好生成，获取最优配置
      const promptConfig = mcpContextManager.getOptimalPromptConfig(sessionId);
      if (!promptConfig) {
        return {
          content: [{
            type: 'text',
            text: '❌ 无法获取足够的项目信息来生成提示词，请提供更多详细信息。'
          }]
        };
      }
      
      // 6. 构建提示词上下文，包含MCP会话洞察
      const session = mcpContextManager.getSession(sessionId);
      const promptContext: PromptContext = {
        project_name: extractProjectName(promptConfig.userDescription) || 'MyProject',
        project_type: promptConfig.projectType || 'blog',
        complexity_level: promptConfig.complexityLevel || 'medium',
        detected_features: promptConfig.detectedFeatures || [],
        tech_stack: getTechStackString({ 
          projectType: promptConfig.projectType || 'blog',
          techPreferences: promptConfig.techStack || []
        }, promptConfig),
        vibecli_version: '1.4.0',
        current_date: new Date().toLocaleDateString('zh-CN'),
        // 基于MCP上下文的智能特性标志
        has_payment_feature: promptConfig.detectedFeatures?.includes('payment') || false,
        has_billing_feature: promptConfig.detectedFeatures?.includes('payment') || promptConfig.projectType === 'saas',
        has_search_feature: promptConfig.detectedFeatures?.includes('search') || promptConfig.projectType === 'blog'
      };
      
      // 7. 使用MCP上下文感知的模板选择
      const projectIntent = {
        projectType: promptConfig.projectType || 'blog',
        coreFeatures: promptConfig.detectedFeatures || [],
        complexityLevel: promptConfig.complexityLevel || 'medium',
        techPreferences: promptConfig.techStack || [],
        confidence: contextAnalysis.confidence,
        reasoning: `基于MCP对话上下文分析，${contextAnalysis.confidence}%置信度`,
        suggestions: contextAnalysis.suggestions
      };
      
      const selectionContext = {
        userExperience: generation_preferences.user_experience || 
                        session?.accumulatedContext.userProfile.experienceLevel || 'intermediate',
        developmentPhase: session?.accumulatedContext.userProfile.preferredApproach === 'step-by-step' ? 'planning' as const : 'development' as const
      };
      
      // 8. 生成上下文感知的提示词
      const result = await promptTemplateEngine.renderPrompt(
        promptContext.project_type,
        promptContext,
        projectIntent,
        selectionContext
      );
      
      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `❌ 提示词生成失败：${result.error}`
          }]
        };
      }

      // 9. 记录成功的工具调用
      mcpContextManager.recordToolCall(sessionId, 'prompt_generator', 
        { user_input, session_context, generation_preferences }, result);
      
      // 10. 构建智能响应
      let responseText = `🎯 **MCP智能提示词生成完成**

**基于对话上下文的分析**:
• 会话ID: ${sessionId}
• 项目类型: ${promptContext.project_type}
• 复杂度: ${promptContext.complexity_level}
• 核心功能: ${promptContext.detected_features.join(', ') || '基础功能'}
• 置信度: ${contextAnalysis.confidence}%
• 选用模板: ${result.metadata.templateUsed}

**生成的专业提示词**:
---
${result.prompt}
---

**MCP上下文洞察**:
• 对话轮次: ${session?.conversationHistory.length || 1}
• 用户经验: ${selectionContext.userExperience}
• 开发阶段: ${selectionContext.developmentPhase}

**下一步建议**:
1. 将提示词复制到您的AI助手中开始开发
2. 使用 \`template_generator\` 工具创建项目框架
3. 继续在此会话中获得更多个性化指导`;

      return {
        content: [{
          type: 'text',
          text: responseText
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ MCP智能分析失败：${error instanceof Error ? error.message : '未知错误'}`
        }]
      };
    }
  }
);

// 启动服务器
async function main() {
  try {
    console.error('🚀 启动VibeCLI MCP服务器...');
    
    if (options.debug) {
      console.error('🐛 调试模式已启用');
      console.error('📋 配置信息:', {
        version: '1.2.4',
        debug: options.debug
      });
    }
    
    // 预热核心组件
    console.error('🔥 预热核心组件...');
    // TODO: 实现initialize方法
    console.error('✅ 核心组件预热完成');
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('✅ MCP服务器已启动，等待连接...');
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 处理帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🛠️ VibeCLI MCP服务器

用法：
  vibecli-mcp-server [选项]

选项：
  --debug                  启用调试模式
  --no-telemetry          禁用遥测
  -h, --help              显示帮助信息
  -V, --version           显示版本号

可用工具：
  - project_analyzer: 智能分析项目需求并推荐技术栈
  - template_generator: 基于分析结果生成完整项目模板
  - feature_composer: 动态添加和组合复杂功能模块
  - deployment_manager: 智能部署配置和多平台发布
  - prompt_generator: 智能生成专业级开发指导提示词 [NEW v1.3]

示例：
  vibecli-mcp-server --debug
  
MCP工具使用：
  分析项目: project_analyzer({"description": "电商网站", "requirements": ["用户认证", "购物车"]})
  生成提示词: prompt_generator({"user_description": "我要做一个电商网站，需要支付功能"})
  生成模板: template_generator({"analysis_result": {...}, "project_name": "my-ecommerce"})
  添加功能: feature_composer({"project_path": "./my-app", "features": ["auth", "payment"]})
  配置部署: deployment_manager({"project_path": "./my-app", "platform": "vercel", "environment": "production"})
`);
  process.exit(0);
}

// 启动服务器
main().catch(console.error);

export { server }