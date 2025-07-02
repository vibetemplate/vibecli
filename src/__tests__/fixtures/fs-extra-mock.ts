import fs from 'fs'
import path from 'path'
import { promises as fsp } from 'fs'

async function ensureDir(dir: string): Promise<void> {
  await fsp.mkdir(dir, { recursive: true })
}

async function writeFile(p: string, data: any) {
  await ensureDir(path.dirname(p))
  return fsp.writeFile(p, data)
}

function existsSync(p: string) {
  return fs.existsSync(p)
}

async function pathExists(p: string): Promise<boolean> {
  return existsSync(p)
}

async function readJson(p: string) {
  const txt = await fsp.readFile(p, 'utf-8')
  return JSON.parse(txt)
}

async function readFile(p: string, enc: any) {
  return fsp.readFile(p, enc)
}

async function mkdtemp(prefix: string): Promise<string> {
  return await fsp.mkdtemp(prefix)
}

async function remove(p: string): Promise<void> {
  if (existsSync(p)) {
    await fsp.rm(p, { recursive: true, force: true })
  }
}

function mkdtempSync(prefix: string): string {
  return fs.mkdtempSync(prefix)
}

function removeSync(p: string) {
  if (existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true })
  }
}

async function readdir(p: string): Promise<string[]> { return fs.promises.readdir(p) }
function readdirSync(p: string): string[] { return fs.readdirSync(p) }

async function copy(src: string, dest: string): Promise<void> { await ensureDir(dest) }
function copySync(_src: string,_dest: string){}

function emptyDirSync(_p: string){}
async function emptyDir(_p: string){ }

function mkdirpSync(dir: string){ fs.mkdirSync(dir,{recursive:true}) }

async function writeJson(file: string, data: any, opts?: any): Promise<void> {
  await ensureDir(path.dirname(file))
  return fsp.writeFile(file, JSON.stringify(data, null, opts?.spaces || 2), 'utf-8')
}

function writeJsonSync(file: string, data: any, opts?: any) {
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, JSON.stringify(data, null, opts?.spaces || 2), 'utf-8')
}

// polyfill stat returning directory or file
async function stat(p: string) {
  return fsp.stat(p)
}

function statSync(p: string) {
  return fs.statSync(p)
}

async function access(p: string, mode?: number) { return fsp.access(p, mode) }
const constants = fs.constants

function ensureDirSync(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeFileSync(p: string, data: any) {
  ensureDirSync(path.dirname(p))
  fs.writeFileSync(p, data)
}

function readFileSyncMock(p: string, enc?: any) {
  return fs.readFileSync(p, enc)
}

export default {
  ensureDir,
  ensureDirSync,
  writeFile,
  writeFileSync,
  readFile,
  readFileSync: readFileSyncMock,
  existsSync,
  pathExists,
  mkdtemp,
  readdir,
  readdirSync,
  copy,
  copySync,
  emptyDir,
  emptyDirSync,
  mkdirpSync,
  mkdirSync: fs.mkdirSync,
  promises: fs.promises as any,
  readJson,
  mkdtempSync,
  remove,
  removeSync,
  mkdirp: ensureDir,
  // passthrough helper
  __esModule: true,
  writeJson,
  writeJsonSync,
  stat,
  statSync,
  access,
  constants
} as any;

// Named exports for ESM `import * as fs from 'fs-extra'` style
export {
  ensureDir,
  ensureDirSync,
  writeFile,
  writeFileSync,
  readFile,
  readFileSyncMock as readFileSync,
  existsSync,
  pathExists,
  mkdtemp,
  readdir,
  readdirSync,
  copy,
  copySync,
  emptyDir,
  emptyDirSync,
  mkdirpSync,
  readJson,
  writeJson,
  writeJsonSync,
  mkdtempSync,
  remove,
  removeSync,
  stat,
  statSync,
  access,
  constants
}; 