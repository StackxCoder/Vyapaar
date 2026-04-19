import { api } from './client'
import { useQuery } from '@tanstack/react-query'

export const usePLReport = (year: number, month: number) =>
  useQuery({ 
    queryKey: ['reports', 'pl', year, month], 
    queryFn: () => api.get<any>(`/reports/pl/${year}/${month}`),
    enabled: !!year && !!month
  })

export const useUdhaarAging = () =>
  useQuery({ 
    queryKey: ['reports', 'udhaar-aging'], 
    queryFn: () => api.get<any[]>('/reports/udhaar-aging') 
  })
