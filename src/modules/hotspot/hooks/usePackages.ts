import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { packageService, type Package, type PackageInput } from '../services/package.service';

export function usePackages() {
  return useQuery({ queryKey: ['packages'], queryFn: () => packageService.list() });
}

export function usePackageMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['packages'] });
  return {
    create: useMutation({ mutationFn: (i: PackageInput) => packageService.create(i), onSuccess: done }),
    update: useMutation({ mutationFn: (a: { id: string; input: Partial<PackageInput> }) => packageService.update(a.id, a.input), onSuccess: done }),
    setActive: useMutation({ mutationFn: (a: { id: string; active: boolean }) => packageService.setActive(a.id, a.active), onSuccess: done }),
    duplicate: useMutation({ mutationFn: (p: Package) => packageService.duplicate(p), onSuccess: done }),
    remove: useMutation({ mutationFn: (id: string) => packageService.remove(id), onSuccess: done }),
  };
}
