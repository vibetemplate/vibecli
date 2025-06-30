// 增强的会话管理和断线重连机制
// 基于MCP 2025-06-18规范的Last-Event-ID协议

import { EventEmitter } from 'events'

export interface Session {
  id: string
  protocolVersion: string
  clientInfo: {
    name: string
    version: string
  }
  capabilities: any
  createdAt: string
  lastActivity: string
  initialized: boolean
  currentTasks: Map<string, TaskState>
  eventHistory: SSEEvent[]
  connectionStatus: 'active' | 'disconnected' | 'reconnecting'
}

export interface TaskState {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startTime: string
  lastUpdate: string
  result?: any
  error?: string
  checkpoints: TaskCheckpoint[]
}

export interface TaskCheckpoint {
  id: string
  timestamp: string
  progress: number
  phase: string
  data: any
}

export interface SSEEvent {
  id: string
  type: string
  data: any
  timestamp: string
  sessionId: string
}

export interface ReconnectionResult {
  success: boolean
  missedEvents: SSEEvent[]
  currentTasks: TaskState[]
  resumeInstructions: string[]
}

export class SessionManager extends EventEmitter {
  private sessions = new Map<string, Session>()
  private eventHistory = new Map<string, SSEEvent[]>()
  private taskStates = new Map<string, TaskState>()
  private maxEventHistory = 1000 // 每个会话最大事件历史数
  private sessionTimeout = 30 * 60 * 1000 // 30分钟会话超时
  private cleanupInterval!: NodeJS.Timeout

  constructor() {
    super()
    this.startCleanupTimer()
  }

