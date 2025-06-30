import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import { generateFeature, FEATURES } from '../utils/feature-generator'

interface AddOptions {
  force?: boolean
}

// 使用从 feature-generator 导入的 FEATURES

export async function addFeature(featureName: string, options: AddOptions) {
  console.log(chalk.blue.bold('\n📦 添加功能模块\n'))

  // 检查是否在项目根目录
  if (!fs.existsSync('package.json')) {
    console.error(chalk.red('❌ 请在项目根目录下运行此命令'))
    process.exit(1)
  }

  // 检查功能是否存在
  if (!FEATURES[featureName.toLowerCase()]) {
    console.log(chalk.yellow('❓ 可用的功能模块:'))
    Object.entries(FEATURES).forEach(([key, feature]) => {
      console.log(`  ${chalk.cyan(key)}: ${feature.name}`)
    })
    process.exit(1)
  }

  const feature = FEATURES[featureName.toLowerCase()]

  // 显示功能信息
  console.log(chalk.blue(`功能: ${feature.name}`))
  console.log(chalk.gray(`文件: ${feature.files.join(', ')}\n`))

  // 检查文件冲突
  const conflicts = await checkFileConflicts(feature.files)
  if (conflicts.length > 0 && !options.force) {
    console.log(chalk.yellow('⚠️  发现文件冲突:'))
    conflicts.forEach(file => console.log(`  ${file}`))
    
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: '是否覆盖现有文件？',
        default: false
      }
    ])

    if (!proceed) {
      console.log(chalk.yellow('❌ 操作已取消'))
      process.exit(0)
    }
  }

  // 生成功能
  const spinner = ora(`正在添加 ${feature.name}...`).start()
  
  try {
    await generateFeature(featureName.toLowerCase(), process.cwd(), options.force)
    
    spinner.succeed(`${feature.name} 添加成功!`)

    // 显示后续步骤
    console.log(chalk.green.bold('\n✅ 功能添加完成!\n'))
    console.log(chalk.blue('下一步操作:'))
    
    if (featureName === 'auth') {
      console.log('  1. 配置环境变量 (.env.local)')
      console.log('  2. 运行数据库迁移: npx prisma migrate dev')
      console.log('  3. 访问 /login 页面测试登录功能')
    } else if (featureName === 'upload') {
      console.log('  1. 配置云存储服务 (Cloudflare R2/AWS S3)')
      console.log('  2. 设置环境变量')
      console.log('  3. 测试文件上传功能')
    }

    console.log('')

  } catch (error) {
    spinner.fail('功能添加失败')
    console.error(chalk.red(error))
    process.exit(1)
  }
}

async function checkFileConflicts(files: string[]): Promise<string[]> {
  const conflicts: string[] = []
  
  for (const file of files) {
    if (await fs.pathExists(file)) {
      conflicts.push(file)
    }
  }
  
  return conflicts
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

async function updatePackageDependencies(featureName: string) {
  const packageJsonPath = 'package.json'
  const packageJson = await fs.readJson(packageJsonPath)

  const dependencies: Record<string, Record<string, string>> = {
    auth: {
      'bcryptjs': '^2.4.3',
      'jsonwebtoken': '^9.0.0',
      '@types/bcryptjs': '^2.4.2',
      '@types/jsonwebtoken': '^9.0.1'
    },
    upload: {
      'multer': '^1.4.5',
      'sharp': '^0.32.0',
      '@aws-sdk/client-s3': '^3.0.0'
    },
    payment: {
      'stripe': '^12.0.0'
    },
    email: {
      'nodemailer': '^6.9.0',
      '@types/nodemailer': '^6.4.7'
    },
    realtime: {
      'socket.io': '^4.7.0',
      'socket.io-client': '^4.7.0'
    }
  }

  const featureDeps = dependencies[featureName]
  if (featureDeps) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...featureDeps
    }

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
  }
}
