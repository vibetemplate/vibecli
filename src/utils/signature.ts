import fs from 'fs-extra'
import crypto from 'crypto'

export async function computeSha256(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath)
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

export async function verifySha256(filePath: string, signatureFile: string): Promise<boolean> {
  if (!(await fs.pathExists(signatureFile))) return true // 无签名则跳过校验
  const expected = (await fs.readFile(signatureFile, 'utf-8')).trim()
  const actual = await computeSha256(filePath)
  return expected === actual
} 