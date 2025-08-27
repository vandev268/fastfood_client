import http from '@/lib/http'
import type { StatisticsQueryType, StatisticsResType } from '@/schemaValidations/statistics.schema'

const statisticsApis = {
  getDashboardStatistics: (query: StatisticsQueryType) =>
    http.get<StatisticsResType>('/statistics/dashboard', {
      params: query
    })
}

export default statisticsApis
