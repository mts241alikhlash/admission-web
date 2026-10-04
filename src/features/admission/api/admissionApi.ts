import api from '@mts241alikhlash/web-shared/utils/api'
import type {
  ApiPaginatedResponse,
  ApiSingleResponse,
} from '@mts241alikhlash/web-shared/types/api'
import type {
  ActiveWaves,
  AdmissionBankAccount,
  BankAccountSavePayload,
  AdmissionAcademicYear,
  AdmissionAcceptedApplication,
  AdmissionAnnouncement,
  AdmissionApplication,
  AdmissionApplicationDecision,
  AdmissionApplicationForm,
  AdmissionApplicationListItem,
  AdmissionApplicationReview,
  AdmissionAttachmentUpload,
  AdmissionDocumentUpload,
  AdmissionEnrolledApplication,
  AdmissionFormOptions,
  AdmissionNotification,
  AdmissionNotificationList,
  AdmissionNotificationsRead,
  AdmissionPaymentUpload,
  AdmissionRegisteredApplicant,
  AdmissionStats,
  AdmissionWave,
  AdmissionWaveSummary,
  AnnouncementSavePayload,
  PublicRegisterPayload,
  RegionNode,
  RegisterPayload,
  UpdateApplicationPayload,
  WaveSavePayload,
} from '../types'

