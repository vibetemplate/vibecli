# Changelog

All notable changes to VibeCLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2025-07-02

### 🎯 Major Features
- **Template Store Ecosystem** - Complete template marketplace with remote/local management
- **Intelligent Deployment Generator** - Multi-platform deployment with auto-configuration
- **Internationalization (i18n)** - Multi-language support with CLI language switching
- **Interactive Learning System** - Built-in tutorials for hands-on learning
- **Enhanced Security** - Ed25519 digital signatures and SHA-256 verification

### ✨ New Features

#### Template Store (`vibecli template`)
- **Remote Template Index** - Centralized template marketplace with version management
- **Secure Installation** - Ed25519 signature verification and SHA-256 integrity checks
- **Local Registry** - Track installed templates with metadata
- **Template Publishing** - `vibecli publish-template` for community contributions
- **Smart Caching** - 5-minute TTL for remote index with offline fallback

#### Deployment Generator (`vibecli deploy --generate`)
- **Multi-Platform Support** - Vercel, Netlify, Docker, Cloudflare, Aliyun, AWS
- **Auto-Configuration** - Platform-specific config files generation
- **SQLite Migration** - Automatic blob storage migration for serverless platforms
- **Deployment Metadata** - Track deployment history and configuration

#### Interactive Learning (`vibecli learn`)
- **Guided Tutorials** - Step-by-step tutorials for beginners
- **4 Learning Tracks** - Basic usage, Templates, Deployment, MCP integration
- **Executable Examples** - Copy-paste ready commands with explanations
- **Progress Tracking** - Interactive confirmation at each step

#### Multi-Language Support
- **CLI Language Switching** - `vibecli --lang en|zh` for interface language
- **Runtime Language Detection** - Environment variable support
- **Internationalization Framework** - Extensible i18n system

### 🔧 Improvements
- **Enhanced Error Handling** - Better error messages and user guidance
- **Performance Optimization** - Faster template operations with smart caching
- **Security Hardening** - Cryptographic verification for all external content
- **Test Coverage** - Added 50+ new tests, improved coverage to 90%+
- **Documentation** - Comprehensive API documentation and usage guides

### 🛠️ Technical Changes
- **ESM Compatibility** - Fixed `__dirname` issues in ES modules
- **Build Process** - Automated template index generation
- **Dependency Updates** - Added crypto libraries and validation tools
- **Type Safety** - Enhanced TypeScript definitions

### 📦 New Dependencies
- `adm-zip@^0.5.10` - ZIP file handling for template packaging
- `tweetnacl@^1.0.3` - Ed25519 cryptographic signatures
- `tweetnacl-util@^0.15.1` - Crypto utility functions
- `uuid@^9.0.0` - Unique identifier generation
- `ts-node@^10.9.2` - TypeScript execution for build scripts

### 🧪 Testing
- **New Test Modules** - 5 comprehensive test suites added
- **Coverage Threshold** - Set to 90% lines, 85% branches/functions
- **Security Testing** - Cryptographic verification and edge cases
- **Integration Testing** - E2E workflow testing for all major features
- **Mock Infrastructure** - Improved mocking for external dependencies

### 📚 Commands Added
```bash
vibecli template list                    # List available templates
vibecli template install <name>          # Install template from store
vibecli template remove <name>           # Remove installed template
vibecli publish-template <dir>           # Publish template to store
vibecli learn [topic]                    # Interactive learning tutorials
vibecli --lang <en|zh>                   # Set CLI interface language
```

### 🔄 Breaking Changes
- **Template Resolution** - Now prefers installed templates over built-in ones
- **Configuration Structure** - Enhanced config schema with validation
- **Command Signatures** - Some command options have been refined

### 📈 Migration Guide

#### From v1.8.x to v1.9.0
1. **Template Usage**: No changes needed, but consider using `vibecli template install` for better templates
2. **Deployment**: Use new `--generate` flag for auto-configuration
3. **Learning**: Try `vibecli learn` for interactive tutorials
4. **Language**: Use `--lang` flag for preferred language interface

### 🐛 Bug Fixes
- Fixed ESM compatibility issues in build scripts
- Resolved path resolution conflicts in template loading
- Improved error handling for network failures
- Fixed version management inconsistencies

---

## [1.8.0] - 2025-07-02

### 🎯 Major Features
- **Zero-Configuration Experience** - SQLite default database for instant setup
- **Intelligent Chat Assistant** - `vibecli chat` with real-time intent analysis
- **Environment Diagnostics** - `vibecli doctor` for automated dependency management
- **Three-Layer Configuration** - defaults → overrides → runtime configuration system

### ✨ New Features

#### Smart Assistant (`vibecli chat`)
- **Natural Language Processing** - Understand project requirements in plain language
- **Intent Analysis** - Automatically detect project type and complexity
- **Real-time Suggestions** - Dynamic recommendations based on conversation context
- **Confidence Scoring** - Quality assessment of analysis results

#### Environment Doctor (`vibecli doctor`)
- **Automatic Dependency Detection** - Scan and install missing packages
- **Environment Validation** - Check Node.js, npm, and project dependencies
- **Repair Suggestions** - Actionable steps to fix common issues
- **Silent Operation** - Non-intrusive background health checks

#### Configuration Management (`vibecli config`)
- **Three-Layer System** - Hierarchical configuration merging
- **Validation Tools** - `validate`, `diff`, `migrate`, `reset` commands
- **Hot Reloading** - Development mode configuration updates
- **Schema Validation** - Zod-powered runtime validation

### 🔧 Technical Improvements
- **ES Module Compatibility** - Full ESM support with proper __dirname handling
- **Default Database Change** - SQLite for zero-configuration startup
- **Automated Build** - Configuration files auto-copy to dist directory
- **Enhanced CLI UX** - Better command structure and help system

---

## [1.7.2] - 2025-06-30

### 🧪 Testing Excellence
- **100% Test Pass Rate** - 98 tests covering all major functionality
- **Enterprise-Grade Quality** - Comprehensive test infrastructure
- **Unified Version Management** - Dynamic version reading from package.json
- **Mock System** - Complete ESM-compatible testing framework

### 📊 Quality Metrics
- **98 Test Cases** - Unit, integration, and E2E coverage
- **0 Failed Tests** - 100% reliability standard
- **Unified Versioning** - Single source of truth for version numbers
- **Mock Infrastructure** - Isolated testing environment

---

## [1.5.0] - 2025-07-01

### 🧠 Intelligent Template Matching
- **5-Layer Matching Strategy** - Comprehensive template selection algorithm
- **Smart Fallback Handling** - Intelligent degradation for complex requirements
- **Interactive Clarification** - Auto-generated questions for requirement refinement
- **Progressive Implementation** - Risk-reduced development planning

---

## [1.4.0] - 2025-06-30

### 📁 Cross-Platform Directory Management
- **Platform-Specific Defaults** - Mac, Windows, Linux optimized paths
- **Intelligent Permissions** - Automatic directory creation and validation
- **Clear Location Guidance** - Explicit file location feedback
- **User Experience Enhancement** - Eliminated confusion about file placement

---

## [1.3.0] - 2025-06-29

### 🔗 MCP Smart Prompt Generation
- **Multi-Round Context** - Progressive understanding through conversation
- **Context-Aware Selection** - Smart template matching based on user experience
- **Confidence Assessment** - Quality scoring for generated recommendations
- **Session State Management** - Persistent conversation context

---

Earlier versions focused on core CLI functionality, template systems, and MCP protocol integration.

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.