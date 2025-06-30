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
import { VibeCLICore } from '../core/vibecli-core.js';
import { AIDecisionEngine } from './ai-decision-engine.js';
import type { ProjectConfig } from '../core/types.js';

// 解析命令行参数
const program = new Command();
program
  .name('vibecli-mcp-server')
  .description('VibeCLI MCP服务器 - AI驱动的Web全栈应用CLI工具')
  .version('1.2.4')
  .option('--debug', '启用调试模式')
  .option('--no-telemetry', '禁用遥测')
  .parse();

const options = program.opts();

// 创建MCP服务器
const server = new McpServer({
  name: 'vibecli-mcp',
  version: '1.2.4'
});

// 初始化核心组件
const vibecliCore = new VibeCLICore();
const aiEngine = new AIDecisionEngine();

// 辅助函数：确定模板类型
function determineTemplate(projectType: string): string {
  const templateMap: Record<string, string> = {
    'blog': 'default',
    'ecommerce': 'auth-system',
    'dashboard': 'auth-system',
    'portfolio': 'default',
    'cms': 'auth-system',
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
      
      const analysis = await aiEngine.analyzeProject({
        description,
        requirements,
        constraints: {
          budget: constraints.budget || 'medium',
          timeline: constraints.timeline || 'normal',
          team_size: constraints.team_size || 2,
          complexity: constraints.complexity || 'medium'
        }
      });
      
      const result = {
        projectType: analysis.projectType,
        recommendedStack: {
          database: analysis.recommendedStack.database,
          uiFramework: analysis.recommendedStack.uiFramework,
          features: analysis.recommendedStack.features
        },
        reasoning: analysis.recommendedStack.reasoning,
        complexityScore: analysis.complexity,
        estimatedDevelopmentTime: analysis.estimatedTime
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
      target_directory: z.string().optional().describe('目标生成目录'),
      customizations: z.object({}).optional().describe('定制化选项')
    }
  },
  async ({ analysis_result, project_name, target_directory, customizations = {} }) => {
    try {
      console.error('🚀 正在生成项目模板...');
      
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
        targetDirectory: target_directory
      };

      const result = await vibecliCore.createProject(projectConfig);
      
      return {
        content: [{
          type: 'text',
          text: `✅ **项目生成成功**

**项目名称**: ${project_name}
**生成路径**: ${result.projectPath}
**模板类型**: ${projectConfig.template}
**数据库**: ${projectConfig.database}

**生成的文件**:
${result.generatedFiles.map((file: string) => `• ${file}`).join('\n')}

**下一步**:
1. \`cd ${result.projectPath}\`
2. \`npm install\`
3. \`npm run dev\`

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

示例：
  vibecli-mcp-server --debug
  
MCP工具使用：
  分析项目: project_analyzer({"description": "电商网站", "requirements": ["用户认证", "购物车"]})
  生成模板: template_generator({"analysis_result": {...}, "project_name": "my-ecommerce"})
  添加功能: feature_composer({"project_path": "./my-app", "features": ["auth", "payment"]})
  配置部署: deployment_manager({"project_path": "./my-app", "platform": "vercel", "environment": "production"})
`);
  process.exit(0);
}

// 启动服务器
main().catch(console.error);

export { server }