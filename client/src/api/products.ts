import { api } from './client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const KEYS = { all: ['products'] as const, list: (filters: any) => ['products', filters] as const }

const parseProducts = (products: any[]) => products.map(p => ({
  ...p,
  purchasePrice: Number(p.purchasePrice) || 0,
  sellingPrice: Number(p.sellingPrice) || 0,
  currentStock: Number(p.currentStock) || 0,
  reorderLevel: Number(p.reorderLevel) || 0,
  reorderQuantity: Number(p.reorderQuantity) || 0
}));

export const useProducts = (filters = {}) =>
  useQuery({ queryKey: KEYS.list(filters), queryFn: async () => parseProducts(await api.get<any[]>('/products?' + new URLSearchParams(filters))) })

export const useProduct = (id: string) =>
  useQuery({ queryKey: ['products', id], queryFn: async () => parseProducts([await api.get<any>(`/products/${id}`)])[0], enabled: !!id })

export const useCreateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/products', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useUpdateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/products/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useDeleteProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
