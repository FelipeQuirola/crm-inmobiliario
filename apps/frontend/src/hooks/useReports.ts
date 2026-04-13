import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';

export const REPORTS_KEY = 'reports';

export function useOverviewReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [REPORTS_KEY, 'overview', startDate, endDate],
    queryFn:  () => reportsService.overview({ startDate, endDate }).then((r) => r.data),
    staleTime: 1000 * 60,
  });
}

export function useByStageReport() {
  return useQuery({
    queryKey: [REPORTS_KEY, 'by-stage'],
    queryFn:  () => reportsService.byStage().then((r) => r.data),
    staleTime: 1000 * 60,
  });
}

export function useBySourceReport() {
  return useQuery({
    queryKey: [REPORTS_KEY, 'by-source'],
    queryFn:  () => reportsService.bySource().then((r) => r.data),
    staleTime: 1000 * 60,
  });
}

export function useBySellerReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [REPORTS_KEY, 'by-seller', startDate, endDate],
    queryFn:  () => reportsService.bySeller({ startDate, endDate }).then((r) => r.data),
    staleTime: 1000 * 60,
  });
}

export function useTimelineReport(
  startDate?: string,
  endDate?: string,
  groupBy?: 'day' | 'week' | 'month',
) {
  return useQuery({
    queryKey: [REPORTS_KEY, 'timeline', startDate, endDate, groupBy],
    queryFn:  () => reportsService.timeline({ startDate, endDate, groupBy }).then((r) => r.data),
    staleTime: 1000 * 60,
  });
}
