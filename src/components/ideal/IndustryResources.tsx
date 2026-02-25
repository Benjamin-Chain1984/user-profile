import { ExternalLink, BookOpen, FileText, Shield, Heart } from 'lucide-react';

const resources = [
{
  category: 'Clinical Guidelines',
  icon: BookOpen,
  items: [
  { name: 'NICE Guidelines', description: 'National Institute for Health and Care Excellence', url: 'https://www.nice.org.uk' },
  { name: 'NHS Clinical Standards', description: 'National Health Service quality standards', url: 'https://www.nhs.uk' }]

},
{
  category: 'Care Quality',
  icon: Shield,
  items: [
  { name: 'CQC Resources', description: 'Care Quality Commission guidance', url: 'https://www.cqc.org.uk' },
  { name: 'Skills for Care', description: 'Workforce development resources', url: 'https://www.skillsforcare.org.uk' }]

},
{
  category: 'Health Monitoring',
  icon: Heart,
  items: [
  { name: 'IDDSI Framework', description: 'International Dysphagia Diet Standardisation', url: 'https://iddsi.org' },
  { name: 'Malnutrition Universal Screening', description: 'MUST screening tool resources', url: 'https://www.bapen.org.uk' }]

},
{
  category: 'Documentation & Records',
  icon: FileText,
  items: [
  { name: 'Record Keeping Standards', description: 'Professional documentation guidelines', url: '#' },
  { name: 'Data Protection in Care', description: 'GDPR and care sector guidance', url: 'https://ico.org.uk' }]

}];


export function IndustryResources() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Key Industry Resources</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Essential guidelines, frameworks, and standards for health and care professionals.
        </p>
      </div>

      <div className="space-y-6">
        {resources.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-foreground">{section.category}</h3>
              </div>
              
              <div className="grid gap-3">
                {section.items.map((item) =>
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all group">

                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                )}
              </div>
            </div>);

        })}
      </div>

      <div className="p-4 bg-muted/50 rounded-xl border border-border">
        <p className="text-sm text-muted-foreground">Disclaimer: These resources are provided for information only.
          <strong className="text-foreground">Disclaimer:</strong> These resources are provided for reference. 
          Always follow your organisation's policies and procedures.
        </p>
      </div>
    </div>);

}