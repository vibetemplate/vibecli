import chalk from 'chalk'
import ora from 'ora'
import { execa } from 'execa'
import * as fs from 'fs-extra'
import * as path from 'path'

interface DeployOptions {
  platform: string
  env?: string
}

export async function deployApp(options: DeployOptions) {
  const spinner = ora('准备部署...').start()
  
  try {
    // 检查是否在项目目录中
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    if (!await fs.pathExists(packageJsonPath)) {
      spinner.fail('未找到 package.json，请确保在项目根目录中运行此命令')
      return
    }

    const packageJson = await fs.readJson(packageJsonPath)
    
    spinner.text = `正在部署到 ${options.platform}...`
    
    switch (options.platform.toLowerCase()) {
      case 'vercel':
        await deployToVercel(packageJson, options, spinner)
        break
      case 'netlify':
        await deployToNetlify(packageJson, options, spinner)
        break
      default:
        spinner.fail(`不支持的部署平台: ${options.platform}`)
        console.log(chalk.yellow('支持的平台: vercel, netlify'))
        return
    }
    
  } catch (error) {
    spinner.fail('部署失败')
    console.error(chalk.red(error instanceof Error ? error.message : '未知错误'))
  }
}

async function deployToVercel(packageJson: any, options: DeployOptions, spinner: any) {
  try {
    // 检查是否安装了 Vercel CLI
    await execa('vercel', ['--version'])
  } catch (error) {
    spinner.fail('Vercel CLI 未安装')
    console.log(chalk.yellow('请先安装 Vercel CLI: npm i -g vercel'))
    return
  }

  // 构建项目
  spinner.text = '正在构建项目...'
  if (packageJson.scripts?.build) {
    await execa('npm', ['run', 'build'])
  }

  // 部署到 Vercel
  spinner.text = '正在部署到 Vercel...'
  const deployArgs = ['--prod']
  
  if (options.env) {
    deployArgs.push('--env', options.env)
  }
  
  const { stdout } = await execa('vercel', deployArgs)
  
  spinner.succeed('成功部署到 Vercel!')
  console.log(chalk.green('部署地址:'), chalk.blue(stdout.trim()))
}

async function deployToNetlify(packageJson: any, options: DeployOptions, spinner: any) {
  try {
    await execa('netlify', ['--version'])
  } catch (error) {
    spinner.fail('Netlify CLI 未安装')
    console.log(chalk.yellow('请先安装 Netlify CLI: npm i -g netlify-cli'))
    return
  }

  // 构建项目
  spinner.text = '正在构建项目...'
  if (packageJson.scripts?.build) {
    await execa('npm', ['run', 'build'])
  }

  // 部署到 Netlify
  spinner.text = '正在部署到 Netlify...'
  const { stdout } = await execa('netlify', ['deploy', '--prod'])
  
  spinner.succeed('成功部署到 Netlify!')
  console.log(chalk.green('部署结果:'))
  console.log(stdout)
}