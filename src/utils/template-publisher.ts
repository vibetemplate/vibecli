import fs from 'fs-extra'
import path from 'path'
import AdmZip from 'adm-zip'
import crypto from 'crypto'
import { verifySha256 } from './signature.js'
import { execSync } from 'child_process'
import ora from 'ora'

interface PublishOptions {
  templatePath: string
  registryRoot: string // templates directory root
  validateOnly?: boolean
}

export async function publishTemplate({ templatePath, registryRoot, validateOnly }: PublishOptions) {
  const spinner = ora('Validating template').start()
  const manifestPath = path.join(templatePath, 'template.json')
  if (!(await fs.pathExists(manifestPath))) {
    spinner.fail('template.json not found')
    throw new Error('template manifest missing')
  }
  const manifest = await fs.readJson(manifestPath)
  const { name, version } = manifest
  if (!name || !version) {
    spinner.fail('name/version missing in manifest')
    throw new Error('invalid manifest')
  }
  spinner.succeed('Manifest valid')

  // create zip
  spinner.start('Packaging template')
  const zipFileName = `${name}-${version}.zip`
  const outDir = path.join(registryRoot, name)
  await fs.ensureDir(outDir)
  const zipPath = path.join(outDir, zipFileName)

  const zip = new AdmZip()
  zip.addLocalFolder(templatePath)
  zip.writeZip(zipPath)
  spinner.succeed('Package created')

  // compute sha256
  const hash = crypto.createHash('sha256')
  hash.update(await fs.readFile(zipPath))
  const sha = hash.digest('hex')
  await fs.writeFile(zipPath + '.sha256', sha)

  // update index.json
  spinner.start('Updating index.json')
  const indexPath = path.join(registryRoot, 'index.json')
  let indexJson: any
  if (await fs.pathExists(indexPath)) {
    indexJson = await fs.readJson(indexPath)
  } else {
    indexJson = { generatedAt: new Date().toISOString(), storeVersion: '1.0', templates: [] }
  }
  let tpl = indexJson.templates.find((t: any) => t.name === name)
  if (!tpl) {
    tpl = { name, description: manifest.description || '', latest: version, versions: [] }
    indexJson.templates.push(tpl)
  }
  tpl.latest = version
  tpl.versions.push({ version, file: `${name}/${zipFileName}`, sha256: sha })
  indexJson.generatedAt = new Date().toISOString()
  await fs.writeJson(indexPath, indexJson, { spaces: 2 })
  spinner.succeed('index.json updated')

  if (validateOnly) {
    return { zipPath, sha }
  }

  // git add & commit (assumes inside repo)
  spinner.start('Committing changes')
  execSync(`git add ${zipPath} ${zipPath}.sha256 ${indexPath}`, { stdio: 'ignore' })
  execSync(`git commit -m "chore: publish template ${name}@${version}"`, { stdio: 'ignore' })
  spinner.succeed('Committed')

  spinner.succeed('Template published')
  return { zipPath, sha }
} 