// VibeCLI MCP HTTP Server - 支持Streamable HTTP Transport

import http from 'http'
import { VibeCLIMCPServer } from './server.js'
import { SessionManager } from './session-manager.js'
import { MCPRequest } from './types.js'

export class VibeCLIMCPHTTPServer {
  private server: http.Server
  private mcpServer: VibeCLIMCPServer
  private sessionManager: SessionManager
  private port: number

  constructor(port: number = 3001) {
    this.port = port
    this.mcpServer = new VibeCLIMCPServer()
    this.sessionManager = new SessionManager()
    this.server = http.createServer(this.handleRequest.bind(this))
    
    // 监听会话事件
    this.sessionManager.on('sessionCreated', (session) => {
      console.log(`🔗 新会话创建: ${session.id}`)
    })
    
    this.sessionManager.on('sessionReconnected', (info) => {
      console.log(`🔄 会话重连: ${info.sessionId}, 丢失事件: ${info.missedEventsCount}, 活跃任务: ${info.activeTasks}`)
    })
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`🚀 VibeCLI MCP Server running on http://localhost:${this.port}`)
        console.log('📡 Protocol: Streamable HTTP Transport')
        console.log('🔗 Ready for MCP client connections')
        resolve()
      })
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        this.sessionManager.stop()
        console.log('🛑 VibeCLI MCP Server stopped')
        resolve()
      })
    })
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // 设置CORS头部
    this.setCORSHeaders(res)

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // 只处理POST请求（MCP协议要求）
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: 'Method not allowed. Use POST for MCP requests.'
        }
      }))
      return
    }

    try {
      // 检查MCP会话ID
      const sessionId = req.headers['mcp-session-id'] as string
      
      // 读取请求体
      const body = await this.readRequestBody(req)
      let mcpRequest: MCPRequest

      try {
        mcpRequest = JSON.parse(body)
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error'
          }
        }))
        return
      }

      // 验证JSON-RPC格式
      if (!this.isValidMCPRequest(mcpRequest)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: (mcpRequest as any)?.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request'
          }
        }))
        return
      }

      // 处理初始化请求（建立会话）
      if (mcpRequest.method === 'initialize') {
        const response = await this.mcpServer.handleRequest(mcpRequest)
        
        // 使用客户端提供的会话ID，如果没有则生成新的
        const useSessionId = sessionId || this.generateSessionId()
        
        // 创建会话
        const session = this.sessionManager.createSession(useSessionId, mcpRequest.params)
        this.sessionManager.markSessionInitialized(useSessionId)

        // 设置会话ID头部
        res.setHeader('Mcp-Session-Id', useSessionId)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(response))
        return
      }

      // 检查断线重连
      const lastEventId = req.headers['last-event-id'] as string
      if (lastEventId && sessionId && this.sessionManager.getSession(sessionId)) {
        // 处理断线重连
        const reconnectionResult = this.sessionManager.handleReconnection(sessionId, lastEventId)
        
        if (reconnectionResult.success) {
          // 发送重连信息
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: mcpRequest.id,
            result: {
              type: 'reconnection',
              missedEvents: reconnectionResult.missedEvents,
              currentTasks: reconnectionResult.currentTasks,
              instructions: reconnectionResult.resumeInstructions
            }
          }))
          return
        }
      }

      // 其他请求需要有效的会话ID
      if (!sessionId || !this.sessionManager.isValidSession(sessionId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: mcpRequest.id || null,
          error: {
            code: -32602,
            message: 'Invalid session. Please initialize first.'
          }
        }))
        return
      }

      // 更新会话活动时间
      this.sessionManager.updateSessionActivity(sessionId)

      // 检查是否需要流式响应
      const needsStreaming = this.shouldUseStreaming(mcpRequest)

      if (needsStreaming) {
        // 启动SSE流式响应
        await this.handleStreamingResponse(req, res, mcpRequest, sessionId)
      } else {
        // 处理普通JSON响应
        const response = await this.mcpServer.handleRequest(mcpRequest)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(response))
      }

    } catch (error) {
      console.error('Server error:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        }
      }))
    }
  }

  private async handleStreamingResponse(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    mcpRequest: MCPRequest,
    sessionId: string
  ): Promise<void> {
    // 设置SSE头部
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Mcp-Session-Id'
    })

    // 发送初始连接事件
    const eventId = this.generateEventId()
    this.sendSSEEvent(res, {
      id: eventId + '-start',
      data: {
        type: 'connection',
        message: 'Stream connected',
        sessionId
      }
    }, sessionId)

    try {
      // 对于项目生成等长时间任务，提供进度更新
      if (mcpRequest.method === 'tools/call' && 
          ['template_generator', 'feature_composer', 'deployment_manager'].includes((mcpRequest.params as any)?.name)) {
        
        // 创建任务状态
        const taskId = `${sessionId}-${eventId}`
        const toolName = (mcpRequest.params as any).name
        const task = this.sessionManager.createTask(sessionId, taskId, toolName)
        
        // 发送进度事件
        this.sessionManager.updateTaskProgress(taskId, 0.1, 'analyzing', { message: '正在分析请求...' })
        this.sendSSEEvent(res, {
          id: eventId + '-progress-1',
          data: {
            type: 'progress',
            phase: 'analyzing',
            progress: 0.1,
            message: '正在分析请求...',
            taskId
          }
        }, sessionId)

        try {
          // 执行实际的MCP请求
          this.sessionManager.updateTaskProgress(taskId, 0.8, 'executing', { message: '正在执行操作...' })
          this.sendSSEEvent(res, {
            id: eventId + '-progress-2',
            data: {
              type: 'progress',
              phase: 'executing',
              progress: 0.8,
              message: '正在执行操作...',
              taskId
            }
          }, sessionId)

          const response = await this.mcpServer.handleRequest(mcpRequest)

          // 完成任务
          this.sessionManager.completeTask(taskId, response)
          this.sendSSEEvent(res, {
            id: eventId + '-result',
            data: {
              type: 'result',
              progress: 1.0,
              response,
              taskId
            }
          }, sessionId)
        } catch (error) {
          // 任务失败
          this.sessionManager.failTask(taskId, error instanceof Error ? error.message : String(error))
          this.sendSSEEvent(res, {
            id: eventId + '-error',
            data: {
              type: 'error',
              error: {
                code: -32603,
                message: 'Task execution failed',
                data: error instanceof Error ? error.message : String(error)
              },
              taskId
            }
          }, sessionId)
        }
      } else {
        // 对于其他请求，直接执行并返回结果
        const response = await this.mcpServer.handleRequest(mcpRequest)
        this.sendSSEEvent(res, {
          id: eventId + '-result',
          data: {
            type: 'result',
            response
          }
        }, sessionId)
      }

    } catch (error) {
      this.sendSSEEvent(res, {
        id: eventId + '-error',
        data: {
          type: 'error',
          error: {
            code: -32603,
            message: 'Streaming execution failed',
            data: error instanceof Error ? error.message : String(error)
          }
        }
      }, sessionId)
    }

    // 结束流
    res.end()
  }

  private sendSSEEvent(res: http.ServerResponse, event: { id: string, data: any }, sessionId?: string): void {
    const sseData = `id: ${event.id}\ndata: ${JSON.stringify(event.data)}\n\n`
    res.write(sseData)
    
    // 记录事件到会话管理器
    if (sessionId) {
      this.sessionManager.recordEvent(sessionId, {
        id: event.id,
        type: event.data.type || 'unknown',
        data: event.data
      })
    }
  }

  private async readRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      req.on('end', () => {
        resolve(body)
      })
      req.on('error', reject)
    })
  }

  private isValidMCPRequest(obj: any): obj is MCPRequest {
    return (
      obj &&
      obj.jsonrpc === '2.0' &&
      typeof obj.id !== 'undefined' &&
      typeof obj.method === 'string'
    )
  }

  private shouldUseStreaming(request: MCPRequest): boolean {
    // 对于长时间运行的操作使用流式响应
    if (request.method === 'tools/call') {
      const toolName = (request.params as any)?.name
      return ['template_generator', 'feature_composer', 'deployment_manager'].includes(toolName)
    }
    return false
  }

  private setCORSHeaders(res: http.ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id')
  }

  private generateSessionId(): string {
    return 'vibecli-session-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
  }

  private generateEventId(): string {
    return 'event-' + Math.random().toString(36).substring(2, 15)
  }

  // 获取会话统计信息
  getStats() {
    return this.sessionManager.getStats()
  }
}