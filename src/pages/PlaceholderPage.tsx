import { Card } from '@/components/ui/Card';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <Card className="flex h-64 items-center justify-center p-8 text-sm text-slate-400">
        Moduli hii itajengwa katika awamu zinazofuata.
      </Card>
    </div>
  );
}
