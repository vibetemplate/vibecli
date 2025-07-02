import fs from 'fs-extra'
import path from 'path'
import semver from 'semver'

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || '.'
const LOCAL_TPL_DIR = path.join(HOME_DIR, '.vibecli', 'templates')
const LOCAL_REGISTRY_FILE = path.join(LOCAL_TPL_DIR, 'installed.json')

export interface InstalledRegistry {
  [name: string]: string[]
}

export function getInstalledRegistry(): InstalledRegistry {
  try {
    return fs.readJsonSync(LOCAL_REGISTRY_FILE)
  } catch {
    return {}
  }
}

export function getInstalledTemplatePath(name: string, version?: string): string | null {
  const registry = getInstalledRegistry()
  const versions = registry[name]
  if (!versions || versions.length === 0) return null

  let selected: string | undefined
  if (version) {
    if (versions.includes(version)) selected = version
  } else {
    // pick latest semver
    selected = versions.sort(semver.rcompare)[0]
  }
  if (!selected) return null
  return path.join(LOCAL_TPL_DIR, name, selected)
} 