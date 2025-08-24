import { apiClient, handleApiResponse } from './client'
import { CodeExecution, CodeExecutionResult, APIResponse } from '@shared/types'

export const executionApi = {
  async runCode(codeExecution: CodeExecution): Promise<CodeExecutionResult> {
    const response: APIResponse<CodeExecutionResult> = await apiClient.post('/execution/run', codeExecution)
    return handleApiResponse(response)
  }
}