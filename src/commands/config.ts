import chalk from 'chalk'
import { GlobalConfig } from '../mcp/config/config-provider.js'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function configCmd(action: string) {
  switch (action) {
    case 'validate':
      await validateConfig()
      break
    case 'diff':
      await diffConfig()
      break
    case 'reset':
      await resetConfig()
      break
    case 'migrate':
      await migrateConfig()
      break
    default:
      console.log(chalk.yellow('未知操作。可用操作: validate | diff | migrate | reset'))
  }
}

async function validateConfig() {
  try {
    await GlobalConfig.load()
    console.log(chalk.green('配置文件校验通过!'))
  } catch (err: any) {
    console.error(chalk.red('配置校验失败: ' + err.message))
  }
}

async function diffConfig() {
  const defaultsPath = path.resolve(__dirname, '../mcp/config/defaults/enums.json')
  const userPath = path.resolve(process.cwd(), 'vibecli-config/enums.json')
  if (!await fs.pathExists(userPath)) {
    console.log(chalk.yellow('项目中不存在 overrides，结果与默认一致'))
    return
  }
  const def = await fs.readJson(defaultsPath)
  const usr = await fs.readJson(userPath)
  if (JSON.stringify(def) === JSON.stringify(usr)) {
    console.log(chalk.green('无差异'))
  } else {
    console.log(chalk.blue('用户 overrides 与默认配置不同'))
  }
}

async function resetConfig() {
  const targetDir = path.resolve(process.cwd(), 'vibecli-config')
  await fs.remove(targetDir)
  await fs.ensureDir(targetDir)
  const defaultsPath = path.resolve(__dirname, '../mcp/config/defaults/enums.json')
  await fs.copy(defaultsPath, path.join(targetDir, 'enums.json'))
  console.log(chalk.green('已重置 overrides 为官方默认'))
}

async function migrateConfig() {
  const defaultsPath = path.resolve(__dirname, '../mcp/config/defaults/enums.json')
  const userPath = path.resolve(process.cwd(), 'vibecli-config/enums.json')

  const def = await fs.readJson(defaultsPath)
  let usr: any = {}
  if (await fs.pathExists(userPath)) {
    usr = await fs.readJson(userPath)
  }

  // 合并缺失键
  const merged = { ...def, ...usr }

  // 备份旧文件
  if (await fs.pathExists(userPath)) {
    await fs.copy(userPath, userPath + '.bak')
  } else {
    await fs.ensureDir(path.dirname(userPath))
  }

  await fs.writeJson(userPath, merged, { spaces: 2 })
  console.log(chalk.green('配置已迁移并补全缺失字段'))
} 