export const admissionApi = {
  getActiveWaves: () =>
    api.get<ApiSingleResponse<ActiveWaves>>('/admissions/waves/active'),

  register: (payload: PublicRegisterPayload) =>
    api.post<ApiSingleResponse<AdmissionRegisteredApplicant>>(
      '/admissions/register',
      payload,
    ),

  adminRegisterApplicant: (payload: RegisterPayload) =>
    api.post<ApiSingleResponse<AdmissionRegisteredApplicant>>(
      '/admissions/applications',
      payload,
    ),

  adminUpdateApplication: (id: string, payload: UpdateApplicationPayload) =>
    api.patch<ApiSingleResponse<AdmissionApplicationForm>>(
      `/admissions/applications/${id}/form`,
      payload,
    ),

  adminSubmitApplication: (id: string) =>
    api.post<ApiSingleResponse<AdmissionApplicationForm>>(
      `/admissions/applications/${id}/submit`,
    ),

  adminUploadDocument: (id: string, typeCode: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.put<ApiSingleResponse<AdmissionDocumentUpload>>(
      `/admissions/applications/${id}/documents/${typeCode}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },

  adminUploadPaymentProof: (
    id: string,
    payload: {
      bankName: string
      bankAccountId: string
      senderAccountName: string
      transferDate?: string
    },
    file: File,
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bankName', payload.bankName)
    formData.append('bankAccountId', payload.bankAccountId)
    formData.append('senderAccountName', payload.senderAccountName)
    if (payload.transferDate) {
      formData.append('transferDate', payload.transferDate)
    }
    return api.put<ApiSingleResponse<AdmissionPaymentUpload>>(
      `/admissions/applications/${id}/payment`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },

  getFormOptions: () =>
    api.get<ApiSingleResponse<AdmissionFormOptions>>(
      '/admissions/form-options',
    ),

  uploadAttachment: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ApiSingleResponse<AdmissionAttachmentUpload>>(
      '/admissions/my-application/attachments',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },

  adminUploadAttachment: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ApiSingleResponse<AdmissionAttachmentUpload>>(
      `/admissions/applications/${id}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },

  getProvinces: () =>
    api.get<ApiSingleResponse<RegionNode[]>>('/regions/provinces'),

  getRegionChildren: (code: string) =>
    api.get<ApiSingleResponse<RegionNode[]>>(`/regions/${code}/children`),

  getMyApplication: () =>
    api.get<ApiSingleResponse<AdmissionApplication>>(
      '/admissions/my-application',
    ),

  ensureMyApplication: () =>
    api.post<ApiSingleResponse<AdmissionApplication>>(
      '/admissions/my-application/ensure',
    ),

  updateMyApplication: (payload: UpdateApplicationPayload) =>
    api.patch<ApiSingleResponse<AdmissionApplicationForm>>(
      '/admissions/my-application',
      payload,
    ),

  submitMyApplication: () =>
    api.post<ApiSingleResponse<AdmissionApplicationForm>>(
      '/admissions/my-application/submit',
    ),

  uploadDocument: (typeCode: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.put<ApiSingleResponse<AdmissionDocumentUpload>>(
      `/admissions/my-application/documents/${typeCode}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },

  uploadPaymentProof: (
    payload: {
      bankName: string
      bankAccountId: string
      senderAccountName: string
      transferDate?: string
    },
    file: File,
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bankName', payload.bankName)
    formData.append('bankAccountId', payload.bankAccountId)
    formData.append('senderAccountName', payload.senderAccountName)
    if (payload.transferDate) {
      formData.append('transferDate', payload.transferDate)
    }
    return api.put<ApiSingleResponse<AdmissionPaymentUpload>>(
      '/admissions/my-application/payment',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },

  getMyNotifications: () =>
    api.get<AdmissionNotificationList>(
      '/admissions/my-application/notifications',
    ),

  markNotificationRead: (id: string) =>
    api.patch<ApiSingleResponse<AdmissionNotification>>(
      `/admissions/notifications/${id}/read`,
    ),

  markAllNotificationsRead: () =>
    api.patch<ApiSingleResponse<AdmissionNotificationsRead>>(
      '/admissions/notifications/read-all',
    ),

  getAnnouncements: () =>
    api.get<ApiSingleResponse<AdmissionAnnouncement[]>>(
      '/admissions/announcements',
    ),

  getStats: (waveId?: string) =>
    api.get<ApiSingleResponse<AdmissionStats>>('/admissions/stats', {
      params: waveId ? { waveId } : undefined,
    }),

  getApplications: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    waveId?: string
  }) =>
    api.get<ApiPaginatedResponse<AdmissionApplicationListItem>>(
      '/admissions/applications',
      { params },
    ),

  getApplicationById: (id: string) =>
    api.get<ApiSingleResponse<AdmissionApplicationReview>>(
      `/admissions/applications/${id}`,
    ),

  verifyDocument: (
    applicationId: string,
    documentId: string,
    payload: { status: 'APPROVED' | 'REJECTED'; note?: string },
  ) =>
    api.patch<ApiSingleResponse<AdmissionDocumentUpload>>(
      `/admissions/applications/${applicationId}/documents/${documentId}/verify`,
      payload,
    ),

  verifyPayment: (
    applicationId: string,
    payload: { status: 'VERIFIED' | 'REJECTED'; note?: string },
  ) =>
    api.patch<ApiSingleResponse<AdmissionPaymentUpload>>(
      `/admissions/applications/${applicationId}/payment/verify`,
      payload,
    ),

  requestRevision: (applicationId: string, note: string) =>
    api.post<ApiSingleResponse<AdmissionApplicationDecision>>(
      `/admissions/applications/${applicationId}/request-revision`,
      { note },
    ),

  verifyApplication: (applicationId: string) =>
    api.post<ApiSingleResponse<AdmissionApplicationDecision>>(
      `/admissions/applications/${applicationId}/verify`,
    ),

  acceptApplication: (applicationId: string, note?: string) =>
    api.post<ApiSingleResponse<AdmissionAcceptedApplication>>(
      `/admissions/applications/${applicationId}/accept`,
      { note },
    ),

  rejectApplication: (applicationId: string, reason: string) =>
    api.post<ApiSingleResponse<AdmissionApplicationDecision>>(
      `/admissions/applications/${applicationId}/reject`,
      { reason },
    ),

  enrollApplicant: (
    applicationId: string,
    payload: {
      nis: string
      nisn: string
      gradeId?: string
      classroomId?: string
    },
  ) =>
    api.post<ApiSingleResponse<AdmissionEnrolledApplication>>(
      `/admissions/applications/${applicationId}/enroll`,
      payload,
    ),

  getAcademicYears: () =>
    api.get<ApiPaginatedResponse<AdmissionAcademicYear>>('/academic-years', {
      params: { limit: 100 },
    }),

  getWaves: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<ApiPaginatedResponse<AdmissionWaveSummary>>('/admissions/waves', {
      params,
    }),

  createWave: (payload: WaveSavePayload) =>
    api.post<ApiSingleResponse<AdmissionWave>>('/admissions/waves', payload),

  updateWave: (id: string, payload: Partial<WaveSavePayload>) =>
    api.patch<ApiSingleResponse<AdmissionWave>>(
      `/admissions/waves/${id}`,
      payload,
    ),

  deleteWave: (id: string) => api.delete<void>(`/admissions/waves/${id}`),

  getBankAccounts: () =>
    api.get<{ data: AdmissionBankAccount[] }>('/admissions/bank-accounts'),

  createBankAccount: (payload: BankAccountSavePayload) =>
    api.post<ApiSingleResponse<AdmissionBankAccount>>(
      '/admissions/bank-accounts',
      payload,
    ),

  updateBankAccount: (id: string, payload: Partial<BankAccountSavePayload>) =>
    api.patch<ApiSingleResponse<AdmissionBankAccount>>(
      `/admissions/bank-accounts/${id}`,
      payload,
    ),

  deleteBankAccount: (id: string) =>
    api.delete<void>(`/admissions/bank-accounts/${id}`),

  getManageAnnouncements: (params?: {
    page?: number
    limit?: number
    search?: string
  }) =>
    api.get<ApiPaginatedResponse<AdmissionAnnouncement>>(
      '/admissions/manage-announcements',
      { params },
    ),

  createAnnouncement: (payload: AnnouncementSavePayload) =>
    api.post<ApiSingleResponse<AdmissionAnnouncement>>(
      '/admissions/manage-announcements',
      payload,
    ),

  updateAnnouncement: (id: string, payload: Partial<AnnouncementSavePayload>) =>
    api.patch<ApiSingleResponse<AdmissionAnnouncement>>(
      `/admissions/manage-announcements/${id}`,
      payload,
    ),

  publishAnnouncement: (id: string) =>
    api.post<ApiSingleResponse<AdmissionAnnouncement>>(
      `/admissions/manage-announcements/${id}/publish`,
    ),

  deleteAnnouncement: (id: string) =>
    api.delete<void>(`/admissions/manage-announcements/${id}`),
}
