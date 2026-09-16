export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description?: string
    parameters: Record<string, unknown>
  }
}

export interface JsonSchemaResponseFormat {
  type: 'json_schema'
  json_schema: {
    name: string
    strict: true
    schema: Record<string, unknown>
  }
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  response_format?: JsonSchemaResponseFormat
  tools?: ToolDefinition[]
  tool_choice?: { type: 'function'; function: { name: string } }
  max_tokens?: number
}

export interface ChatCompletionToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: 'assistant'
      content: string | null
      tool_calls?: ChatCompletionToolCall[]
    }
    finish_reason: string
  }>
  error?: { message: string; code?: string | number }
}

export interface ImageGenerationRequest {
  model: string
  prompt: string
  n?: number
  aspect_ratio?: string
  output_format?: 'png' | 'jpeg' | 'webp' | 'svg'
}

export interface ImageGenerationResponse {
  data: Array<{
    b64_json: string
    media_type: string
  }>
  error?: { message: string; code?: string | number }
}
