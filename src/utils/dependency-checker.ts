import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import { execSync } from 'child_process'

export interface DependencyMap {
  [pkg: string]: string // version
}

export async function ensureDependenciesInstalled(projectRoot: string, deps: DependencyMap, dev = false) {
  const pkgPath = path.join(projectRoot, 'package.json')
  if (!await fs.pathExists(pkgPath)) {
    console.log(chalk.red('package.json 未找到，无法检查依赖'))
    return
  }

  const pkgJson = await fs.readJson(pkgPath)
  const installedDeps = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {})
  }

  const missing: string[] = []

  for (const [pkg, version] of Object.entries(deps)) {
    if (!installedDeps[pkg]) {
      missing.push(`${pkg}@${version}`)
    }
  }

  if (missing.length === 0) {
    console.log(chalk.green('所有核心依赖已安装'))
    return
  }

  console.log(chalk.yellow('检测到缺失依赖: ' + missing.join(', ')))
  try {
    const installCmd = `npm install ${dev ? '-D ' : ''}${missing.join(' ')}`
    console.log(chalk.blue(`执行: ${installCmd}`))
    execSync(installCmd, { stdio: 'inherit', cwd: projectRoot })
    console.log(chalk.green('依赖安装完成'))
  } catch (err) {
    console.error(chalk.red('自动安装依赖失败，请手动安装'))
  }
} 