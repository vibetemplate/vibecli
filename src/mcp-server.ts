#!/usr/bin/env node

// VibeCLI MCP Server启动脚本

import { VibeCLIMCPHTTPServer } from './mcp/http-server.js'

async function main() {
  const chalk = (await import('chalk')).default
  console.log(chalk.blue.bold('\n🚀 启动VibeCLI MCP Server\n'))

  const port = parseInt(process.env.VIBECLI_MCP_PORT || '9529')
  const server = new VibeCLIMCPHTTPServer(port)

  // 优雅关闭处理
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n📡 正在关闭MCP服务器...'))
    await server.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log(chalk.yellow('\n📡 正在关闭MCP服务器...'))
    await server.stop()
    process.exit(0)
  })

  try {
    await server.start()
    
    console.log(chalk.green('✅ MCP服务器启动成功!'))
    console.log(chalk.blue('\n📖 使用说明:'))
    console.log('  1. 在支持MCP的客户端中配置服务器地址:')
    console.log(`     ${chalk.cyan(`http://localhost:${port}`)}`)
    console.log('  2. 可用的MCP工具:')
    console.log(`     • ${chalk.cyan('project_analyzer')} - 分析项目需求`)
    console.log(`     • ${chalk.cyan('template_generator')} - 生成项目模板`)
    console.log(`     • ${chalk.cyan('feature_composer')} - 添加功能模块`)
    console.log(`     • ${chalk.cyan('deployment_manager')} - 管理项目部署`)
    console.log('')
    console.log(chalk.gray('按 Ctrl+C 停止服务器'))
    
  } catch (error) {
    console.error(chalk.red('❌ 启动MCP服务器失败:'))
    console.error(chalk.red(error instanceof Error ? error.message : String(error)))
    process.exit(1)
  }
}

// ESM中的入口点检查
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { VibeCLIMCPHTTPServer }