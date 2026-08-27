import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { voucherService, type GenerateInput, type VoucherStatus } from '../services/voucher.service';

export function useVouchers(status?: VoucherStatus) {
  return useQuery({ queryKey: ['vouchers', status ?? 'all'], queryFn: () => voucherService.list(status) });
}

export function useVoucherMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['vouchers'] });
  return {
    generate: useMutation({ mutationFn: (i: GenerateInput) => voucherService.generate(i), onSuccess: done }),
    cancel: useMutation({ mutationFn: (id: string) => voucherService.cancel(id), onSuccess: done }),
  };
}
