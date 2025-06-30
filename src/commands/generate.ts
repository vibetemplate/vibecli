import chalk from 'chalk'
import ora from 'ora'
import { VibeCLICore } from '../core/vibecli-core.js'
import { GenerationConfig } from '../core/types.js'

interface GenerateOptions {
  model?: string
}

export async function generateApi(type: string, name: string, options: GenerateOptions) {
  console.log(chalk.blue.bold('\n⚡ 生成代码\n'))

  const core = new VibeCLICore()

  try {
    // 验证生成类型
    const supportedTypes = ['api', 'component', 'service', 'model']
    if (!supportedTypes.includes(type.toLowerCase())) {
      console.error(chalk.red(`❌ 不支持的生成类型: ${type}`))
      console.log(chalk.yellow('支持的类型: ' + supportedTypes.join(', ')))
      process.exit(1)
    }

    // 构建生成配置
    const generationConfig: GenerationConfig = {
      type: type.toLowerCase() as any,
      name: name,
      model: options.model
    }

    console.log(chalk.blue(`类型: ${generationConfig.type}`))
    console.log(chalk.blue(`名称: ${generationConfig.name}`))
    if (generationConfig.model) {
      console.log(chalk.blue(`模型: ${generationConfig.model}`))
    }
    console.log('')

    // 使用核心API生成代码
    const spinner = ora(`正在生成 ${generationConfig.type} ${generationConfig.name}...`).start()
    
    const result = await core.generateCode(process.cwd(), generationConfig)
    
    if (result.success) {
      spinner.succeed('代码生成完成!')
      
      console.log(chalk.green.bold('\n✅ 生成成功!\n'))
      if (result.generatedFiles.length > 0) {
        console.log(chalk.blue('生成的文件:'))
        result.generatedFiles.forEach(file => {
          console.log(`  ✓ ${file}`)
        })
      }
      
      // 显示后续步骤
      if (result.instructions.length > 0) {
        console.log(chalk.blue('\n下一步操作:'))
        result.instructions.forEach((instruction, index) => {
          console.log(`  ${index + 1}. ${instruction}`)
        })
      }
      
      console.log('')
    } else {
      spinner.fail('代码生成失败')
      console.error(chalk.red('❌ ' + result.message))
      if (result.error) {
        console.error(chalk.red('详细错误: ' + result.error))
      }
      process.exit(1)
    }

  } catch (error) {
    console.error(chalk.red('❌ 生成代码时发生错误:'))
    console.error(chalk.red(error instanceof Error ? error.message : String(error)))
    process.exit(1)
  }
}