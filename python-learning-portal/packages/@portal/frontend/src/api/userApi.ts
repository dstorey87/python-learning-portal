import { apiClient, handleApiResponse } from './client'
import { User, APIResponse } from '@portal/types'

export const userApi = {
  async createOrGetUser(username: string, email?: string): Promise<User> {
    const response: APIResponse<User> = await apiClient.post('/users', {
      username,
      email
    })
    return handleApiResponse(response)
  },

  async getUser(userId: string): Promise<User> {
    const response: APIResponse<User> = await apiClient.get(`/users/${userId}`)
    return handleApiResponse(response)
  }
}