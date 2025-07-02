import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import https from 'https'
import crypto from 'crypto'
import { createWriteStream, promises as fsPromises } from 'fs'
// @ts-ignore – type definitions bundled via @types/adm-zip
import AdmZip from 'adm-zip'
import { VIBECLI_VERSION } from '../constants/version.js'
import { verifyEd25519, getStorePublicKey } from '../utils/signature.js'

const REGISTRY_URL = process.env.VIBECLI_TEMPLATE_REGISTRY ||
  'https://raw.githubusercontent.com/vibetemplate/vibecli/main/templates/index.json'

const REGISTRY_BASE = REGISTRY_URL.replace(/index\.json$/, '')

const CACHE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.vibecli', 'cache')
const CACHE_FILE = path.join(CACHE_DIR, 'template-index.json')
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const LOCAL_TPL_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.vibecli', 'templates')
const LOCAL_REGISTRY_FILE = path.join(LOCAL_TPL_DIR, 'installed.json')

interface RegistryIndex {
  generatedAt: string
  storeVersion: string
  templates: TemplateEntry[]
}

interface TemplateVersionMeta {
  version: string
  file: string
  sha256?: string
  minVibecli?: string
  maxVibecli?: string
}

interface TemplateEntry {
  name: string
  description: string
  latest: string
  versions: TemplateVersionMeta[]
}

