import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Brain } from 'lucide-react';

export type PainTool = 'abbey' | 'painad';

interface PainToolSelectorProps {
  enabledTools: PainTool[];
  onSelect: (tool: PainTool) => void;
}

export function PainToolSelector({ enabledTools, onSelect }: PainToolSelectorProps) {
  const tools: { id: PainTool; title: string; icon: React.ReactNode; description: string; whenToUse: string; color: string }[] = [
    {
      id: 'abbey',
      title: 'Abbey Pain Scale',
      icon: <ClipboardList className="w-8 h-8" />,
      description: 'A 1-minute observational tool for assessing pain in people with end-stage dementia or those who cannot verbalise.',
      whenToUse: 'Use when the person has some communicative ability or shows behavioural indicators of pain during care activities.',
      color: 'border-success/50 hover:border-success hover:bg-success/5',
    },
    {
      id: 'painad',
      title: 'PAINAD Scale',
      icon: <Brain className="w-8 h-8" />,
      description: 'Pain Assessment in Advanced Dementia – a structured 5-item observational tool scoring 0–10.',
      whenToUse: 'Use when the person has advanced dementia and is unable to self-report pain. Ideal for consistent repeated assessments.',
      color: 'border-primary/50 hover:border-primary hover:bg-primary/5',
    },
  ];

  const visibleTools = tools.filter(t => enabledTools.includes(t.id));

  // If only one tool enabled, auto-select
  if (visibleTools.length === 1) {
    onSelect(visibleTools[0].id);
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Select Pain Assessment Tool</h2>
        <p className="text-muted-foreground mt-1">Choose the appropriate assessment for this observation</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {visibleTools.map((tool) => (
          <Card
            key={tool.id}
            className={`cursor-pointer transition-all border-2 ${tool.color}`}
            onClick={() => onSelect(tool.id)}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-primary">{tool.icon}</div>
                <h3 className="text-lg font-semibold">{tool.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground">When to use:</p>
                <p className="text-sm mt-1">{tool.whenToUse}</p>
              </div>
              <Button className="w-full" variant="outline">
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
