import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { propertiesService } from '@/services/properties.service';
import type { CreatePropertyInput, ListPropertiesParams } from '@/types';

const PROPERTIES_KEY = 'properties';

// ─── List (infinite) ──────────────────────────────────────────────────────────

export function useProperties(params?: Omit<ListPropertiesParams, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [PROPERTIES_KEY, params],
    queryFn: ({ pageParam }) =>
      propertiesService.list({ ...params, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function useProperty(id: string) {
  return useQuery({
    queryKey: [PROPERTIES_KEY, id],
    queryFn: () => propertiesService.findOne(id),
    enabled: !!id,
  });
}

// ─── Lead properties ──────────────────────────────────────────────────────────

export function useLeadProperties(leadId: string) {
  return useQuery({
    queryKey: ['leadProperties', leadId],
    queryFn: () => propertiesService.getLeadProperties(leadId),
    enabled: !!leadId,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePropertyInput) => propertiesService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY] });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreatePropertyInput>) => propertiesService.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY, id] });
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY] });
    },
  });
}

// ─── Change status ────────────────────────────────────────────────────────────

export function useChangePropertyStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => propertiesService.changeStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY, id] });
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY] });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propertiesService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY] });
    },
  });
}

// ─── Link / unlink lead ───────────────────────────────────────────────────────

export function useLinkLead(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, notes }: { leadId: string; notes?: string }) =>
      propertiesService.linkLead(propertyId, leadId, notes),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY, propertyId] });
      void qc.invalidateQueries({ queryKey: ['leadProperties', variables.leadId] });
    },
  });
}

export function useUnlinkLead(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => propertiesService.unlinkLead(propertyId, leadId),
    onSuccess: (_data, leadId) => {
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY, propertyId] });
      void qc.invalidateQueries({ queryKey: ['leadProperties', leadId] });
    },
  });
}

export function useUnlinkProperty(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId }: { propertyId: string }) =>
      propertiesService.unlinkLead(propertyId, leadId),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['leadProperties', leadId] });
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY, variables.propertyId] });
    },
  });
}

// ─── Image upload / delete ────────────────────────────────────────────────────

export function useUploadImages(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ files, onProgress }: { files: File[]; onProgress?: (pct: number) => void }) =>
      propertiesService.uploadImages(propertyId, files, onProgress),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY, propertyId] });
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY] });
    },
  });
}

export function useDeleteImage(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageUrl: string) => propertiesService.deleteImage(propertyId, imageUrl),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY, propertyId] });
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY] });
    },
  });
}

export function useLinkProperty(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, notes }: { propertyId: string; notes?: string }) =>
      propertiesService.linkLead(propertyId, leadId, notes),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['leadProperties', leadId] });
      void qc.invalidateQueries({ queryKey: [PROPERTIES_KEY, variables.propertyId] });
    },
  });
}
