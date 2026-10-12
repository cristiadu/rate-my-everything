import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import type { ChangeRequest, ChangeRequestInput } from '@/components/types'

/** Submits a change request through the shared change request endpoint. */
export const createChangeRequest = (changeRequest: ChangeRequestInput): Promise<ChangeRequest> => (
  ApiService.post<ChangeRequest>(ApiConfig.ENDPOINTS.CHANGE_REQUESTS, changeRequest)
)
