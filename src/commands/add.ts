import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import { VibeCLICore } from '../core/vibecli-core.js'
import { FeatureConfig } from '../core/types.js'

interface AddOptions {
  force?: boolean
}

const AVAILABLE_FEATURES = {
  auth: { name: '用户认证系统', description: '完整的用户注册、登录、权限管理' },
  crud: { name: 'CRUD操作', description: '数据增删改查操作' },
  upload: { name: '文件上传', description: '多文件上传和存储管理' },
  email: { name: '邮件系统', description: '邮件发送和模板管理' },
  payment: { name: '支付集成', description: 'Stripe等支付平台集成' },
  realtime: { name: '实时通信', description: 'WebSocket实时功能' }
}

export async function addFeature(featureName: string, options: AddOptions) {
  console.log(chalk.blue.bold('\n📦 添加功能模块\n'))

  const core = new VibeCLICore()

  try {
    // 验证功能名称
    if (!AVAILABLE_FEATURES[featureName.toLowerCase() as keyof typeof AVAILABLE_FEATURES]) {
      console.log(chalk.yellow('❓ 可用的功能模块:'))
      Object.entries(AVAILABLE_FEATURES).forEach(([key, feature]) => {
        console.log(`  ${chalk.cyan(key)}: ${feature.name} - ${chalk.gray(feature.description)}`)
      })
      process.exit(1)
    }

    const feature = AVAILABLE_FEATURES[featureName.toLowerCase() as keyof typeof AVAILABLE_FEATURES]
    console.log(chalk.blue(`功能: ${feature.name}`))
    console.log(chalk.gray(`${feature.description}\n`))

    // 获取功能配置
    const featureConfig = await promptForFeatureConfig(featureName.toLowerCase())

    // 使用核心API添加功能
    const spinner = ora(`正在添加 ${feature.name}...`).start()
    
    const result = await core.addFeature(process.cwd(), {
      name: featureName.toLowerCase() as any,
      options: featureConfig,
      force: options.force
    })
    
    if (result.success) {
      spinner.succeed(`${feature.name} 添加成功!`)
      
      // 显示生成的文件
      console.log(chalk.green.bold('\n✅ 功能添加完成!\n'))
      if (result.addedFiles.length > 0) {
        console.log(chalk.blue('新增文件:'))
        result.addedFiles.forEach(file => {
          console.log(`  ✓ ${file}`)
        })
      }
      
      if (result.modifiedFiles.length > 0) {
        console.log(chalk.blue('\n修改文件:'))
        result.modifiedFiles.forEach(file => {
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
      spinner.fail('功能添加失败')
      console.error(chalk.red('❌ ' + result.message))
      if (result.error) {
        console.error(chalk.red('详细错误: ' + result.error))
      }
      process.exit(1)
    }

  } catch (error) {
    console.error(chalk.red('❌ 添加功能时发生错误:'))
    console.error(chalk.red(error instanceof Error ? error.message : String(error)))
    process.exit(1)
  }
}

async function promptForFeatureConfig(featureName: string) {
  const questions = []

  switch (featureName) {
    case 'auth':
      questions.push(
        {
          type: 'list',
          name: 'authProvider',
          message: '选择认证方式:',
          choices: [
            { name: 'JWT (推荐)', value: 'jwt' },
            { name: 'NextAuth.js', value: 'nextauth' },
            { name: 'Supabase Auth', value: 'supabase' }
          ],
          default: 'jwt'
        },
        {
          type: 'checkbox',
          name: 'authFeatures',
          message: '选择认证功能:',
          choices: [
            { name: '邮箱验证', value: 'email-verification', checked: true },
            { name: '密码重置', value: 'password-reset', checked: true },
            { name: '社交登录', value: 'social-login', checked: false },
            { name: '双因素认证', value: '2fa', checked: false }
          ]
        }
      )
      break

    case 'upload':
      questions.push(
        {
          type: 'list',
          name: 'uploadProvider',
          message: '选择存储服务:',
          choices: [
            { name: 'Cloudflare R2', value: 'r2' },
            { name: 'AWS S3', value: 's3' },
            { name: '本地存储', value: 'local' }
          ],
          default: 'r2'
        },
        {
          type: 'input',
          name: 'maxFileSize',
          message: '最大文件大小 (MB):',
          default: '10',
          validate: (input: string) => {
            const num = parseInt(input)
            return num > 0 && num <= 100 ? true : '请输入1-100之间的数字'
          }
        }
      )
      break

    case 'payment':
      questions.push(
        {
          type: 'list',
          name: 'paymentProvider',
          message: '选择支付服务:',
          choices: [
            { name: 'Stripe', value: 'stripe' },
            { name: '支付宝', value: 'alipay' },
            { name: '微信支付', value: 'wechat' }
          ],
          default: 'stripe'
        }
      )
      break
  }

  if (questions.length === 0) {
    return {}
  }

  return await inquirer.prompt(questions)
}
