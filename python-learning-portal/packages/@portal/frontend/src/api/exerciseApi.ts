import { apiClient, handleApiResponse } from './client'
import { Exercise, APIResponse, Hint } from '@portal/types'

export const exerciseApi = {
  async getAllExercises(): Promise<Exercise[]> {
    const response: APIResponse<Exercise[]> = await apiClient.get('/exercises')
    return handleApiResponse(response)
  },

  async getExercise(exerciseId: string): Promise<Exercise> {
    const response: APIResponse<Exercise> = await apiClient.get(`/exercises/${exerciseId}`)
    return handleApiResponse(response)
  },

  async getHints(exerciseId: string): Promise<Hint[]> {
    const response: APIResponse<Hint[]> = await apiClient.get(`/exercises/${exerciseId}/hints`)
    return handleApiResponse(response)
  }
}