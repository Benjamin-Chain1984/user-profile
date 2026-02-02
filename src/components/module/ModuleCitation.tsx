/**
 * ModuleCitation - Standardized clinical citation footer for modules
 */

interface ModuleCitationProps {
  title: string;
  source?: string;
  citation: string;
}

export function ModuleCitation({ title, source, citation }: ModuleCitationProps) {
  return (
    <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
      <p className="font-medium">{title}</p>
      {source && <p>{source}</p>}
      <p className="italic">{citation}</p>
    </div>
  );
}
