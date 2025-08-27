import statisticsApis from '@/apis/statistics'
import type { StatisticsQueryType } from '@/schemaValidations/statistics.schema'
import { useQuery } from '@tanstack/react-query'

export const useStatisticsQuery = (query: StatisticsQueryType) => {
  return useQuery({
    queryKey: ['statistics', 'dashboard', query],
    queryFn: () => statisticsApis.getDashboardStatistics(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}
