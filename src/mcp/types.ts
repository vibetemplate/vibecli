// MCP协议类型定义，基于官方规范

export interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

export interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: MCPError
}

export interface MCPError {
  code: number
  message: string
  data?: any
}

export interface InitializeRequest extends MCPRequest {
  method: 'initialize'
  params: {
    protocolVersion: string
    capabilities: ClientCapabilities
    clientInfo: {
      name: string
      version: string
    }
  }
}

export interface InitializeResponse extends MCPResponse {
  result: {
    protocolVersion: string
    capabilities: ServerCapabilities
    serverInfo: {
      name: string
      version: string
    }
  }
}

export interface ClientCapabilities {
  tools?: {
    listChanged?: boolean
  }
  resources?: {
    subscribe?: boolean
    listChanged?: boolean
  }
  prompts?: {
    listChanged?: boolean
  }
  logging?: {}
  sampling?: {}
}

export interface ServerCapabilities {
  tools?: {
    listChanged?: boolean
    // 2025-06-18 新增
    structuredOutput?: boolean
  }
  resources?: {
    subscribe?: boolean
    listChanged?: boolean
    // 2025-06-18 新增
    resourceLinks?: boolean
  }
  prompts?: {
    listChanged?: boolean
  }
  logging?: {}
  // 2025-06-18 新增能力
  elicitation?: {}
  experimental?: {}
}

// 工具相关类型
export interface Tool {
  name: string
  description: string
  inputSchema: object
}

export interface CallToolRequest extends MCPRequest {
  method: 'tools/call'
  params: {
    name: string
    arguments?: object
  }
}

export interface CallToolResponse extends MCPResponse {
  result: {
    content?: ToolResult[]
    isError?: boolean
    // 2025-06-18 新增：结构化工具输出
    outputType?: 'structured'
    format?: 'json-schema'
    _meta?: {
      generatedAt?: string
      version?: string
      processingTime?: string
      tokensUsed?: number
    }
  }
}

export interface ToolResult {
  type: 'text' | 'image' | 'resource'
  text?: string
  data?: string
  url?: string
  mimeType?: string
}

export interface ListToolsRequest extends MCPRequest {
  method: 'tools/list'
}

export interface ListToolsResponse extends MCPResponse {
  result: {
    tools: Tool[]
  }
}

// 资源相关类型
export interface Resource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface ListResourcesRequest extends MCPRequest {
  method: 'resources/list'
}

export interface ListResourcesResponse extends MCPResponse {
  result: {
    resources: Resource[]
  }
}

export interface ReadResourceRequest extends MCPRequest {
  method: 'resources/read'
  params: {
    uri: string
  }
}

export interface ReadResourceResponse extends MCPResponse {
  result: {
    contents: ResourceContent[]
  }
}

export interface ResourceContent {
  uri: string
  mimeType?: string
  text?: string
  blob?: string
}

// 提示相关类型
export interface Prompt {
  name: string
  description?: string
  arguments?: PromptArgument[]
}

export interface PromptArgument {
  name: string
  description?: string
  required?: boolean
}

export interface ListPromptsRequest extends MCPRequest {
  method: 'prompts/list'
}

export interface ListPromptsResponse extends MCPResponse {
  result: {
    prompts: Prompt[]
  }
}

export interface GetPromptRequest extends MCPRequest {
  method: 'prompts/get'
  params: {
    name: string
    arguments?: Record<string, string>
  }
}

export interface GetPromptResponse extends MCPResponse {
  result: {
    description?: string
    messages: PromptMessage[]
  }
}

export interface PromptMessage {
  role: 'user' | 'assistant' | 'system'
  content: {
    type: 'text' | 'image'
    text?: string
    data?: string
    mimeType?: string
  }
}

// Sampling相关类型（用于AI驱动的递归分析）
export interface SamplingRequest extends MCPRequest {
  method: 'sampling/createMessage'
  params: {
    messages: PromptMessage[]
    modelPreferences?: {
      hints?: {
        name?: string
      }
      intelligencePriority?: number
      speedPriority?: number
    }
    systemPrompt?: string
    includeContext?: string
    temperature?: number
    maxTokens?: number
    stopSequences?: string[]
    metadata?: object
  }
}

export interface SamplingResponse extends MCPResponse {
  result: {
    model: string
    role: 'assistant'
    content: {
      type: 'text'
      text: string
    }
    stopReason?: 'endTurn' | 'stopSequence' | 'maxTokens'
  }
}

// VibeCLI特定的工具参数类型
export interface ProjectAnalyzerParams {
  description: string
  requirements?: string[]
  constraints?: {
    budget?: 'low' | 'medium' | 'high'
    timeline?: 'urgent' | 'normal' | 'flexible'
    team_size?: number
    complexity?: 'simple' | 'medium' | 'complex'
  }
}

export interface TemplateGeneratorParams {
  analysis_result: object
  project_name: string
  target_directory?: string
  customizations?: object
}

export interface FeatureComposerParams {
  project_path: string
  feature_type: 'auth' | 'payment' | 'search' | 'analytics' | 'real-time' | 'ai-integration'
  integration_method?: 'component' | 'service' | 'middleware' | 'plugin'
  customization?: object
}

export interface DeploymentManagerParams {
  project_path: string
  platform: 'vercel' | 'netlify' | 'aws' | 'gcp' | 'azure' | 'docker'
  environment: 'development' | 'staging' | 'production'
  custom_config?: object
}