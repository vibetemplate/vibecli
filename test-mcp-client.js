// 简单的MCP客户端测试脚本

import http from 'http';

async function testMCPServer() {
  console.log('🧪 测试VibeCLI MCP Server\n');

  const serverUrl = 'http://localhost:3001';
  
  // 测试1: 初始化连接
  console.log('1. 测试初始化连接...');
  try {
    console.log('正在连接到', serverUrl);
    const initResponse = await makeRequest(serverUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {
          tools: { listChanged: true }
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });
    
    console.log('✅ 初始化成功');
    console.log('   Session ID:', initResponse.headers['mcp-session-id']);
    console.log('   协议版本:', initResponse.data.result.protocolVersion);
    
    const sessionId = initResponse.headers['mcp-session-id'];
    
    // 测试2: 列出可用工具
    console.log('\n2. 测试列出工具...');
    const toolsResponse = await makeRequest(serverUrl, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    }, { 'mcp-session-id': sessionId });
    
    console.log('✅ 工具列表获取成功');
    console.log('   可用工具数量:', toolsResponse.data.result.tools.length);
    toolsResponse.data.result.tools.forEach(tool => {
      console.log(`   • ${tool.name}: ${tool.description}`);
    });
    
    // 测试3: 调用项目分析器
    console.log('\n3. 测试项目分析器...');
    const analyzeResponse = await makeRequest(serverUrl, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'project_analyzer',
        arguments: {
          description: '我想创建一个电商网站，需要用户登录、商品管理、购物车和支付功能',
          requirements: ['用户认证', '商品展示', '购物车', '支付集成'],
          constraints: {
            budget: 'medium',
            timeline: 'normal',
            team_size: 2
          }
        }
      }
    }, { 'mcp-session-id': sessionId });
    
    console.log('✅ 项目分析完成');
    const analysisResult = JSON.parse(analyzeResponse.data.result.content[0].text);
    console.log('   项目类型:', analysisResult.projectType);
    console.log('   复杂度:', analysisResult.estimatedComplexity);
    console.log('   预计时间:', analysisResult.developmentTime);
    console.log('   推荐技术栈:', analysisResult.recommendedStack.frontend);
    
    console.log('\n✅ 所有测试通过！MCP服务器运行正常');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

function makeRequest(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            data: parsedData,
            headers: res.headers,
            statusCode: res.statusCode
          });
        } catch (error) {
          reject(new Error('Invalid JSON response: ' + responseData));
        }
      });
    });

    req.on('error', (error) => {
      console.error('HTTP请求错误:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPServer().catch(console.error);
}