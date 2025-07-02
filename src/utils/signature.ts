import fs from 'fs-extra'
import crypto from 'crypto'
import nacl from 'tweetnacl'
import * as tweetnaclUtil from 'tweetnacl-util'

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

// 默认模板商店公钥（Base64），可通过 env 覆盖 VIBECLI_TEMPLATE_PUBKEY
const DEFAULT_PUBKEY_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

export function getStorePublicKey(): Uint8Array {
  const b64 = process.env.VIBECLI_TEMPLATE_PUBKEY || DEFAULT_PUBKEY_B64
  return tweetnaclUtil.decodeBase64(b64)
}

export function verifyEd25519(data: Uint8Array, signatureB64: string, pubKey?: Uint8Array): boolean {
  try {
    const sig = tweetnaclUtil.decodeBase64(signatureB64)
    const key = pubKey || getStorePublicKey()
    return nacl.sign.detached.verify(data, sig, key)
  } catch {
    return false
  }
} 