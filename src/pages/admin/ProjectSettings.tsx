import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, FileText, Clock, Users, Shield, Bell, Database, Palette } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProjectSettings() {
  const [settings, setSettings] = useState({
    autoAssignTasks: true,
    emailNotifications: true,
    slackIntegration: false,
    defaultProjectDuration: "30",
    approvalRequired: true,
    publicDashboard: false,
    maintenanceMode: false,
  });

  const { toast } = useToast();

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Setting Updated",
      description: "Configuration has been saved successfully.",
    });
  };

  const projectTemplates = [
    {
      id: '1',
      name: 'Web Development',
      description: 'Standard template for web development projects',
      phases: 5,
      duration: '12 weeks',
      active: true,
    },
    {
      id: '2',
      name: 'Mobile App',
      description: 'Template for mobile application development',
      phases: 6,
      duration: '16 weeks',
      active: true,
    },
    {
      id: '3',
      name: 'Marketing Campaign',
      description: 'Template for marketing and promotional campaigns',
      phases: 4,
      duration: '8 weeks',
      active: false,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Project Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure project templates, workflows, and system settings
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Configure basic project management settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-assign Tasks</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign tasks to team members based on workload
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoAssignTasks}
                      onCheckedChange={(checked) => 
                        handleSettingChange('autoAssignTasks', checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Approval Required</Label>
                      <p className="text-sm text-muted-foreground">
                        Require manager approval for task completion
                      </p>
                    </div>
                    <Switch
                      checked={settings.approvalRequired}
                      onCheckedChange={(checked) => 
                        handleSettingChange('approvalRequired', checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="duration">Default Project Duration (days)</Label>
                    <Input
                      id="duration"
                      value={settings.defaultProjectDuration}
                      onChange={(e) => 
                        handleSettingChange('defaultProjectDuration', e.target.value)
                      }
                      className="w-32"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Public Dashboard</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow public access to project dashboards
                      </p>
                    </div>
                    <Switch
                      checked={settings.publicDashboard}
                      onCheckedChange={(checked) => 
                        handleSettingChange('publicDashboard', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable maintenance mode to restrict access
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => 
                        handleSettingChange('maintenanceMode', checked)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">99.9%</div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">2.3s</div>
                      <div className="text-sm text-muted-foreground">Avg Response</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Templates
                </CardTitle>
                <CardDescription>
                  Manage project templates and workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant={template.active ? "default" : "secondary"}>
                            {template.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {template.duration}
                          </span>
                          <span>{template.phases} phases</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">
                          {template.active ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-4">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how and when users receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      handleSettingChange('emailNotifications', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Notification Types</Label>
                  <div className="space-y-3">
                    {[
                      'Task assignments',
                      'Project deadlines',
                      'Status updates',
                      'Team mentions',
                      'System maintenance'
                    ].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Switch defaultChecked />
                        <Label className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Notification Frequency</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly digest</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Third-party Integrations
                </CardTitle>
                <CardDescription>
                  Connect with external tools and services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications to Slack channels
                    </p>
                  </div>
                  <Switch
                    checked={settings.slackIntegration}
                    onCheckedChange={(checked) => 
                      handleSettingChange('slackIntegration', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Available Integrations</Label>
                  <div className="grid gap-4">
                    {[
                      { name: 'Jira', description: 'Sync tasks and issues', connected: false },
                      { name: 'GitHub', description: 'Link code repositories', connected: true },
                      { name: 'Figma', description: 'Import design files', connected: false },
                      { name: 'Google Drive', description: 'Sync project documents', connected: true },
                    ].map((integration) => (
                      <div key={integration.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{integration.name}</div>
                          <div className="text-sm text-muted-foreground">{integration.description}</div>
                        </div>
                        <Button 
                          variant={integration.connected ? "outline" : "default"}
                          size="sm"
                        >
                          {integration.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}