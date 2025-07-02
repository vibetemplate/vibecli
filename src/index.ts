// VibeCLI - 智能全栈Web应用CLI工具
// 主入口文件

export { VibeCLICore } from './core/vibecli-core.js'
export { IntentAnalyzer } from './prompts/dynamic/intent-analyzer.js'
export { PromptTemplateEngine } from './prompts/dynamic/template-engine.js'
export { validateProjectName, validateTemplate, validateDatabase } from './utils/validation.js'

// 类型导出
export type { 
  ProjectConfig, 
  ProjectResult, 
  FeatureConfig, 
  FeatureResult,
  DeploymentConfig,
  DeploymentResult,
  ValidationResult 
} from './core/types.js'

// 版本信息 - 从 package.json 读取
export { version } from './utils/version.js' 