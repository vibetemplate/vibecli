import chalk from 'chalk'
import { publishTemplate } from '../utils/template-publisher.js'
import path from 'path'

interface PublishOpts {
  path: string
  validateOnly?: boolean
}

export async function publishTplCmd(templateDir: string, options: PublishOpts) {
  try {
    const absTemplatePath = path.resolve(templateDir)
    const registryRoot = path.resolve('templates')
    await publishTemplate({ templatePath: absTemplatePath, registryRoot, validateOnly: options.validateOnly })
    console.log(chalk.green('Template publish workflow completed'))
  } catch (err: any) {
    console.error(chalk.red('Publish failed:'), err.message)
    process.exit(1)
  }
} 