interface LocalRegistry { [name: string]: string[] }

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} while fetching ${url}`))
          res.resume()
          return
        }
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json)
          } catch (err) {
            reject(err)
          }
        })
      })
      .on('error', reject)
  })
}

async function loadRegistryIndex(forceRefresh = false): Promise<RegistryIndex> {
  await fs.ensureDir(CACHE_DIR)

  const exists = await fs.pathExists(CACHE_FILE)
  if (exists && !forceRefresh) {
    const stat = await fs.stat(CACHE_FILE)
    const age = Date.now() - stat.mtimeMs
    if (age < CACHE_TTL) {
      return fs.readJson(CACHE_FILE)
    }
  }

  const spinner = ora(`Fetching template index from registry`).start()
  try {
    const json = await fetchJson(REGISTRY_URL)

    // Verify registry signature if present
    if (json.signature) {
      const sig = json.signature as string
      const clone = { ...json }
      delete clone.signature
      const data = Buffer.from(JSON.stringify(clone))
      const ok = verifyEd25519(data, sig, getStorePublicKey())
      if (!ok) {
        spinner.fail('Registry signature verification failed')
        throw new Error('Invalid registry signature')
      }
    }

    await fs.writeJson(CACHE_FILE, json)
    spinner.succeed('Registry index downloaded')
    return json
  } catch (err) {
    spinner.fail('Failed to download registry index')
    if (exists) {
      console.log(chalk.yellow('Using cached index due to network error'))
      return fs.readJson(CACHE_FILE)
    }
    throw err
  }
}

export async function templateCmd(action: string, name?: string) {
  switch (action) {
    case 'list':
      await listTemplates()
      break
    case 'install':
      if (!name) {
        console.log(chalk.red('Please provide template name to install'))
        return
      }
      await installTemplate(name)
      break
    case 'remove':
      if (!name) {
        console.log(chalk.red('Please provide template name to remove'))
        return
      }
      await removeTemplate(name)
      break
    default:
      console.log(chalk.red(`Unknown action: ${action}`))
  }
}

async function listTemplates() {
  try {
    const index = await loadRegistryIndex()

    console.log(chalk.blue.bold('\n📦 可用模板列表\n'))
    console.log(chalk.gray(`Registry: ${REGISTRY_URL}`))
    console.log('')

    const rows = index.templates.map((t) => ({
      Name: t.name,
      Version: t.latest,
      Description: t.description,
    }))

    // simple table
    const colWidths = {
      Name: 20,
      Version: 10,
      Description: 60,
    }
    const headers = Object.keys(colWidths) as Array<keyof typeof colWidths>
    const pad = (str: string, len: number) =>
      (str.length > len ? str.slice(0, len - 1) + '…' : str).padEnd(len)

    console.log(
      headers.map((h) => chalk.bold(pad(h, colWidths[h]))).join(' ')
    )
    console.log(headers.map((h) => '-'.repeat(colWidths[h])).join(' '))
    rows.forEach((row) => {
      console.log(
        headers
          .map((h) => pad(String(row[h]), colWidths[h]))
          .join(' ')
      )
    })
    console.log('')
    console.log(chalk.gray('使用 `vibecli template install <name>` 安装模板'))
  } catch (err) {
    console.log(chalk.red('Failed to list templates: ' + (err as Error).message))
  }
}

async function readLocalRegistry(): Promise<LocalRegistry> {
  try {
    const data = await fs.readFile(LOCAL_REGISTRY_FILE, 'utf8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function writeLocalRegistry(reg: LocalRegistry) {
  await fs.ensureDir(LOCAL_TPL_DIR)
  await fs.writeJson(LOCAL_REGISTRY_FILE, reg, { spaces: 2 })
}

async function installTemplate(input: string) {
  const [name, versionSpec] = input.split('@')

  const index = await loadRegistryIndex()
  const tpl = index.templates.find((t) => t.name === name)
  if (!tpl) {
    console.log(chalk.red(`Template not found in registry: ${name}`))
    return
  }

  const version = versionSpec || tpl.latest
  const verObj = tpl.versions.find((v) => v.version === version)
  if (!verObj) {
    console.log(chalk.red(`Version ${version} not found for template ${name}`))
    return
  }

  const { satisfies: semverSatisfies } = await import('semver')

  const cliVersion = VIBECLI_VERSION

  if (verObj.minVibecli && !semverSatisfies(cliVersion, `>=${verObj.minVibecli}`)) {
    console.log(chalk.red(`当前 VibeCLI 版本 ${cliVersion} 低于模板要求 ${verObj.minVibecli}`))
    return
  }

  if (verObj.maxVibecli && !semverSatisfies(cliVersion, `<=${verObj.maxVibecli}`)) {
    console.log(chalk.yellow(`模板兼容性未知（要求 <= ${verObj.maxVibecli}），继续安装...`))
  }

  const localPath = path.join(LOCAL_TPL_DIR, name, version)
  if (await fs.pathExists(localPath)) {
    console.log(chalk.yellow(`Template ${name}@${version} already installed.`))
    return
  }

  const spinner = ora(`Downloading ${name}@${version}`).start()
  try {
    const downloadUrl = REGISTRY_BASE + verObj.file

    // temp file
    const tmpFile = path.join(CACHE_DIR, `${name}-${version}.zip`)
    await downloadFile(downloadUrl, tmpFile)

    // Verify hash if provided
    if (verObj.sha256) {
      const hash = await sha256OfFile(tmpFile)
      if (hash !== verObj.sha256) {
        spinner.fail('SHA-256 mismatch, aborting')
        await fs.remove(tmpFile)
        return
      }
    }

    // TODO: verify Ed25519 signature if field present in future

    // Extract
    const zip = new AdmZip(tmpFile)
    zip.extractAllTo(localPath, true)

    // Update local registry
    const reg = await readLocalRegistry()
    reg[name] = reg[name] || []
    reg[name].push(version)
    await writeLocalRegistry(reg)

    spinner.succeed(`Installed ${name}@${version}`)
  } catch (err) {
    spinner.fail((err as Error).message)
  }
}

async function removeTemplate(name: string) {
  const reg = await readLocalRegistry()
  if (!reg[name] || reg[name].length === 0) {
    console.log(chalk.yellow(`Template ${name} is not installed.`))
    return
  }

  const spinner = ora(`Removing template ${name}`).start()
  try {
    for (const version of reg[name]) {
      const dir = path.join(LOCAL_TPL_DIR, name, version)
      await fs.remove(dir)
    }
    delete reg[name]
    await writeLocalRegistry(reg)
    spinner.succeed(`Removed template ${name}`)
  } catch (err) {
    spinner.fail((err as Error).message)
  }
}

async function downloadFile(url: string, dest: string) {
  return new Promise<void>((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} while downloading ${url}`))
          res.resume()
          return
        }
        const fileStream = createWriteStream(dest)
        res.pipe(fileStream)
        fileStream.on('finish', () => fileStream.close(() => resolve()))
      })
      .on('error', reject)
  })
}

async function sha256OfFile(file: string): Promise<string> {
  const hash = crypto.createHash('sha256')
  const data = await fsPromises.readFile(file)
  hash.update(data)
  return hash.digest('hex')
}