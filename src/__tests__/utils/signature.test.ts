import fs from 'fs-extra'
import crypto from 'crypto'
import { jest } from '@jest/globals'
import nacl from 'tweetnacl'
import { encodeBase64 } from 'tweetnacl-util'
import {
  computeSha256,
  verifySha256,
  getStorePublicKey,
  verifyEd25519
} from '../../utils/signature.js'

// Mock dependencies
jest.mock('fs-extra')

const mockFs = fs as jest.Mocked<typeof fs> & {
  readFile: jest.MockedFunction<any>
  pathExists: jest.MockedFunction<any>
}

describe('Signature Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('computeSha256', () => {
    it('should compute SHA-256 hash correctly', async () => {
      const testData = Buffer.from('Hello, World!')
      const expectedHash = crypto.createHash('sha256').update(testData).digest('hex')
      
      mockFs.readFile.mockResolvedValue(testData)

      const result = await computeSha256('/test/file.txt')

      expect(result).toBe(expectedHash)
      expect(mockFs.readFile).toHaveBeenCalledWith('/test/file.txt')
    })

    it('should handle empty files', async () => {
      const emptyData = Buffer.from('')
      const expectedHash = crypto.createHash('sha256').update(emptyData).digest('hex')
      
      mockFs.readFile.mockResolvedValue(emptyData)

      const result = await computeSha256('/test/empty.txt')

      expect(result).toBe(expectedHash)
    })

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'))

      await expect(computeSha256('/test/nonexistent.txt')).rejects.toThrow('File not found')
    })
  })

  describe('verifySha256', () => {
    it('should verify correct SHA-256 hash', async () => {
      const testData = Buffer.from('Test content')
      const correctHash = crypto.createHash('sha256').update(testData).digest('hex')
      
      mockFs.pathExists.mockResolvedValue(true)
      mockFs.readFile
        .mockImplementation((path: any, encoding?: any) => {
          if (encoding === 'utf-8') {
            return Promise.resolve(correctHash) // Signature file content
          }
          return Promise.resolve(testData) // File content for hash computation
        })

      const result = await verifySha256('/test/file.txt', '/test/file.txt.sha256')

      expect(result).toBe(true)
    })

    it('should reject incorrect SHA-256 hash', async () => {
      const testData = Buffer.from('Test content')
      const incorrectHash = 'incorrect-hash'
      
      mockFs.pathExists.mockResolvedValue(true)
      mockFs.readFile
        .mockImplementation((path: any, encoding?: any) => {
          if (encoding === 'utf-8') {
            return Promise.resolve(incorrectHash) // Incorrect signature file content
          }
          return Promise.resolve(testData) // File content for hash computation
        })

      const result = await verifySha256('/test/file.txt', '/test/file.txt.sha256')

      expect(result).toBe(false)
    })

    it('should return true when signature file does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false)

      const result = await verifySha256('/test/file.txt', '/test/nonexistent.sha256')

      expect(result).toBe(true)
      expect(mockFs.readFile).not.toHaveBeenCalled()
    })

    it('should handle signature file with whitespace', async () => {
      const testData = Buffer.from('Test content')
      const correctHash = crypto.createHash('sha256').update(testData).digest('hex')
      const hashWithWhitespace = `  ${correctHash}  \n`
      
      mockFs.pathExists.mockResolvedValue(true)
      mockFs.readFile
        .mockImplementation((path: any, encoding?: any) => {
          if (encoding === 'utf-8') {
            return Promise.resolve(hashWithWhitespace) // Signature file with whitespace
          }
          return Promise.resolve(testData) // File content for hash computation
        })

      const result = await verifySha256('/test/file.txt', '/test/file.txt.sha256')

      expect(result).toBe(true)
    })
  })

  describe('getStorePublicKey', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should return default public key when no env variable set', () => {
      delete process.env.VIBECLI_TEMPLATE_PUBKEY

      const result = getStorePublicKey()

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32) // Ed25519 public key length
    })

    it('should use custom public key from environment', () => {
      const customKeyPair = nacl.sign.keyPair()
      const customPubKeyB64 = encodeBase64(customKeyPair.publicKey)
      
      process.env.VIBECLI_TEMPLATE_PUBKEY = customPubKeyB64

      const result = getStorePublicKey()

      expect(result).toEqual(customKeyPair.publicKey)
    })

    it('should handle invalid base64 in environment gracefully', () => {
      process.env.VIBECLI_TEMPLATE_PUBKEY = 'invalid-base64!!!'

      expect(() => getStorePublicKey()).toThrow()
    })
  })

  describe('verifyEd25519', () => {
    let keyPair: nacl.SignKeyPair
    let testData: Uint8Array

    beforeEach(() => {
      keyPair = nacl.sign.keyPair()
      testData = new TextEncoder().encode('Test message for signing')
    })

    it('should verify valid Ed25519 signature', () => {
      const signature = nacl.sign.detached(testData, keyPair.secretKey)
      const signatureB64 = encodeBase64(signature)

      const result = verifyEd25519(testData, signatureB64, keyPair.publicKey)

      expect(result).toBe(true)
    })

    it('should reject invalid Ed25519 signature', () => {
      const wrongKeyPair = nacl.sign.keyPair()
      const signature = nacl.sign.detached(testData, wrongKeyPair.secretKey)
      const signatureB64 = encodeBase64(signature)

      const result = verifyEd25519(testData, signatureB64, keyPair.publicKey)

      expect(result).toBe(false)
    })

    it('should reject tampered data', () => {
      const signature = nacl.sign.detached(testData, keyPair.secretKey)
      const signatureB64 = encodeBase64(signature)
      const tamperedData = new TextEncoder().encode('Tampered message')

      const result = verifyEd25519(tamperedData, signatureB64, keyPair.publicKey)

      expect(result).toBe(false)
    })

    it('should use default public key when none provided', () => {
      const originalEnv = process.env
      
      try {
        // Set a known test key
        const testKeyPair = nacl.sign.keyPair()
        process.env.VIBECLI_TEMPLATE_PUBKEY = encodeBase64(testKeyPair.publicKey)
        
        const signature = nacl.sign.detached(testData, testKeyPair.secretKey)
        const signatureB64 = encodeBase64(signature)

        const result = verifyEd25519(testData, signatureB64)

        expect(result).toBe(true)
      } finally {
        process.env = originalEnv
      }
    })

    it('should handle malformed signature gracefully', () => {
      const malformedSignature = 'not-a-valid-base64-signature!!!'

      const result = verifyEd25519(testData, malformedSignature, keyPair.publicKey)

      expect(result).toBe(false)
    })

    it('should handle signature of wrong length', () => {
      const shortSignature = encodeBase64(new Uint8Array(32)) // Too short, should be 64 bytes

      const result = verifyEd25519(testData, shortSignature, keyPair.publicKey)

      expect(result).toBe(false)
    })

    it('should handle public key of wrong length', () => {
      const signature = nacl.sign.detached(testData, keyPair.secretKey)
      const signatureB64 = encodeBase64(signature)
      const wrongLengthKey = new Uint8Array(16) // Too short, should be 32 bytes

      const result = verifyEd25519(testData, signatureB64, wrongLengthKey)

      expect(result).toBe(false)
    })

    it('should handle empty data', () => {
      const emptyData = new Uint8Array(0)
      const signature = nacl.sign.detached(emptyData, keyPair.secretKey)
      const signatureB64 = encodeBase64(signature)

      const result = verifyEd25519(emptyData, signatureB64, keyPair.publicKey)

      expect(result).toBe(true)
    })

    it('should be deterministic for same input', () => {
      const signature = nacl.sign.detached(testData, keyPair.secretKey)
      const signatureB64 = encodeBase64(signature)

      const result1 = verifyEd25519(testData, signatureB64, keyPair.publicKey)
      const result2 = verifyEd25519(testData, signatureB64, keyPair.publicKey)

      expect(result1).toBe(result2)
      expect(result1).toBe(true)
    })
  })

  describe('Security Properties', () => {
    it('should produce different hashes for different inputs', async () => {
      const data1 = Buffer.from('Content 1')
      const data2 = Buffer.from('Content 2')
      
      mockFs.readFile
        .mockResolvedValueOnce(data1)
        .mockResolvedValueOnce(data2)

      const hash1 = await computeSha256('/test/file1.txt')
      const hash2 = await computeSha256('/test/file2.txt')

      expect(hash1).not.toBe(hash2)
    })

    it('should produce same hash for identical content', async () => {
      const identicalData = Buffer.from('Identical content')
      
      mockFs.readFile
        .mockResolvedValueOnce(identicalData)
        .mockResolvedValueOnce(identicalData)

      const hash1 = await computeSha256('/test/file1.txt')
      const hash2 = await computeSha256('/test/file2.txt')

      expect(hash1).toBe(hash2)
    })

    it('should detect single-bit changes', async () => {
      const original = Buffer.from('Original content')
      const modified = Buffer.from('Original Content') // Capital 'C'
      
      mockFs.readFile
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(modified)

      const hash1 = await computeSha256('/test/original.txt')
      const hash2 = await computeSha256('/test/modified.txt')

      expect(hash1).not.toBe(hash2)
    })

    it('should resist signature forgery attempts', () => {
      const keyPair = nacl.sign.keyPair()
      const data = new TextEncoder().encode('Important message')
      
      // Create a valid signature
      const validSignature = nacl.sign.detached(data, keyPair.secretKey)
      const validSignatureB64 = encodeBase64(validSignature)
      
      // Try to forge by modifying signature
      const forgedSignature = new Uint8Array(validSignature)
      forgedSignature[0] = forgedSignature[0] ^ 1 // Flip one bit
      const forgedSignatureB64 = encodeBase64(forgedSignature)

      const validResult = verifyEd25519(data, validSignatureB64, keyPair.publicKey)
      const forgedResult = verifyEd25519(data, forgedSignatureB64, keyPair.publicKey)

      expect(validResult).toBe(true)
      expect(forgedResult).toBe(false)
    })
  })
})