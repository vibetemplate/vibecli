# VibeCLI 版本管理

## 概述

VibeCLI 使用统一的版本管理系统，所有版本号都从 `package.json` 中读取，避免多处手动修改。

## 版本号来源

- **主要来源**: `package.json` 中的 `version` 字段
- **CLI 版本**: 通过 `src/utils/version.ts` 动态读取
- **API 版本**: 通过 `src/index.ts` 导出

## 版本更新流程

### 1. 自动版本更新（推荐）

使用 npm 内置的版本管理命令：

```bash
# 补丁版本 (1.7.1 -> 1.7.2)
npm run release:patch

# 次要版本 (1.7.1 -> 1.8.0)  
npm run release:minor

# 主要版本 (1.7.1 -> 2.0.0)
npm run release:major
```

这些命令会自动：
1. 更新 `package.json` 中的版本号
2. 创建 git tag
3. 构建项目
4. 发布到 npm
5. 推送到 GitHub

### 2. 手动版本更新

如果需要手动控制：

```bash
# 只更新版本号和构建
npm run version:patch
npm run version:minor  
npm run version:major

# 然后手动发布
npm publish
git push --follow-tags
```

### 3. 开发版本更新

仅更新版本号而不发布：

```bash
npm version patch --no-git-tag-version
npm run build
```

## 版本号规则

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

## 文件结构

```
src/
├── utils/version.ts          # 版本读取工具
├── cli.ts                    # CLI 入口，使用动态版本
├── index.ts                  # API 入口，导出版本
└── ...
package.json                  # 版本号的唯一来源
```

## 注意事项

1. **不要手动修改代码中的版本号** - 所有版本号都从 `package.json` 读取
2. **使用 npm scripts** - 确保版本更新、构建、发布的一致性
3. **git tags** - 每次发布都会自动创建对应的 git tag
4. **构建检查** - 发布前会自动运行构建确保代码正常

## 故障排除

### 版本读取失败

如果 `src/utils/version.ts` 无法读取版本号，会回退到默认版本并显示警告。检查：

1. `package.json` 文件是否存在
2. 文件路径是否正确
3. JSON 格式是否有效

### 发布失败

如果自动发布失败：

1. 检查 npm 登录状态：`npm whoami`
2. 检查网络连接
3. 检查包名是否已存在相同版本

## 示例

```bash
# 修复一个 bug，发布补丁版本
npm run release:patch

# 添加新功能，发布次要版本  
npm run release:minor

# 重大重构，发布主要版本
npm run release:major
``` 