  /**
   * 创建新会话
   */
  createSession(sessionId: string, initParams: any): Session {
    const session: Session = {
      id: sessionId,
      protocolVersion: initParams.protocolVersion || '2025-06-18',
      clientInfo: initParams.clientInfo,
      capabilities: initParams.capabilities,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      initialized: false,
      currentTasks: new Map(),
      eventHistory: [],
      connectionStatus: 'active'
    }

    this.sessions.set(sessionId, session)
    this.eventHistory.set(sessionId, [])
    
    this.emit('sessionCreated', session)
    return session
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * 更新会话活动时间
   */
  updateSessionActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActivity = new Date().toISOString()
      session.connectionStatus = 'active'
    }
  }

  /**
   * 标记会话已初始化
   */
  markSessionInitialized(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.initialized = true
      this.updateSessionActivity(sessionId)
    }
  }

  /**
   * 检查会话是否有效
   */
  isValidSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    return session !== undefined && session.initialized
  }

  /**
   * 记录SSE事件
   */
  recordEvent(sessionId: string, event: Omit<SSEEvent, 'timestamp' | 'sessionId'>): void {
    const fullEvent: SSEEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId
    }

    const history = this.eventHistory.get(sessionId) || []
    history.push(fullEvent)

    // 限制历史记录大小
    if (history.length > this.maxEventHistory) {
      history.shift()
    }

    this.eventHistory.set(sessionId, history)

    // 同时更新会话中的事件历史
    const session = this.sessions.get(sessionId)
    if (session) {
      session.eventHistory.push(fullEvent)
      if (session.eventHistory.length > this.maxEventHistory) {
        session.eventHistory.shift()
      }
    }
  }

  /**
   * 处理断线重连
   */
  handleReconnection(sessionId: string, lastEventId?: string): ReconnectionResult {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return {
        success: false,
        missedEvents: [],
        currentTasks: [],
        resumeInstructions: ['会话不存在，请重新初始化']
      }
    }

    // 标记会话为重连状态
    session.connectionStatus = 'reconnecting'
    
    // 获取丢失的事件
    const missedEvents = this.getMissedEvents(sessionId, lastEventId)
    
    // 获取当前进行中的任务
    const currentTasks = Array.from(session.currentTasks.values())
      .filter(task => task.status === 'running' || task.status === 'pending')

    // 生成恢复指令
    const resumeInstructions = this.generateResumeInstructions(session, currentTasks, missedEvents)

    // 更新会话状态
    session.connectionStatus = 'active'
    this.updateSessionActivity(sessionId)

    this.emit('sessionReconnected', {
      sessionId,
      missedEventsCount: missedEvents.length,
      activeTasks: currentTasks.length
    })

    return {
      success: true,
      missedEvents,
      currentTasks,
      resumeInstructions
    }
  }

  /**
   * 获取丢失的事件
   */
  private getMissedEvents(sessionId: string, lastEventId?: string): SSEEvent[] {
    const history = this.eventHistory.get(sessionId) || []
    
    if (!lastEventId) {
      // 如果没有lastEventId，返回最近的事件
      return history.slice(-10)
    }

    const lastIndex = history.findIndex(event => event.id === lastEventId)
    if (lastIndex >= 0) {
      return history.slice(lastIndex + 1)
    }

    // 如果找不到lastEventId，可能是因为事件太老被清理了
    return history.slice(-20) // 返回最近20个事件
  }

  /**
   * 创建任务状态
   */
  createTask(sessionId: string, taskId: string, taskType: string): TaskState {
    const task: TaskState = {
      id: taskId,
      type: taskType,
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      checkpoints: []
    }

    this.taskStates.set(taskId, task)
    
    const session = this.sessions.get(sessionId)
    if (session) {
      session.currentTasks.set(taskId, task)
    }

    return task
  }

  /**
   * 更新任务进度
   */
  updateTaskProgress(taskId: string, progress: number, phase: string, data?: any): void {
    const task = this.taskStates.get(taskId)
    if (task) {
      task.progress = progress
      task.lastUpdate = new Date().toISOString()
      
      // 创建检查点
      const checkpoint: TaskCheckpoint = {
        id: `checkpoint-${Date.now()}`,
        timestamp: new Date().toISOString(),
        progress,
        phase,
        data: data || {}
      }
      
      task.checkpoints.push(checkpoint)
      
      // 限制检查点数量
      if (task.checkpoints.length > 50) {
        task.checkpoints.shift()
      }

      this.emit('taskProgress', {
        taskId,
        progress,
        phase,
        checkpoint
      })
    }
  }

  /**
   * 完成任务
   */
  completeTask(taskId: string, result: any): void {
    const task = this.taskStates.get(taskId)
    if (task) {
      task.status = 'completed'
      task.progress = 1.0
      task.result = result
      task.lastUpdate = new Date().toISOString()

      this.emit('taskCompleted', {
        taskId,
        result
      })
    }
  }

  /**
   * 任务失败
   */
  failTask(taskId: string, error: string): void {
    const task = this.taskStates.get(taskId)
    if (task) {
      task.status = 'failed'
      task.error = error
      task.lastUpdate = new Date().toISOString()

      this.emit('taskFailed', {
        taskId,
        error
      })
    }
  }

  /**
   * 生成恢复指令
   */
  private generateResumeInstructions(
    session: Session, 
    activeTasks: TaskState[], 
    missedEvents: SSEEvent[]
  ): string[] {
    const instructions: string[] = []

    instructions.push(`🔄 会话 ${session.id} 重连成功`)
    
    if (missedEvents.length > 0) {
      instructions.push(`📡 重播了 ${missedEvents.length} 个丢失的事件`)
    }

    if (activeTasks.length > 0) {
      instructions.push(`⚡ 检测到 ${activeTasks.length} 个进行中的任务：`)
      
      activeTasks.forEach(task => {
        const latestCheckpoint = task.checkpoints[task.checkpoints.length - 1]
        if (latestCheckpoint) {
          instructions.push(
            `  • ${task.type} (${Math.round(task.progress * 100)}% - ${latestCheckpoint.phase})`
          )
        } else {
          instructions.push(`  • ${task.type} (${task.status})`)
        }
      })

      if (activeTasks.some(task => task.status === 'running')) {
        instructions.push(`🚀 任务将自动恢复执行`)
      }
    } else {
      instructions.push(`✅ 所有任务已完成，会话状态正常`)
    }

    instructions.push(`⏰ 上次活动: ${new Date(session.lastActivity).toLocaleString()}`)

    return instructions
  }

  /**
   * 清理过期会话
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now()
    const expiredSessions: string[] = []

    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = new Date(session.lastActivity).getTime()
      if (now - lastActivity > this.sessionTimeout) {
        expiredSessions.push(sessionId)
      }
    }

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId)
      this.eventHistory.delete(sessionId)
      
      // 清理该会话的任务
      for (const [taskId, task] of this.taskStates.entries()) {
        if (task.id.startsWith(sessionId)) {
          this.taskStates.delete(taskId)
        }
      }

      this.emit('sessionExpired', sessionId)
    })

    if (expiredSessions.length > 0) {
      console.log(`🧹 清理了 ${expiredSessions.length} 个过期会话`)
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }

  /**
   * 停止会话管理器
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.sessions.clear()
    this.eventHistory.clear()
    this.taskStates.clear()
  }

  /**
   * 获取会话统计信息
   */
  getStats(): {
    totalSessions: number
    activeSessions: number
    totalTasks: number
    runningTasks: number
    totalEvents: number
  } {
    const now = Date.now()
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => {
        const lastActivity = new Date(session.lastActivity).getTime()
        return now - lastActivity < this.sessionTimeout
      }).length

    const runningTasks = Array.from(this.taskStates.values())
      .filter(task => task.status === 'running' || task.status === 'pending').length

    const totalEvents = Array.from(this.eventHistory.values())
      .reduce((sum, events) => sum + events.length, 0)

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      totalTasks: this.taskStates.size,
      runningTasks,
      totalEvents
    }
  }
}