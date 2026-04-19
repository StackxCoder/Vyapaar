import { api } from './client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const KEYS = { all: ['sales'] as const, list: (filters: any) => ['sales', filters] as const }

const parseSales = (sales: any[]) => sales.map(s => ({
  ...s,
  subtotal: Number(s.subtotal) || 0,
  discount: Number(s.discount) || 0,
  total: Number(s.total) || 0,
  cashReceived: Number(s.cashReceived) || 0,
  creditAmount: Number(s.creditAmount) || 0
}));

export const useSales = (filters = {}) =>
  useQuery({ queryKey: KEYS.list(filters), queryFn: async () => parseSales(await api.get<any[]>('/sales?' + new URLSearchParams(filters))) })

export const useSale = (id: string) =>
  useQuery({ queryKey: ['sales', id], queryFn: async () => parseSales([await api.get<any>(`/sales/${id}`)])[0], enabled: !!id })

export const useCreateSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/sales', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useUpdateSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/sales/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useDeleteSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sales/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
