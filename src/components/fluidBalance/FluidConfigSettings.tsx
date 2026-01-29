import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Settings, AlertTriangle, Info, Heart, Scale } from 'lucide-react';
import { FluidConfig } from '@/types/fluidBalance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { Separator } from '@/components/ui/separator';

interface FluidConfigSettingsProps {
  config: FluidConfig | null;
  onSave: (config: Partial<FluidConfig>) => Promise<void>;
}

export const FluidConfigSettings: React.FC<FluidConfigSettingsProps> = ({
  config,
  onSave
}) => {
  const form = useForm({
    defaultValues: {
      target_daily_intake_ml: config?.target_daily_intake_ml || 2000,
      enable_output_logging: config?.enable_output_logging ?? true,
      day_boundary_time: config?.day_boundary_time || '00:00',
      dehydration_threshold_ml: config?.dehydration_threshold_ml || -500,
      overhydration_threshold_ml: config?.overhydration_threshold_ml || 1000,
      fluid_restriction_enabled: config?.fluid_restriction_enabled || false,
      max_fluid_allowance_ml: config?.max_fluid_allowance_ml || null,
      hard_stop_on_limit_exceeded: config?.hard_stop_on_limit_exceeded || false,
      escalation_recipients: config?.escalation_recipients || []
    }
  });
  
  const isRestricted = form.watch('fluid_restriction_enabled');
  const enableOutput = form.watch('enable_output_logging');
  
  const handleSubmit = async (data: any) => {
    await onSave(data);
  };
  
  return (
    <RestrictedSection requiredRole="admin" message="Only administrators can modify fluid balance settings.">
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Clinical Guidance</AlertTitle>
          <AlertDescription>
            Targets and thresholds should be set by a clinician, dietitian, or GP based on the individual's care plan.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Daily Intake Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="target_daily_intake_ml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Daily Intake (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 2000)}
                        />
                      </FormControl>
                      <FormDescription>
                        Recommended daily fluid intake. Default is 2000ml.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="day_boundary_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day Boundary Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        When the "day" starts for calculations. Default is midnight (00:00).
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Output Logging</CardTitle>
                <CardDescription>
                  Enable to track fluid output and calculate balance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="enable_output_logging"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Enable Output Logging</FormLabel>
                        <FormDescription>
                          Track urine, vomit, drainage, and other fluid losses
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {!enableOutput && (
                  <Alert variant="default">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      With output logging disabled, only intake will be tracked. 
                      Fluid balance calculations will not be available.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {enableOutput && (
              <Card>
                <CardHeader>
                  <CardTitle>Balance Thresholds</CardTitle>
                  <CardDescription>
                    Set thresholds for dehydration and overhydration alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dehydration_threshold_ml"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dehydration Threshold (ml)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || -500)}
                          />
                        </FormControl>
                        <FormDescription>
                          Alert when balance falls below this (negative value). Default: -500ml
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="overhydration_threshold_ml"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overhydration Threshold (ml)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 1000)}
                          />
                        </FormControl>
                        <FormDescription>
                          Alert when balance exceeds this (positive value). Default: +1000ml
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
            
            <Card className={isRestricted ? 'border-amber-200' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={isRestricted ? 'h-5 w-5 text-amber-500' : 'h-5 w-5'} />
                  Fluid Restriction
                </CardTitle>
                <CardDescription>
                  Enable for individuals with medical fluid limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fluid_restriction_enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Enable Fluid Restriction</FormLabel>
                        <FormDescription>
                          Limit daily fluid intake to a maximum allowance
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {isRestricted && (
                  <>
                    <FormField
                      control={form.control}
                      name="max_fluid_allowance_ml"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Daily Allowance (ml)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || ''}
                              onChange={e => field.onChange(parseInt(e.target.value) || null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Daily fluid cap set by clinician
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hard_stop_on_limit_exceeded"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                          <div>
                            <FormLabel>Hard Stop When Exceeded</FormLabel>
                            <FormDescription>
                              Block further intake logging when limit is reached
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
            
            <Button type="submit" className="w-full">
              Save Configuration
            </Button>
          </form>
        </Form>
        
        <Separator />
        
        {/* Related Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Modules</CardTitle>
            <CardDescription>
              Consider enabling these modules for comprehensive care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Scale className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Weight & BMI Monitoring</p>
                  <p className="text-xs text-muted-foreground">
                    Track weight changes alongside hydration
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Continence Management</p>
                  <p className="text-xs text-muted-foreground">
                    Link hydration with continence care patterns
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RestrictedSection>
  );
};
