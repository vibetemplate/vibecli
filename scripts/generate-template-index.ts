import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATES_DIR = path.resolve(__dirname, '../templates')
const OUTPUT_FILE = path.join(TEMPLATES_DIR, 'index.json')

interface TemplateManifest {
  name: string
  description?: string
  displayName?: string
  version: string
}

async function sha256(file: string): Promise<string> {
  const hash = crypto.createHash('sha256')
  const data = await fs.readFile(file)
  hash.update(data)
  return hash.digest('hex')
}

async function main() {
  const templateDirs = await fs.readdir(TEMPLATES_DIR)
  const templates = [] as any[]

  for (const dir of templateDirs) {
    const manifestPath = path.join(TEMPLATES_DIR, dir, 'template.json')
    if (!(await fs.pathExists(manifestPath))) continue

    const manifest = (await fs.readJson(manifestPath)) as TemplateManifest
    const name = manifest.name || dir
    const version = manifest.version || '1.0.0'
    const description = manifest.description || manifest.displayName || name

    // Zip naming convention
    const zipName = `${name}-${version}.zip`
    const zipPath = path.join(TEMPLATES_DIR, dir, zipName)
    let sha: string | undefined
    if (await fs.pathExists(zipPath)) {
      sha = await sha256(zipPath)
    }

    templates.push({
      name,
      description,
      latest: version,
      versions: [
        {
          version,
          file: `${dir}/${zipName}`,
          sha256: sha,
        },
      ],
    })
  }

  const index = {
    generatedAt: new Date().toISOString(),
    storeVersion: '1.0',
    templates,
  }

  await fs.writeJson(OUTPUT_FILE, index, { spaces: 2 })
  console.log(`✅ index.json generated at ${OUTPUT_FILE}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
}) 