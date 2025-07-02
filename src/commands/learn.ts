import chalk from 'chalk'
import inquirer from 'inquirer'
import { execSync } from 'child_process'

interface TutorialSection {
  id: string
  title: string
  description: string
  commands?: string[]
  tips?: string[]
}

const tutorialSections: TutorialSection[] = [
  {
    id: 'getting-started',
    title: '快速开始 (Create 项目)',
    description:
      '学习如何使用 "vibecli create" 命令在几分钟内生成可运行的全栈应用。',
    commands: [
      'vibecli create my-app',
      'cd my-app',
      'npm run dev',
    ],
    tips: [
      '通过 -t/--template 选项选择不同模板 (default, blog, ecommerce...)',
      '通过 -d/--database 选项切换数据库驱动',
    ],
  },
  {
    id: 'add-auth',
    title: '添加认证系统 (Add Feature)',
    description: '向现有项目添加基于 JWT 的认证系统。',
    commands: ['vibecli add auth'],
    tips: ['使用 -f/--force 可以覆盖本地修改的文件，慎用'],
  },
  {
    id: 'generate-api',
    title: '生成 CRUD API (Generate)',
    description: '在 30 秒内生成 RESTful API 路由和 Prisma 模型。',
    commands: ['vibecli generate api users'],
    tips: [
      '结合 --model <model> 选项可基于现有模型生成 API',
    ],
  },
  {
    id: 'deploy',
    title: '部署到 Vercel (Deploy)',
    description: '一键将你的应用部署到 Vercel 并获取线上地址。',
    commands: ['vibecli deploy --platform vercel'],
    tips: [
      '将 --env .env.production 传递给命令可在部署时注入环境变量',
    ],
  },
]

async function selectTutorial(): Promise<TutorialSection> {
  const { sectionId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sectionId',
      message: '请选择要学习的主题：',
      choices: tutorialSections.map((s) => ({
        name: `${s.title} - ${s.description}`,
        value: s.id,
      })),
    },
  ])

  return tutorialSections.find((s) => s.id === sectionId) as TutorialSection
}

export async function learn(topic?: string) {
  console.log(chalk.blue.bold('\n🎓 VibeCLI 交互式教程\n'))

  let section: TutorialSection | undefined

  if (topic) {
    section = tutorialSections.find((s) => s.id === topic)
    if (!section) {
      console.log(chalk.red(`找不到名为 "${topic}" 的教程主题。\n`))
      section = await selectTutorial()
    }
  } else {
    section = await selectTutorial()
  }

  if (!section) {
    console.log(chalk.red('未知错误，未能载入教程。'))
    return
  }

  console.log(chalk.green.bold(`\n${section.title}`))
  console.log(chalk.gray(section.description) + '\n')

  if (section.commands && section.commands.length > 0) {
    console.log(chalk.yellow('🚀 尝试以下命令：'))
    section.commands.forEach((cmd) => {
      console.log('  ' + chalk.cyan('$ ' + cmd))
    })
  }

  if (section.tips && section.tips.length > 0) {
    console.log('\n💡 提示：')
    section.tips.forEach((tip) => console.log('  - ' + tip))
  }

  console.log('\n按回车键自动执行首个命令，或 Ctrl+C 退出。')
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: '',
    },
  ])

  if (section.commands && section.commands.length > 0) {
    const cmd = section.commands[0]
    try {
      console.log(chalk.green(`\n> 正在执行: ${cmd}\n`))
      execSync(cmd, { stdio: 'inherit' })
    } catch (err) {
      console.log(chalk.red('命令执行失败或被中断。你可以手动在终端运行上述命令。'))
    }
  }

  console.log('\n�� 教程结束，祝你玩得开心！')
} 