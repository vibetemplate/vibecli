import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import { VibeCLICore } from '../core/vibecli-core.js'
import { ProjectConfig } from '../core/types.js'

interface CreateOptions {
  template?: string
  database?: 'postgresql' | 'mysql' | 'sqlite'
  force?: boolean
  auth?: boolean
  admin?: boolean
}

export async function createApp(projectName: string, options: CreateOptions) {
  console.log(chalk.blue.bold('\n🚀 创建Web全栈应用\n'))

  const core = new VibeCLICore()

  try {
    // 交互式配置
    const config = await promptForConfig(projectName, options)

    // 检查目录是否存在，询问是否覆盖
    if (!config.overwrite) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `目录 ${projectName} 已存在，是否覆盖？`,
          default: false,
          when: () => require('fs-extra').existsSync(projectName)
        }
      ])

      if (overwrite === false) {
        console.log(chalk.yellow('❌ 操作已取消'))
        process.exit(0)
      }

      config.overwrite = overwrite
    }

    // 使用核心API创建项目
    const spinner = ora('正在创建项目...').start()
    
    const result = await core.createProject(config)
    
    if (result.success) {
      spinner.succeed('项目创建完成!')
      
      // 显示成功信息
      console.log(chalk.green.bold('\n✅ 项目创建成功!\n'))
      console.log(chalk.blue('生成的文件:'))
      result.generatedFiles.slice(0, 5).forEach(file => {
        console.log(`  ✓ ${file}`)
      })
      if (result.generatedFiles.length > 5) {
        console.log(`  ... 和其他 ${result.generatedFiles.length - 5} 个文件`)
      }
      
      console.log(chalk.blue('\n下一步操作:'))
      result.nextSteps.forEach(step => {
        console.log(`  ${step}`)
      })
      
      console.log(chalk.blue('\n其他命令:'))
      console.log('  npm run build     # 构建生产版本')
      console.log('  npm run db:studio # 打开数据库管理界面')
      console.log('  vibecli add auth  # 添加认证功能')
      console.log('')
    } else {
      spinner.fail('项目创建失败')
      console.error(chalk.red('❌ ' + result.message))
      if (result.error) {
        console.error(chalk.red('详细错误: ' + result.error))
      }
      process.exit(1)
    }

  } catch (error) {
    console.error(chalk.red('❌ 创建项目时发生错误:'))
    console.error(chalk.red(error instanceof Error ? error.message : String(error)))
    process.exit(1)
  }
}

async function promptForConfig(projectName: string, options: CreateOptions): Promise<ProjectConfig> {
  const questions = []

  // 项目模板选择
  if (!options.template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: '选择项目模板:',
      choices: [
        { name: '默认模板 (基础功能)', value: 'default' },
        { name: '电商模板 (商品管理)', value: 'ecommerce' },
        { name: '博客模板 (内容管理)', value: 'blog' },
        { name: '仪表板模板 (数据展示)', value: 'dashboard' },
        { name: 'SaaS模板 (多租户)', value: 'saas' }
      ],
      default: 'default'
    })
  }

  // 数据库选择
  if (!options.database) {
    questions.push({
      type: 'list',
      name: 'database',
      message: '选择数据库:',
      choices: [
        { name: 'PostgreSQL (推荐)', value: 'postgresql' },
        { name: 'MySQL', value: 'mysql' },
        { name: 'SQLite (开发)', value: 'sqlite' }
      ],
      default: 'postgresql'
    })
  }

  // 功能选择（根据模板调整默认选择）
  const defaultAuth = options.template === 'auth-system' || (options.template !== 'default' && options.auth !== false)
  const defaultAdmin = options.template === 'auth-system' || (options.template !== 'default' && options.admin !== false)
  
  questions.push({
    type: 'checkbox',
    name: 'features',
    message: '选择功能模块:',
    choices: [
      { name: '用户认证系统', value: 'auth', checked: defaultAuth },
      { name: '管理员面板', value: 'admin', checked: defaultAdmin },
      { name: '文件上传', value: 'upload', checked: options.template === 'auth-system' },
      { name: '邮件发送', value: 'email', checked: false },
      { name: '支付集成', value: 'payment', checked: false },
      { name: '实时通信', value: 'realtime', checked: false }
    ]
  })

  // UI框架选择
  questions.push({
    type: 'list',
    name: 'uiFramework',
    message: '选择UI框架:',
    choices: [
      { name: 'Tailwind CSS + Radix UI (推荐)', value: 'tailwind-radix' },
      { name: 'Ant Design', value: 'antd' },
      { name: 'Material-UI', value: 'mui' },
      { name: 'Chakra UI', value: 'chakra' }
    ],
    default: 'tailwind-radix'
  })

  const answers = await inquirer.prompt(questions)

  return {
    name: projectName,
    template: (options.template || answers.template) as ProjectConfig['template'],
    database: (options.database || answers.database) as ProjectConfig['database'],
    uiFramework: (answers.uiFramework || 'tailwind-radix') as ProjectConfig['uiFramework'],
    features: {
      auth: options.auth !== false && (answers.features || []).includes('auth'),
      admin: options.admin !== false && (answers.features || []).includes('admin'),
      upload: (answers.features || []).includes('upload'),
      email: (answers.features || []).includes('email'),
      payment: (answers.features || []).includes('payment'),
      realtime: (answers.features || []).includes('realtime')
    },
    overwrite: options.force || false
  }
}
