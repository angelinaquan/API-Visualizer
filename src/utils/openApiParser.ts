import type { ApiSpec, Endpoint, Parameter, Schema, SchemaRef, Response, HttpMethod, SecurityScheme, RequestBody } from '@/types/api'
import yaml from 'js-yaml'

interface OpenAPISpec {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{ url: string; description?: string }>
  paths: Record<string, PathItem>
  components?: {
    schemas?: Record<string, OpenAPISchema>
    securitySchemes?: Record<string, OpenAPISecurityScheme>
  }
  tags?: Array<{ name: string; description?: string }>
}

interface PathItem {
  get?: Operation
  post?: Operation
  put?: Operation
  patch?: Operation
  delete?: Operation
  options?: Operation
  head?: Operation
  parameters?: OpenAPIParameter[]
}

interface Operation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  parameters?: OpenAPIParameter[]
  requestBody?: {
    description?: string
    required?: boolean
    content?: Record<string, { schema?: OpenAPISchema; example?: unknown }>
  }
  responses?: Record<string, {
    description: string
    content?: Record<string, { schema?: OpenAPISchema; example?: unknown }>
  }>
  security?: Array<Record<string, string[]>>
  deprecated?: boolean
}

interface OpenAPIParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  description?: string
  required?: boolean
  schema?: OpenAPISchema
  example?: unknown
}

interface OpenAPISchema {
  type?: string
  format?: string
  description?: string
  properties?: Record<string, OpenAPISchema>
  items?: OpenAPISchema
  required?: string[]
  enum?: unknown[]
  example?: unknown
  $ref?: string
  nullable?: boolean
  oneOf?: OpenAPISchema[]
  anyOf?: OpenAPISchema[]
  allOf?: OpenAPISchema[]
}

interface OpenAPISecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  in?: 'header' | 'query' | 'cookie'
  name?: string
  scheme?: string
  bearerFormat?: string
  description?: string
}

export async function parseOpenApiSpec(input: string | object): Promise<ApiSpec> {
  let spec: OpenAPISpec
  
  if (typeof input === 'string') {
    // Try to parse as JSON first, then YAML
    try {
      spec = JSON.parse(input)
    } catch {
      try {
        spec = yaml.load(input) as OpenAPISpec
      } catch (e) {
        throw new Error('Failed to parse spec: Invalid JSON or YAML')
      }
    }
  } else {
    spec = input as OpenAPISpec
  }
  
  // Validate it's an OpenAPI spec
  if (!spec.openapi && !spec.swagger) {
    throw new Error('Invalid OpenAPI specification: missing openapi or swagger version')
  }
  
  // Parse endpoints
  const endpoints: Endpoint[] = []
  const methods: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']
  
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    const pathParams = pathItem.parameters || []
    
    for (const method of methods) {
      const operation = pathItem[method]
      if (!operation) continue
      
      const allParams = [...pathParams, ...(operation.parameters || [])]
      
      endpoints.push({
        id: `${method}-${path}`,
        path,
        method,
        summary: operation.summary,
        description: operation.description,
        tags: operation.tags || ['default'],
        parameters: allParams.map(parseParameter),
        requestBody: parseRequestBody(operation.requestBody),
        responses: parseResponses(operation.responses),
        security: operation.security?.map(s => Object.keys(s)[0]),
        deprecated: operation.deprecated,
      })
    }
  }
  
  // Parse schemas
  const schemas: Schema[] = []
  for (const [name, schema] of Object.entries(spec.components?.schemas || {})) {
    schemas.push(parseSchema(name, schema))
  }
  
  // Parse security schemes
  const securitySchemes: SecurityScheme[] = []
  for (const [name, scheme] of Object.entries(spec.components?.securitySchemes || {})) {
    securitySchemes.push({
      name,
      type: scheme.type,
      in: scheme.in,
      scheme: scheme.scheme,
      bearerFormat: scheme.bearerFormat,
      description: scheme.description,
    })
  }
  
  return {
    title: spec.info.title,
    version: spec.info.version,
    description: spec.info.description,
    servers: spec.servers,
    endpoints,
    schemas,
    tags: spec.tags || extractTags(endpoints),
    securitySchemes,
  }
}

function parseParameter(param: OpenAPIParameter): Parameter {
  return {
    name: param.name,
    in: param.in,
    description: param.description,
    required: param.required || param.in === 'path',
    schema: parseSchemaRef(param.schema),
    example: param.example,
  }
}

function parseRequestBody(body?: Operation['requestBody']): RequestBody | undefined {
  if (!body) return undefined
  
  const content: Record<string, { schema: SchemaRef; example?: unknown }> = {}
  for (const [mediaType, mediaContent] of Object.entries(body.content || {})) {
    content[mediaType] = {
      schema: parseSchemaRef(mediaContent.schema),
      example: mediaContent.example,
    }
  }
  
  return {
    description: body.description,
    required: body.required || false,
    content,
  }
}

function parseResponses(responses?: Record<string, { description: string; content?: Record<string, { schema?: OpenAPISchema; example?: unknown }> }>): Response[] {
  if (!responses) return []
  
  return Object.entries(responses).map(([statusCode, response]) => {
    const content: Record<string, { schema: SchemaRef; example?: unknown }> = {}
    for (const [mediaType, mediaContent] of Object.entries(response.content || {})) {
      content[mediaType] = {
        schema: parseSchemaRef(mediaContent.schema),
        example: mediaContent.example,
      }
    }
    
    return {
      statusCode,
      description: response.description,
      content: Object.keys(content).length > 0 ? content : undefined,
    }
  })
}

function parseSchemaRef(schema?: OpenAPISchema): SchemaRef {
  if (!schema) return { type: 'object' }
  
  return {
    type: schema.type,
    $ref: schema.$ref,
    format: schema.format,
    description: schema.description,
    enum: schema.enum,
    items: schema.items ? parseSchemaRef(schema.items) : undefined,
    properties: schema.properties 
      ? Object.fromEntries(
          Object.entries(schema.properties).map(([k, v]) => [k, parseSchemaRef(v)])
        )
      : undefined,
    required: schema.required,
    example: schema.example,
    nullable: schema.nullable,
    oneOf: schema.oneOf?.map(parseSchemaRef),
    anyOf: schema.anyOf?.map(parseSchemaRef),
    allOf: schema.allOf?.map(parseSchemaRef),
  }
}

function parseSchema(name: string, schema: OpenAPISchema): Schema {
  return {
    name,
    type: (schema.type as Schema['type']) || 'object',
    description: schema.description,
    properties: schema.properties 
      ? Object.fromEntries(
          Object.entries(schema.properties).map(([k, v]) => [k, parseSchemaRef(v)])
        )
      : undefined,
    items: schema.items ? parseSchemaRef(schema.items) : undefined,
    required: schema.required,
    enum: schema.enum,
    format: schema.format,
    example: schema.example,
  }
}

function extractTags(endpoints: Endpoint[]): { name: string; description?: string }[] {
  const tagSet = new Set<string>()
  endpoints.forEach(e => e.tags.forEach(t => tagSet.add(t)))
  return Array.from(tagSet).map(name => ({ name }))
}

// Fetch and parse spec from URL
export async function fetchAndParseSpec(url: string): Promise<ApiSpec> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch spec: ${response.statusText}`)
  }
  const text = await response.text()
  return parseOpenApiSpec(text)
}
