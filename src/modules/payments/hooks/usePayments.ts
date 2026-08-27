import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService, type PaymentInput, type PaymentStatus } from '../services/payment.service';

export function usePayments(status?: PaymentStatus) {
  return useQuery({ queryKey: ['payments', status ?? 'all'], queryFn: () => paymentService.list(status) });
}
export function useRevenueSummary() {
  return useQuery({ queryKey: ['revenue-summary'], queryFn: () => paymentService.summary() });
}
export function usePaymentMutations() {
  const qc = useQueryClient();
  const done = () => {
    qc.invalidateQueries({ queryKey: ['payments'] });
    qc.invalidateQueries({ queryKey: ['revenue-summary'] });
  };
  return {
    record: useMutation({ mutationFn: (i: PaymentInput) => paymentService.record(i), onSuccess: done }),
    setStatus: useMutation({ mutationFn: (a: { id: string; status: PaymentStatus }) => paymentService.setStatus(a.id, a.status), onSuccess: done }),
  };
}
