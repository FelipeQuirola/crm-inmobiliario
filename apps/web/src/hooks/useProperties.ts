import { useQuery } from '@tanstack/react-query';
import { api, buildQuery, SLUG } from '@/api/client';
import type { PublicProperty, ListPropertiesResult, PropertyType, SearchResult } from '@/types';

export type { SearchResult };

export interface ListPropertiesParams {
  type?: PropertyType | '';
  search?: string;
  city?: string;
  sector?: string;
  priceMin?: number | '';
  priceMax?: number | '';
  bedroomsMin?: number | '';
  skip?: number;
  take?: number;
}

export function useProperties(params: ListPropertiesParams = {}) {
  return useQuery({
    queryKey: ['public-properties', params],
    queryFn: async () => {
      const q = buildQuery({
        type:        params.type || undefined,
        search:      params.search || undefined,
        city:        params.city || undefined,
        sector:      params.sector || undefined,
        priceMin:    params.priceMin || undefined,
        priceMax:    params.priceMax || undefined,
        bedroomsMin: params.bedroomsMin || undefined,
        skip:        params.skip ?? 0,
        take:        params.take ?? 12,
      });
      const res = await api.get<ListPropertiesResult>(`/public/properties?${q}`);
      return res.data;
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['public-property', id],
    queryFn: async () => {
      const q = buildQuery({});
      const res = await api.get<PublicProperty>(`/public/properties/${id}?${q}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function usePropertySearch(query: string) {
  return useQuery({
    queryKey: ['public-property-search', query],
    queryFn: async () => {
      const q = new URLSearchParams({ slug: SLUG, q: query }).toString();
      const res = await api.get<SearchResult>(`/public/properties/search?${q}`);
      return res.data;
    },
    enabled: query.trim().length >= 2,
  });
}
