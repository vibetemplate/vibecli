#!/usr/bin/env node

// VibeCLI MCP Stdio Server - 标准MCP协议实现
import { VibeCLIMCPServer } from './server.js'

// 检查是否直接运行这个文件（而不是被import）
const isMainModule = process.argv[1] && process.argv[1].endsWith('stdio-server.js')

interface StdioTransport {
  write(data: string): void
  onMessage(callback: (message: any) => void): void
}

class StdioMCPTransport implements StdioTransport {
  private messageBuffer = ''
  private onMessageCallback: ((message: any) => void) | null = null

  constructor() {
    // 监听stdin
    process.stdin.on('data', (data) => {
      this.messageBuffer += data.toString()
      this.processBuffer()
    })

    process.stdin.on('end', () => {
      process.exit(0)
    })
  }

  private processBuffer() {
    const lines = this.messageBuffer.split('\n')
    this.messageBuffer = lines.pop() || ''

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line.trim())
          if (this.onMessageCallback) {
            this.onMessageCallback(message)
          }
        } catch (error) {
          console.error('Failed to parse JSON:', error, 'Line:', line)
        }
      }
    }
  }

  write(data: string): void {
    process.stdout.write(data + '\n')
  }

  onMessage(callback: (message: any) => void): void {
    this.onMessageCallback = callback
  }
}

async function main() {
  const transport = new StdioMCPTransport()
  const mcpServer = new VibeCLIMCPServer()

  // 处理MCP消息
  transport.onMessage(async (request) => {
    try {
      const response = await mcpServer.handleRequest(request)
      transport.write(JSON.stringify(response))
    } catch (error) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: request.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        }
      }
      transport.write(JSON.stringify(errorResponse))
    }
  })

  // 优雅关闭处理
  process.on('SIGINT', () => {
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    process.exit(0)
  })

  // 防止进程退出
  process.stdin.resume()
}

// ESM入口点检查 - 支持多种调用方式
if (import.meta.url === `file://${process.argv[1]}` || isMainModule) {
  main().catch((error) => {
    console.error('MCP Server Error:', error)
    process.exit(1)
  })
}

export { StdioMCPTransport }