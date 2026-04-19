import { api } from './client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const KEYS = { all: ['payments'] as const, list: (filters: any) => ['payments', filters] as const }

const parsePayments = (payments: any[]) => payments.map(p => ({
  ...p,
  amount: Number(p.amount) || 0
}));

export const usePayments = (filters = {}) =>
  useQuery({ queryKey: KEYS.list(filters), queryFn: async () => parsePayments(await api.get<any[]>('/payments?' + new URLSearchParams(filters))) })

export const usePayment = (id: string) =>
  useQuery({ queryKey: ['payments', id], queryFn: async () => parsePayments([await api.get<any>(`/payments/${id}`)])[0], enabled: !!id })

export const useCreatePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/payments', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useUpdatePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/payments/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useDeletePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/payments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
