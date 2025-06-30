import chalk from 'chalk'
import ora from 'ora'
import { VibeCLICore } from '../core/vibecli-core.js'
import { DeploymentConfig } from '../core/types.js'

interface DeployOptions {
  platform: string
  env?: string
}

export async function deployApp(options: DeployOptions) {
  console.log(chalk.blue.bold('\n🚀 部署应用\n'))

  const core = new VibeCLICore()

  try {
    // 验证部署平台
    const supportedPlatforms = ['vercel', 'netlify', 'aws', 'docker']
    if (!supportedPlatforms.includes(options.platform.toLowerCase())) {
      console.error(chalk.red(`❌ 不支持的部署平台: ${options.platform}`))
      console.log(chalk.yellow('支持的平台: ' + supportedPlatforms.join(', ')))
      process.exit(1)
    }

    // 构建部署配置
    const deployConfig: DeploymentConfig = {
      platform: options.platform.toLowerCase() as any,
      environment: 'production',
      envFile: options.env
    }

    console.log(chalk.blue(`平台: ${deployConfig.platform}`))
    console.log(chalk.blue(`环境: ${deployConfig.environment}\n`))

    // 使用核心API部署项目
    const spinner = ora(`正在部署到 ${deployConfig.platform}...`).start()
    
    const result = await core.deployProject(process.cwd(), deployConfig)
    
    if (result.success) {
      spinner.succeed('部署完成!')
      
      console.log(chalk.green.bold('\n✅ 部署成功!\n'))
      console.log(chalk.blue('部署信息:'))
      console.log(`  平台: ${result.platform}`)
      if (result.url) {
        console.log(`  地址: ${chalk.blue(result.url)}`)
      }
      if (result.deploymentId) {
        console.log(`  部署ID: ${result.deploymentId}`)
      }
      console.log('')
    } else {
      spinner.fail('部署失败')
      console.error(chalk.red('❌ ' + result.message))
      if (result.error) {
        console.error(chalk.red('详细错误: ' + result.error))
      }
      process.exit(1)
    }

  } catch (error) {
    console.error(chalk.red('❌ 部署时发生错误:'))
    console.error(chalk.red(error instanceof Error ? error.message : String(error)))
    process.exit(1)
  }
}