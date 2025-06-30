# VibeCLI 测试指南

## 测试结构

本项目包含三个层次的测试：

### 1. 单元测试 (Unit Tests)
- **位置**: `src/__tests__/utils/`, `src/__tests__/commands/`
- **目的**: 测试独立的函数和模块
- **覆盖范围**: 
  - 验证函数 (`validation.test.ts`)
  - CLI命令 (`create.test.ts`)

### 2. 集成测试 (Integration Tests)
- **位置**: `src/__tests__/integration/`
- **目的**: 测试多个模块协同工作
- **覆盖范围**:
  - 完整项目生成流程 (`project-generation.test.ts`)
  - 模板系统集成
  - 配置生成验证

### 3. 端到端测试 (E2E Tests)
- **位置**: `src/__tests__/e2e/`
- **目的**: 测试完整的用户工作流程
- **覆盖范围**:
  - CLI命令执行 (`full-workflow.test.ts`)
  - 用户交互流程
  - 错误处理场景

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行特定类型的测试
```bash
# 只运行单元测试
npm test -- --testPathPattern="unit|utils|commands"

# 只运行集成测试
npm test -- --testPathPattern="integration"

# 只运行端到端测试
npm test -- --testPathPattern="e2e"
```

### 监视模式
```bash
npm run test:watch
```

### 生成覆盖率报告
```bash
npm run test:coverage
```

## 测试覆盖范围

### 核心功能测试
- ✅ 项目名称验证
- ✅ 目录权限检查
- ✅ 模板选择验证
- ✅ 数据库配置验证
- ✅ Node.js版本检查
- ✅ 功能模块验证

### CLI命令测试
- ✅ `create` 命令完整流程
- ✅ 命令行选项处理
- ✅ 交互式提示
- ✅ 错误处理和恢复

### 项目生成测试
- ✅ 文件结构生成
- ✅ 配置文件生成
- ✅ 依赖管理
- ✅ 模板系统
- ✅ 数据库集成

### 错误场景测试
- ✅ 无效输入处理
- ✅ 文件系统错误
- ✅ 网络错误
- ✅ 权限错误

## 测试工具和Mock

### 使用的测试工具
- **Jest**: 测试框架
- **ts-jest**: TypeScript支持
- **fs-extra**: 文件系统操作
- **Mock**: 外部依赖模拟

### Mock策略
- `child_process.execSync`: 模拟系统命令执行
- `inquirer`: 模拟用户交互
- `ora`: 模拟进度指示器
- `console.*`: 模拟控制台输出
- `process.exit`: 模拟进程退出

### 测试辅助工具
- `setup.ts`: 测试环境设置
- `createTempDir()`: 创建临时测试目录
- `cleanupTempDir()`: 清理测试目录
- `mockConsole()`: 模拟控制台
- `mockProcessExit()`: 模拟进程退出

## 测试数据管理

### 临时目录管理
每个测试用例都会创建独立的临时目录，测试完成后自动清理。

### 测试隔离
- 每个测试都有独立的Mock
- 自动清理外部状态
- 避免测试间相互影响

## 持续集成

### 自动化测试
- 每次提交都会运行测试
- 测试失败会阻止合并
- 覆盖率报告自动生成

### 测试环境
- Node.js 18.17.0+
- 支持Linux/macOS/Windows
- 自动依赖安装

## 贡献指南

### 添加新测试
1. 在对应目录创建测试文件
2. 使用描述性的测试名称
3. 包含正面和负面测试用例
4. 确保测试隔离和清理

### 测试最佳实践
- 测试应该快速且可靠
- 使用有意义的断言
- 模拟外部依赖
- 测试边界条件
- 保持测试简单明了

### 调试测试
```bash
# 运行单个测试文件
npm test -- validation.test.ts

# 运行单个测试用例
npm test -- --testNamePattern="should validate project name"

# 详细输出
npm test -- --verbose
```

## 注意事项

1. **CI环境**: 某些交互式测试在CI环境中会跳过
2. **权限**: 文件系统测试需要适当的权限
3. **超时**: 长时间运行的测试设置了适当的超时
4. **清理**: 所有测试都会自动清理临时文件

## 测试覆盖率目标

- 语句覆盖率: > 80%
- 分支覆盖率: > 75%
- 函数覆盖率: > 90%
- 行覆盖率: > 80%