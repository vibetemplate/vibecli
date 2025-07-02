import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取 package.json 获取版本号
function getVersion(): string {
  try {
    // 从构建后的 dist 目录向上查找 package.json
    const packageJsonPath = join(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return packageJson.version
  } catch (error) {
    // 如果读取失败，返回默认版本
    console.warn('Warning: Could not read version from package.json', error)
    return '1.7.1'
  }
}

export const version = getVersion()
export default version 