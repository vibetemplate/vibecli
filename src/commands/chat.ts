import inquirer from 'inquirer'
import chalk from 'chalk'
import { IntentAnalyzer } from '../prompts/dynamic/intent-analyzer.js'
import type { PromptGenerationConfig } from '../core/types.js'

export async function chat() {
  console.log(chalk.blue.bold('\n💬 VibeCLI Chat (输入 exit 退出)\n'))

  const analyzer = new IntentAnalyzer()

  while (true) {
    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: chalk.cyan('你:')
      }
    ])

    const text = (message as string).trim()
    if (!text) continue
    if (['exit', 'quit', 'q'].includes(text.toLowerCase())) {
      console.log(chalk.gray('再见!'))
      break
    }

    try {
      const cfg: PromptGenerationConfig = {
        userDescription: text
      }
      const intent = await analyzer.analyzeUserIntent(cfg)
      const validation = analyzer.validateIntent(intent)

      const replyLines: string[] = []
      replyLines.push(chalk.green.bold('🧠 意图分析结果'))
      replyLines.push(`• 项目类型: ${intent.projectType}`)
      replyLines.push(`• 置信度: ${intent.confidence}%`)
      replyLines.push(`• 核心功能: ${intent.coreFeatures.join(', ') || '暂无'}`)
      replyLines.push(`• 复杂度: ${intent.complexityLevel}`)
      if (validation.warnings.length > 0) {
        replyLines.push(chalk.yellow('\n⚠️  建议/警告:'))
        validation.warnings.forEach(w => replyLines.push('  - ' + w))
      }
      console.log(replyLines.join('\n'))
    } catch (err) {
      console.error(chalk.red('❌ 分析失败:'), err instanceof Error ? err.message : err)
    }
  }
} 