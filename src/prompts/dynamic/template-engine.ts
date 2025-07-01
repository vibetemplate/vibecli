import { readFileSync } from 'fs'
import { join } from 'path'
import Mustache from 'mustache'
import type { PromptTemplate, PromptContext, PromptGenerationResult } from '../../core/types.js'
import type { ProjectIntent } from './context-aware-template-selector.js'
import { contextAwareTemplateSelector, type TemplateSelectionContext } from './context-aware-template-selector.js'

export class PromptTemplateEngine {
  private templatesPath: string
  private templates: Map<string, PromptTemplate> = new Map()

  constructor(templatesPath?: string) {
    this.templatesPath = templatesPath || join(process.cwd(), 'src', 'prompts')
    this.loadTemplates()
  }

  /**
   * 加载所有可用的提示词模板
   */
  private loadTemplates() {
    const projectTypes = ['ecommerce', 'saas', 'blog', 'portfolio', 'dashboard']
    
    projectTypes.forEach(type => {
      const template: PromptTemplate = {
        id: `${type}-main`,
        name: `${type} 主提示词`,
        projectType: type,
        templatePath: join(this.templatesPath, 'project-types', type, 'main-prompt.md'),
        variables: this.extractTemplateVariables(type),
        description: `为 ${type} 项目类型生成专业开发指导提示词`
      }
      this.templates.set(type, template)
    })
  }

  /**
   * 提取模板中的变量（简化版本，实际可以通过解析模板文件获取）
   */
  private extractTemplateVariables(projectType: string): string[] {
    const commonVariables = [
      'project_name',
      'project_type', 
      'complexity_level',
      'detected_features',
      'tech_stack',
      'vibecli_version',
      'current_date'
    ]

    const typeSpecificVariables: Record<string, string[]> = {
      ecommerce: ['has_payment_feature'],
      saas: ['has_billing_feature'],
      blog: ['has_search_feature'],
      portfolio: [],
      dashboard: []
    }

    return [...commonVariables, ...(typeSpecificVariables[projectType] || [])]
  }

  /**
   * 根据项目类型获取对应的模板
   */
  getTemplate(projectType: string): PromptTemplate | null {
    return this.templates.get(projectType.toLowerCase()) || null
  }

  /**
   * 渲染提示词模板 - 支持上下文感知选择
   */
  async renderPrompt(
    projectType: string, 
    context: PromptContext,
    projectIntent?: ProjectIntent,
    selectionContext?: Partial<TemplateSelectionContext>
  ): Promise<PromptGenerationResult> {
    try {
      let selectedTemplate: any
      let templatePath: string

      // 如果提供了项目意图，使用上下文感知选择
      if (projectIntent && selectionContext) {
        const fullSelectionContext: TemplateSelectionContext = {
          projectIntent,
          userExperience: selectionContext.userExperience || 'intermediate',
          developmentPhase: selectionContext.developmentPhase || 'development',
          previousFeedback: selectionContext.previousFeedback || []
        }

        try {
          const selectedVariant = await contextAwareTemplateSelector.selectOptimalTemplate(fullSelectionContext)
          templatePath = join(this.templatesPath, selectedVariant.templatePath)
          selectedTemplate = {
            id: selectedVariant.id,
            name: selectedVariant.name,
            templatePath: templatePath
          }
        } catch (error) {
          console.warn('上下文感知模板选择失败，使用默认模板:', error)
          selectedTemplate = this.getTemplate(projectType)
          templatePath = selectedTemplate?.templatePath
        }
      } else {
        selectedTemplate = this.getTemplate(projectType)
        templatePath = selectedTemplate?.templatePath
      }

      if (!selectedTemplate) {
        return {
          success: false,
          prompt: '',
          metadata: {
            projectType,
            detectedFeatures: [],
            confidenceScore: 0,
            templateUsed: 'none',
            generatedAt: new Date().toISOString()
          },
          error: `未找到项目类型 "${projectType}" 的模板`
        }
      }

      // 读取模板文件
      const templateContent = readFileSync(templatePath, 'utf-8')
      
      // 添加基础模板内容（VibeCLI核心指导）
      const baseContent = this.getBaseContent()
      
      // 渲染模板
      const renderedPrompt = Mustache.render(templateContent, {
        ...context,
        base_content: baseContent
      })

      return {
        success: true,
        prompt: renderedPrompt,
        metadata: {
          projectType,
          detectedFeatures: context.detected_features || [],
          confidenceScore: this.calculateConfidenceScore(context),
          templateUsed: selectedTemplate.id,
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        prompt: '',
        metadata: {
          projectType,
          detectedFeatures: [],
          confidenceScore: 0,
          templateUsed: 'error',
          generatedAt: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 获取基础提示词内容
   */
  private getBaseContent(): string {
    try {
      const baseFiles = [
        'base/vibecli-core.md',
        'base/best-practices.md', 
        'base/tech-stack-guide.md'
      ]
      
      return baseFiles.map(file => {
        const filePath = join(this.templatesPath, file)
        return readFileSync(filePath, 'utf-8')
      }).join('\n\n---\n\n')
    } catch (error) {
      console.warn('无法加载基础模板内容:', error)
      return ''
    }
  }

  /**
   * 计算提示词生成的置信度分数
   */
  private calculateConfidenceScore(context: PromptContext): number {
    let score = 50 // 基础分数

    // 项目类型明确性
    if (context.project_type && this.templates.has(context.project_type)) {
      score += 20
    }

    // 功能特性完整性
    if (context.detected_features && context.detected_features.length > 0) {
      score += Math.min(20, context.detected_features.length * 5)
    }

    // 技术栈明确性
    if (context.tech_stack && context.tech_stack.length > 0) {
      score += 10
    }

    return Math.min(100, score)
  }

  /**
   * 获取所有可用的模板列表
   */
  getAvailableTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 预览模板（返回模板的前200个字符）
   */
  previewTemplate(projectType: string): string | null {
    try {
      const template = this.getTemplate(projectType)
      if (!template) return null

      const content = readFileSync(template.templatePath, 'utf-8')
      return content.substring(0, 200) + '...'
    } catch (error) {
      return null
    }
  }
}

/**
 * 单例模式的模板引擎实例
 */
export const promptTemplateEngine = new PromptTemplateEngine()