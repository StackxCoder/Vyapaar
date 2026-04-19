import { api } from './client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const KEYS = { all: ['batches'] as const, list: (filters: any) => ['batches', filters] as const }

export const useBatches = (filters = {}) =>
  useQuery({ queryKey: KEYS.list(filters), queryFn: () => api.get<any[]>('/batches?' + new URLSearchParams(filters)) })

export const useBatch = (id: string) =>
  useQuery({ queryKey: ['batches', id], queryFn: () => api.get<any>(`/batches/${id}`), enabled: !!id })

export const useCreateBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/batches', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useUpdateBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/batches/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useDeleteBatch = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/batches/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
