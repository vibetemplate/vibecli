import fs from 'fs-extra'
import path from 'path'
import os from 'os'

// 创建临时测试目录
export const createTempDir = async (): Promise<string> => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibecli-test-'))
  return tempDir
}

// 清理临时目录
export const cleanupTempDir = async (dir: string): Promise<void> => {
  if (await fs.pathExists(dir)) {
    await fs.remove(dir)
  }
}

// Mock console methods
export const mockConsole = () => {
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  const logs: string[] = []
  const errors: string[] = []
  const warns: string[] = []

  console.log = jest.fn((...args) => {
    logs.push(args.join(' '))
  })

  console.error = jest.fn((...args) => {
    errors.push(args.join(' '))
  })

  console.warn = jest.fn((...args) => {
    warns.push(args.join(' '))
  })

  return {
    logs,
    errors,
    warns,
    restore: () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }
}

// Mock process.exit
export const mockProcessExit = () => {
  const originalExit = process.exit
  const mockExit = jest.fn()
  
  // @ts-ignore
  process.exit = mockExit

  return {
    mockExit,
    restore: () => {
      process.exit = originalExit
    }
  }
}

// 全局测试清理
afterEach(() => {
  jest.clearAllMocks()
})