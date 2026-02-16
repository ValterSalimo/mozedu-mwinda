/**
 * API Connection Test Utility
 * Tests both REST and GraphQL endpoints
 */

export async function testRESTConnection(): Promise<{
  success: boolean
  message: string
  endpoint: string
}> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  
  try {
    // Test auth endpoint (without credentials - expect 400/401)
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    })
    
    // Any response (even error) means the endpoint is reachable
    return {
      success: true,
      message: `REST API is reachable (status: ${response.status})`,
      endpoint: `${baseUrl}/api/v1`,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
      endpoint: `${baseUrl}/api/v1`,
    }
  }
}

export async function testGraphQLConnection(): Promise<{
  success: boolean
  message: string
  endpoint: string
}> {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql'
  
  try {
    // Test with introspection query
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '{ __schema { queryType { name } } }',
      }),
    })
    
    if (!response.ok) {
      return {
        success: false,
        message: `GraphQL endpoint returned ${response.status}`,
        endpoint: graphqlUrl,
      }
    }
    
    const result = await response.json()
    
    if (result.data?.__schema?.queryType?.name === 'Query') {
      return {
        success: true,
        message: 'GraphQL API is connected and responding',
        endpoint: graphqlUrl,
      }
    }
    
    return {
      success: false,
      message: 'GraphQL endpoint returned unexpected response',
      endpoint: graphqlUrl,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
      endpoint: graphqlUrl,
    }
  }
}

export async function testAllConnections() {
  const results = {
    rest: await testRESTConnection(),
    graphql: await testGraphQLConnection(),
  }
  
  console.group('🔌 API Connection Test Results')
  console.log('REST API:', results.rest.success ? '✅' : '❌', results.rest.message)
  console.log('  └─ Endpoint:', results.rest.endpoint)
  console.log('GraphQL API:', results.graphql.success ? '✅' : '❌', results.graphql.message)
  console.log('  └─ Endpoint:', results.graphql.endpoint)
  console.groupEnd()
  
  return results
}
