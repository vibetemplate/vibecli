import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import { ensureDependenciesInstalled } from '../utils/dependency-checker.js'

export async function doctor() {
  console.log(chalk.blue.bold('\n🩺  VibeCLI Doctor\n'))

  const projectRoot = process.cwd()
  const spinner = ora('检查项目依赖...').start()
  try {
    const deps = {
      prisma: '^5',
      '@prisma/client': '^5',
      tailwindcss: '^3',
      autoprefixer: '^10',
      postcss: '^8'
    }

    await ensureDependenciesInstalled(projectRoot, deps)
    spinner.succeed('依赖检查完成')
  } catch (err) {
    spinner.fail('依赖检查失败')
    console.error(err)
  }

  // TODO: 未来可加入更多诊断（环境变量、数据库连接等）

  console.log(chalk.green('\n✅ Doctor 运行完毕'))
} 