import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { routerService } from '../services/router.service';
import type { RouterInput } from '../types';

export function useRouters() {
  return useQuery({ queryKey: ['routers'], queryFn: () => routerService.list() });
}

export function useRouterMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['routers'] });

  const create = useMutation({ mutationFn: (i: RouterInput) => routerService.create(i), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RouterInput> }) => routerService.update(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => routerService.remove(id), onSuccess: invalidate });

  return { create, update, remove };
}
