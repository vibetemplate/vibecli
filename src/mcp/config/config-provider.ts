import fsExtra from 'fs-extra'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'
import { verifySha256 } from '../../utils/signature.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEFAULTS_DIR = path.resolve(__dirname, './defaults')
const PROJECT_OVERRIDE_DIR = path.resolve(process.cwd(), 'vibecli-config')

// ---------------- Schemas ----------------
const enumsSchema = z.object({
  userExperience: z.array(z.string()).min(1),
  developmentPhase: z.array(z.string()).min(1)
})

export interface VibeCLIConfig {
  enums: z.infer<typeof enumsSchema>
}

export class ConfigProvider {
  private static instance: ConfigProvider
  private config!: VibeCLIConfig

  private constructor() {}

  static getInstance() {
    if (!ConfigProvider.instance) {
      ConfigProvider.instance = new ConfigProvider()
    }
    return ConfigProvider.instance
  }

  async load() {
    const defaults = await this.loadDefaults()
    const overrides = await this.loadOverrides()
    const merged = this.merge(defaults, overrides)
    this.validate(merged)
    this.config = merged as VibeCLIConfig

    // 开发模式下启用热重载
    if (process.env.NODE_ENV !== 'production') {
      await this.setupWatcher()
    }
  }

  private async loadDefaults() {
    const enumsPath = path.join(DEFAULTS_DIR, 'enums.json')
    const enums = await fsExtra.readJson(enumsPath)
    return { enums }
  }

  private async loadOverrides() {
    const overrides: any = {}

    const enumsPath = path.join(PROJECT_OVERRIDE_DIR, 'enums.json')
    if (await fsExtra.pathExists(enumsPath)) {
      const sigOk = await verifySha256(enumsPath, enumsPath + '.sha256')
      if (!sigOk) {
        console.warn('[ConfigProvider] enums.json 签名校验失败，已忽略该文件')
      } else {
        overrides.enums = await fsExtra.readJson(enumsPath)
      }
    }

    return overrides
  }

  private validate(cfg: any) {
    enumsSchema.parse(cfg.enums)
  }

  private merge(target: any, source: any): any {
    if (Array.isArray(target) && Array.isArray(source)) {
      return Array.from(new Set([...target, ...source]))
    } else if (this.isPlainObject(target) && this.isPlainObject(source)) {
      const result: any = { ...target }
      for (const key of Object.keys(source)) {
        if (key in target) {
          result[key] = this.merge(target[key], source[key])
        } else {
          result[key] = source[key]
        }
      }
      return result
    }
    return source
  }

  private isPlainObject(item: any) {
    return item && typeof item === 'object' && !Array.isArray(item)
  }

  // ------------ Public API --------------
  getConfig(): VibeCLIConfig {
    if (!this.config) {
      throw new Error('ConfigProvider 未初始化，请先调用 load()')
    }
    return this.config
  }

  getEnum(key: keyof VibeCLIConfig['enums']) {
    return this.getConfig().enums[key]
  }

  isValidEnum(key: keyof VibeCLIConfig['enums'], value: string) {
    return this.getEnum(key).includes(value)
  }

  // ---------------- 热重载 ----------------
  private watcher?: fs.FSWatcher

  private async setupWatcher() {
    if (this.watcher || !(await this.ensureOverrideDir())) return

    this.watcher = fs.watch(PROJECT_OVERRIDE_DIR, { recursive: true }, async () => {
      try {
        const defaults = await this.loadDefaults()
        const overrides = await this.loadOverrides()
        const merged = this.merge(defaults, overrides)
        this.validate(merged)
        this.config = merged as VibeCLIConfig
        // eslint-disable-next-line no-console
        console.log('[ConfigProvider] 配置已热重载')
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ConfigProvider] 热重载配置失败:', err)
      }
    })
  }

  private async ensureOverrideDir(): Promise<boolean> {
    try {
      if (!(await fsExtra.pathExists(PROJECT_OVERRIDE_DIR))) {
        return false
      }
      return true
    } catch {
      return false
    }
  }
}

// helper for global usage
export const GlobalConfig = ConfigProvider.getInstance() 