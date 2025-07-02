#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { createApp } from './commands/create.js'
import { addFeature } from './commands/add.js'
import { deployApp } from './commands/deploy.js'
import { generateApi } from './commands/generate.js'

const program = new Command()

program
  .name('vibecli')
  .description('VibeCLI - AI驱动的Web全栈应用CLI工具')
  .version('1.7.1')

// 创建新应用
program
  .command('create <project-name>')
  .description('创建新的Web全栈应用')
  .option('-t, --template <template>', '选择项目模板', 'default')
  .option('-d, --database <database>', '选择数据库类型', 'postgresql')
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
