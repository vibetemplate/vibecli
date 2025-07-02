#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { createApp } from './commands/create.js'
import { addFeature } from './commands/add.js'
import { deployApp } from './commands/deploy.js'
import { generateApi } from './commands/generate.js'
import { version } from './utils/version.js'
import { doctor } from './commands/doctor.js'
import { configCmd } from './commands/config.js'
import { GlobalConfig } from './mcp/config/config-provider.js'
import { chat } from './commands/chat.js'
import { learn } from './commands/learn.js'
import { templateCmd } from './commands/template.js'
import { publishTplCmd } from './commands/publish-template.js'

const program = new Command()

program
  .name('vibecli')
  .description('VibeCLI - AI驱动的Web全栈应用CLI工具')
  .version(version)
  .option('-l, --lang <lang>', 'CLI language (zh|en)', 'zh')

// 初始化配置（无需阻塞 CLI 启动）
GlobalConfig.load().catch(err => {
  console.error('配置加载失败:', err)
})

// 创建新应用
program
  .command('create <project-name>')
  .description('创建新的Web全栈应用')
  .option('-t, --template <template>', '选择项目模板', 'default')
  .option('-d, --database <database>', '选择数据库类型', 'sqlite')
  .option('-f, --force', '强制覆盖现有目录')
  .option('--no-auth', '不包含认证系统')
  .option('--no-admin', '不包含管理面板')
  .action(createApp)

// 添加功能模块
program
  .command('add <feature>')
  .description('添加功能模块到现有项目')
  .option('-f, --force', '强制覆盖现有文件')
  .action(addFeature)

// 生成API
program
  .command('generate <type> <name>')
  .description('生成API路由、组件或服务')
  .option('-m, --model <model>', '关联的数据模型')
  .action(generateApi)

// 部署应用
program
  .command('deploy')
  .description('部署应用到云平台')
  .option('-p, --platform <platform>', '部署平台', 'vercel')
  .option('--env <env>', '环境配置文件')
  .action(deployApp)

// Doctor
program
  .command('doctor')
  .description('检查并修复本地开发环境')
  .action(doctor)

// Chat
program
  .command('chat')
  .description('与 VibeCLI 智能助手对话')
  .action(chat)

// Learn
program
  .command('learn [topic]')
  .description('交互式教程，快速上手 VibeCLI')
  .action(learn)

// Template store
program
  .command('template <action> [name]')
  .description('模板商店操作 (list|install|remove)')
  .action(templateCmd)

// Publish template
program
  .command('publish-template <templateDir>')
  .description('发布本地模板到远程模板商店')
  .option('--validate-only', '仅验证和打包，不提交')
  .action(publishTplCmd)

// Config
program
  .command('config <action>')
  .description('配置文件相关操作 (validate|diff|migrate|reset)')
  .action(configCmd)

// MCP相关命令 - 使用单独的可执行文件 vibecli-mcp-server

// 显示帮助信息
program.on('--help', () => {
  console.log('')
  console.log(chalk.blue('示例用法:'))
  console.log('  $ vibecli create my-app')
  console.log('  $ vibecli create my-app --template ecommerce --database mysql')
  console.log('  $ vibecli add auth')
  console.log('  $ vibecli generate api users')
  console.log('  $ vibecli deploy --platform vercel')
  console.log('')
  console.log(chalk.blue('更多信息:'))
  console.log('  文档: https://github.com/vibetemplate/vibecli#readme')
  console.log('  问题: https://github.com/vibetemplate/vibecli/issues')
})

program.parse()

// After parsing options, set language env variable for other modules
const globalOpts = program.opts<{ lang?: string }>()
if (globalOpts.lang) {
  process.env.VIBECLI_LANG = globalOpts.lang
}
