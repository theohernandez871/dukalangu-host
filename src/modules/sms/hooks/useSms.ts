import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { smsService, type AnnouncementInput } from '../services/sms.service';

export function useAnnouncements() {
  return useQuery({ queryKey: ['announcements'], queryFn: () => smsService.listAnnouncements() });
}
export function useSmsHistory() {
  return useQuery({ queryKey: ['sms-history'], queryFn: () => smsService.history() });
}
export function useSmsBalance() {
  return useQuery({ queryKey: ['sms-balance'], queryFn: () => smsService.balance() });
}
export function useAnnouncementMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['announcements'] });
  return {
    create: useMutation({ mutationFn: (i: AnnouncementInput) => smsService.createAnnouncement(i), onSuccess: done }),
    remove: useMutation({ mutationFn: (id: string) => smsService.removeAnnouncement(id), onSuccess: done }),
  };
}
