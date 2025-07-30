import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/ui/stepper";
import { VoiceInput } from "@/components/ui/voice-input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { t } from "@/lib/i18n";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const checklistItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["low", "medium", "high"]),
  estimatedTime: z.number().min(1).max(999),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  items: z.array(checklistItemSchema).min(1, "At least one item is required"),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { title: t("General Info"), description: t("Basic details") },
  { title: t("Checklist Items"), description: t("Add tasks") },
  { title: t("Review"), description: t("Confirm & submit") }
];

const priorities = [
  { value: "low", label: t("Low"), color: "bg-green-100 text-green-800" },
  { value: "medium", label: t("Medium"), color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: t("High"), color: "bg-red-100 text-red-800" }
];

const categories = [
  "Safety", "Materials", "Electrical", "Plumbing", "Foundation", 
  "Framing", "Roofing", "Finishing", "Inspection", "Cleanup"
];

export default function ChecklistCreator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      items: [
        {
          title: "",
          description: "",
          category: "",
          priority: "medium",
          estimatedTime: 30,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const nextStep = async () => {
    let isValid = false;
    
    if (currentStep === 0) {
      isValid = await form.trigger(["name", "description"]);
    } else if (currentStep === 1) {
      isValid = await form.trigger("items");
    }
    
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addItem = () => {
    append({
      title: "",
      description: "",
      category: "",
      priority: "medium",
      estimatedTime: 30,
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from("checklists")
        .insert({
          name: data.name,
          description: data.description,
          organization_id: user.user_metadata?.organization_id,
        });

      if (error) throw error;

      toast({
        title: t("Checklist created successfully"),
        description: t("Your checklist template has been saved"),
      });

      navigate("/admin/checklists");
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to create checklist"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceInput = (field: string, index?: number) => (text: string) => {
    if (index !== undefined) {
      form.setValue(`items.${index}.${field}` as any, text);
    } else {
      form.setValue(field as any, text);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t("Create Checklist")}</h1>
        </div>

        <Stepper
          steps={steps}
          currentStep={currentStep}
          orientation="horizontal"
          className="px-2"
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
          {/* Step 1: General Info */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("General Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Checklist Name")}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder={t("Enter checklist name")}
                            className="min-h-[44px]"
                            {...field}
                          />
                        </FormControl>
                        <VoiceInput onTranscript={handleVoiceInput("name")} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Description")}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Textarea
                            placeholder={t("Describe this checklist's purpose")}
                            className="min-h-[88px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <VoiceInput onTranscript={handleVoiceInput("description")} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Checklist Items */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t("Checklist Items")}</h2>
                <Button
                  type="button"
                  onClick={addItem}
                  size="sm"
                  className="min-h-[44px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Add Item")}
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {t("Item {{number}}", { number: index + 1 })}
                      </CardTitle>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Task Title")}</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder={t("Enter task title")}
                                className="min-h-[44px]"
                                {...field}
                              />
                            </FormControl>
                            <VoiceInput onTranscript={handleVoiceInput("title", index)} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Description")}</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Textarea
                                placeholder={t("Describe what needs to be done")}
                                className="min-h-[66px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <VoiceInput onTranscript={handleVoiceInput("description", index)} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Category")}</FormLabel>
                            <FormControl>
                              <select
                                className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-2"
                                {...field}
                              >
                                <option value="">{t("Select category")}</option>
                                {categories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {t(cat)}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.priority`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Priority")}</FormLabel>
                            <FormControl>
                              <select
                                className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-2"
                                {...field}
                              >
                                {priorities.map((priority) => (
                                  <option key={priority.value} value={priority.value}>
                                    {priority.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.estimatedTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Estimated Time (minutes)")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="999"
                              className="min-h-[44px]"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Review & Submit")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">{t("General Information")}</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">{t("Name")}:</span> {form.getValues("name")}
                    </div>
                    <div>
                      <span className="font-medium">{t("Description")}:</span> {form.getValues("description")}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">
                    {t("Items")} ({form.getValues("items").length})
                  </h3>
                  <div className="space-y-3">
                    {form.getValues("items").map((item, index) => {
                      const priority = priorities.find(p => p.value === item.priority);
                      return (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{item.title}</h4>
                            <Badge className={priority?.color}>
                              {priority?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>{t("Category")}: {t(item.category)}</span>
                            <span>{t("Time")}: {item.estimatedTime}min</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 min-h-[44px]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("Previous")}
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 min-h-[44px]"
                >
                  {t("Next")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      {t("Creating...")}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t("Create Checklist")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}