import { apiClient, handleApiResponse } from './client'
import { UserProgress, APIResponse } from '@shared/types'

export const progressApi = {
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    const response: APIResponse<UserProgress[]> = await apiClient.get(`/progress/${userId}`)
    return handleApiResponse(response)
  },

  async getExerciseProgress(userId: string, exerciseId: string): Promise<UserProgress> {
    const response: APIResponse<UserProgress> = await apiClient.get(`/progress/${userId}/${exerciseId}`)
    return handleApiResponse(response)
  },

  async updateProgress(
    userId: string, 
    exerciseId: string, 
    data: {
      completed?: boolean
      solution?: string
      timeSpent?: number
    }
  ): Promise<UserProgress> {
    const response: APIResponse<UserProgress> = await apiClient.post(
      `/progress/${userId}/${exerciseId}`, 
      data
    )
    return handleApiResponse(response)
  }
}