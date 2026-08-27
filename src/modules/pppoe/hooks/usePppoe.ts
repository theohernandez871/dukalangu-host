import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pppoeService, type PppoePlanInput, type PppoeCustomerInput, type PppoeCustomerStatus } from '../services/pppoe.service';

export function usePppoePlans() {
  return useQuery({ queryKey: ['pppoe-plans'], queryFn: () => pppoeService.listPlans() });
}
export function usePppoeCustomers() {
  return useQuery({ queryKey: ['pppoe-customers'], queryFn: () => pppoeService.listCustomers() });
}

export function usePppoeMutations() {
  const qc = useQueryClient();
  const plans = () => qc.invalidateQueries({ queryKey: ['pppoe-plans'] });
  const custs = () => qc.invalidateQueries({ queryKey: ['pppoe-customers'] });
  return {
    createPlan: useMutation({ mutationFn: (i: PppoePlanInput) => pppoeService.createPlan(i), onSuccess: plans }),
    removePlan: useMutation({ mutationFn: (id: string) => pppoeService.removePlan(id), onSuccess: plans }),
    createCustomer: useMutation({ mutationFn: (i: PppoeCustomerInput) => pppoeService.createCustomer(i), onSuccess: custs }),
    setStatus: useMutation({ mutationFn: (a: { id: string; status: PppoeCustomerStatus }) => pppoeService.setCustomerStatus(a.id, a.status), onSuccess: custs }),
    removeCustomer: useMutation({ mutationFn: (id: string) => pppoeService.removeCustomer(id), onSuccess: custs }),
  };
}
