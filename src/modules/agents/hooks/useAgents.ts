import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentService, type AgentInput } from '../services/agent.service';

export function useAgents() {
  return useQuery({ queryKey: ['agents'], queryFn: () => agentService.list() });
}
export function useAgentMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['agents'] });
  return {
    create: useMutation({ mutationFn: (i: AgentInput) => agentService.create(i), onSuccess: done }),
    update: useMutation({ mutationFn: (a: { id: string; input: Partial<AgentInput> }) => agentService.update(a.id, a.input), onSuccess: done }),
    setActive: useMutation({ mutationFn: (a: { id: string; active: boolean }) => agentService.setActive(a.id, a.active), onSuccess: done }),
    remove: useMutation({ mutationFn: (id: string) => agentService.remove(id), onSuccess: done }),
  };
}
