import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

export function ChartCard({ title, icon: Icon, children }: ChartCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium sm:text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">{children}</CardContent>
    </Card>
  );
}
