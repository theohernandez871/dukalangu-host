import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService, type CustomerInput } from '../services/customer.service';

export function useCustomers(search?: string) {
  return useQuery({ queryKey: ['customers', search ?? ''], queryFn: () => customerService.list(search) });
}

export function useCustomerMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['customers'] });
  return {
    create: useMutation({ mutationFn: (i: CustomerInput) => customerService.create(i), onSuccess: done }),
    update: useMutation({ mutationFn: (a: { id: string; input: Partial<CustomerInput> }) => customerService.update(a.id, a.input), onSuccess: done }),
    remove: useMutation({ mutationFn: (id: string) => customerService.remove(id), onSuccess: done }),
  };
}
