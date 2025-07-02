// Stub for 'inquirer' used in tests to avoid ESM import issues
import { jest } from '@jest/globals'

const prompt = jest.fn()
const inquirerStub = {
  prompt,
  registerPrompt: jest.fn(),
  createPromptModule: jest.fn(() => ({ prompt }))
}

export default inquirerStub; 