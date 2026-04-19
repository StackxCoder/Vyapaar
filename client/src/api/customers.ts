import { api } from './client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const KEYS = { all: ['customers'] as const, list: (filters: any) => ['customers', filters] as const }

const parseCustomers = (customers: any[]) => customers.map(c => ({
  ...c,
  udhaar: Number(c.udhaar) || 0,
  creditLimit: Number(c.creditLimit) || 0,
  customDiscountPercent: Number(c.customDiscountPercent) || 0
}));

export const useCustomers = (filters = {}) =>
  useQuery({ queryKey: KEYS.list(filters), queryFn: async () => parseCustomers(await api.get<any[]>('/customers?' + new URLSearchParams(filters))) })

export const useCustomer = (id: string) =>
  useQuery({ queryKey: ['customers', id], queryFn: async () => parseCustomers([await api.get<any>(`/customers/${id}`)])[0], enabled: !!id })

export const useCustomerLedger = (id: string) =>
  useQuery({ queryKey: ['customers', id, 'ledger'], queryFn: () => api.get<any>(`/customers/${id}/ledger`), enabled: !!id })

export const useCreateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/customers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useUpdateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/customers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useDeleteCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
