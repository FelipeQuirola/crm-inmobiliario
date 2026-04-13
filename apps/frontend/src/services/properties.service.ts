import { api } from '@/lib/api';
import type {
  Property,
  PropertyDetail,
  PropertiesListResponse,
  CreatePropertyInput,
  ListPropertiesParams,
  LeadPropertyLink,
} from '@/types';

export const propertiesService = {
  list(params?: ListPropertiesParams): Promise<PropertiesListResponse> {
    return api.get('/properties', { params }).then((r) => r.data);
  },

  findOne(id: string): Promise<PropertyDetail> {
    return api.get(`/properties/${id}`).then((r) => r.data);
  },

  create(data: CreatePropertyInput): Promise<Property> {
    return api.post('/properties', data).then((r) => r.data);
  },

  update(id: string, data: Partial<CreatePropertyInput>): Promise<Property> {
    return api.patch(`/properties/${id}`, data).then((r) => r.data);
  },

  changeStatus(id: string, status: string): Promise<Property> {
    return api.patch(`/properties/${id}/status`, { status }).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/properties/${id}`);
  },

  linkLead(propertyId: string, leadId: string, notes?: string): Promise<unknown> {
    return api.post(`/properties/${propertyId}/leads`, { leadId, notes }).then((r) => r.data);
  },

  unlinkLead(propertyId: string, leadId: string): Promise<void> {
    return api.delete(`/properties/${propertyId}/leads/${leadId}`);
  },

  getLeadProperties(leadId: string): Promise<LeadPropertyLink[]> {
    return api.get(`/leads/${leadId}/properties`).then((r) => r.data);
  },

  uploadImages(propertyId: string, files: File[], onProgress?: (pct: number) => void): Promise<Property> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.post(`/properties/${propertyId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }).then((r) => r.data as Property);
  },

  deleteImage(propertyId: string, imageUrl: string): Promise<Property> {
    return api.delete(`/properties/${propertyId}/images`, { data: { imageUrl } }).then((r) => r.data as Property);
  },

  downloadPdf(propertyId: string, agentId?: string): Promise<Blob> {
    const params = agentId ? { agentId } : {};
    return api
      .get(`/properties/${propertyId}/pdf`, { params, responseType: 'blob' })
      .then((r) => new Blob([r.data as BlobPart], { type: 'application/pdf' }));
  },
};
