// Unified API Model - supports OpenAPI, GraphQL, etc.

export interface ApiSpec {
  title: string
  version: string
  description?: string
  servers?: Server[]
  endpoints: Endpoint[]
  schemas: Schema[]
  tags: Tag[]
  securitySchemes?: SecurityScheme[]
}

export interface Server {
  url: string
  description?: string
}

export interface Tag {
  name: string
  description?: string
}

export interface Endpoint {
  id: string
  path: string
  method: HttpMethod
  summary?: string
  description?: string
  tags: string[]
  parameters: Parameter[]
  requestBody?: RequestBody
  responses: Response[]
  security?: string[]
  deprecated?: boolean
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'

export interface Parameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  description?: string
  required: boolean
  schema: SchemaRef
  example?: unknown
}

export interface RequestBody {
  description?: string
  required: boolean
  content: Record<string, MediaType>
}

export interface MediaType {
  schema: SchemaRef
  example?: unknown
}

export interface Response {
  statusCode: string
  description: string
  content?: Record<string, MediaType>
}

export interface Schema {
  name: string
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null'
  description?: string
  properties?: Record<string, SchemaRef>
  items?: SchemaRef
  required?: string[]
  enum?: unknown[]
  format?: string
  example?: unknown
}

export interface SchemaRef {
  type?: string
  $ref?: string
  format?: string
  description?: string
  enum?: unknown[]
  items?: SchemaRef
  properties?: Record<string, SchemaRef>
  required?: string[]
  example?: unknown
  nullable?: boolean
  oneOf?: SchemaRef[]
  anyOf?: SchemaRef[]
  allOf?: SchemaRef[]
}

export interface SecurityScheme {
  name: string
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  in?: 'header' | 'query' | 'cookie'
  scheme?: string
  bearerFormat?: string
  description?: string
}

// Request/Response for Try It Out
export interface ApiRequest {
  url: string
  method: HttpMethod
  headers: Record<string, string>
  body?: string
  params: Record<string, string>
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  duration: number
  size: number
}
