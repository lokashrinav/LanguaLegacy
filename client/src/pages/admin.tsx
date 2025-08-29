import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";

const languageFormSchema = z.object({
  name: z.string().min(1, "Language name is required"),
  nativeName: z.string().optional(),
  isoCode: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  country: z.string().optional(),
  speakers: z.coerce.number().min(0).optional(),
  threatLevel: z.enum(["vulnerable", "endangered", "critically_endangered", "extinct"]),
  family: z.string().optional(),
  description: z.string().optional(),
});

type LanguageFormData = z.infer<typeof languageFormSchema>;

const threatLevelColors = {
  vulnerable: "bg-yellow-100 text-yellow-800 border-yellow-300",
  endangered: "bg-orange-100 text-orange-800 border-orange-300",
  critically_endangered: "bg-red-100 text-red-800 border-red-300",
  extinct: "bg-gray-100 text-gray-800 border-gray-300",
};

const threatLevelLabels = {
  vulnerable: "Vulnerable",
  endangered: "Endangered",
  critically_endangered: "Critically Endangered",
  extinct: "Extinct",
};

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LanguageFormData>({
    resolver: zodResolver(languageFormSchema),
    defaultValues: {
      name: "",
      nativeName: "",
      isoCode: "",
      region: "",
      country: "",
      speakers: 0,
      threatLevel: "endangered",
      family: "",
      description: "",
    },
  });

  // Fetch existing languages
  const { data: languages = [], isLoading } = useQuery({
    queryKey: ["/api/languages"],
  });

  // Create language mutation
  const createLanguageMutation = useMutation({
    mutationFn: async (data: LanguageFormData) => {
      const res = await apiRequest("POST", "/api/languages", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({
        title: "Language Added!",
        description: "The language has been successfully added to the platform.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete language mutation
  const deleteLanguageMutation = useMutation({
    mutationFn: async (languageId: string) => {
      const res = await apiRequest("DELETE", `/api/languages/${languageId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({
        title: "Language Deleted",
        description: "The language has been removed from the platform.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Seed sample languages
  const seedSampleLanguages = () => {
    const sampleLanguages = [
      {
        name: "Ainu",
        nativeName: "アイヌ・イタㇰ",
        region: "East Asia",
        country: "Japan",
        speakers: 10,
        threatLevel: "critically_endangered",
        family: "Ainu",
        description: "Indigenous language of the Ainu people of northern Japan.",
      },
      {
        name: "Hawaiian",
        nativeName: "ʻŌlelo Hawaiʻi",
        region: "Oceania",
        country: "United States",
        speakers: 24000,
        threatLevel: "vulnerable",
        family: "Austronesian",
        description: "Native language of the Hawaiian Islands.",
      },
      {
        name: "Cherokee",
        nativeName: "ᏣᎳᎩ ᎦᏬᏂᎯᏍᏗ",
        region: "North America",
        country: "United States",
        speakers: 2000,
        threatLevel: "endangered",
        family: "Iroquoian",
        description: "Native American language of the Cherokee people.",
      },
      {
        name: "Cornish",
        nativeName: "Kernewek",
        region: "Europe",
        country: "United Kingdom",
        speakers: 300,
        threatLevel: "critically_endangered",
        family: "Celtic",
        description: "Celtic language native to Cornwall, England.",
      },
    ];

    sampleLanguages.forEach((lang) => {
      createLanguageMutation.mutate(lang as LanguageFormData);
    });
  };

  const onSubmit = (data: LanguageFormData) => {
    createLanguageMutation.mutate(data);
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'hsl(35 40% 96%)' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(25 20% 25%)' }}>
            Language Administration
          </h1>
          <p className="text-lg" style={{ color: 'hsl(25 15% 45%)' }}>
            Add new endangered languages to the LanguaLegacy platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Language Form */}
          <Card className="border-2" style={{ borderColor: 'hsl(25 25% 80%)', backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(25 20% 25%)' }}>
                <Plus className="h-5 w-5" />
                Add New Language
              </CardTitle>
              <CardDescription>
                {languages.length === 0 && (
                  <>
                    No languages found. You can{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={seedSampleLanguages}
                      disabled={createLanguageMutation.isPending}
                    >
                      add sample languages
                    </Button>
                    {" "}to get started.
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Hawaiian" {...field} data-testid="input-language-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nativeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Native Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. ʻŌlelo Hawaiʻi" {...field} data-testid="input-native-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Oceania" {...field} data-testid="input-region" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. United States" {...field} data-testid="input-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="speakers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Speakers</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} data-testid="input-speakers" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="threatLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Threat Level *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-threat-level">
                                <SelectValue placeholder="Select threat level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="vulnerable">Vulnerable</SelectItem>
                              <SelectItem value="endangered">Endangered</SelectItem>
                              <SelectItem value="critically_endangered">Critically Endangered</SelectItem>
                              <SelectItem value="extinct">Extinct</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="family"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Language Family</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Austronesian" {...field} data-testid="input-family" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of the language and its cultural significance..."
                              {...field}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={createLanguageMutation.isPending}
                    className="w-full"
                    style={{ backgroundColor: 'hsl(25 25% 50%)', color: 'white' }}
                    data-testid="button-submit-language"
                  >
                    {createLanguageMutation.isPending ? "Adding..." : "Add Language"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Current Languages */}
          <Card className="border-2" style={{ borderColor: 'hsl(25 25% 80%)', backgroundColor: 'white' }}>
            <CardHeader>
              <CardTitle style={{ color: 'hsl(25 20% 25%)' }}>
                Current Languages ({languages.length})
              </CardTitle>
              <CardDescription>
                Languages currently available on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading languages...</div>
              ) : languages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No languages added yet.{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={seedSampleLanguages}
                    disabled={createLanguageMutation.isPending}
                    data-testid="button-seed-languages"
                  >
                    Add sample languages
                  </Button>
                  {" "}to get started.
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {languages.map((language: any) => (
                    <div
                      key={language.id}
                      className="p-4 border rounded-lg space-y-2"
                      style={{ borderColor: 'hsl(25 25% 85%)' }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold" style={{ color: 'hsl(25 20% 25%)' }}>
                            {language.name}
                            {language.nativeName && (
                              <span className="text-sm font-normal ml-2" style={{ color: 'hsl(25 15% 45%)' }}>
                                ({language.nativeName})
                              </span>
                            )}
                          </h3>
                          <p className="text-sm" style={{ color: 'hsl(25 15% 45%)' }}>
                            {language.region}{language.country && `, ${language.country}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={threatLevelColors[language.threatLevel as keyof typeof threatLevelColors]}>
                            {threatLevelLabels[language.threatLevel as keyof typeof threatLevelLabels]}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLanguageMutation.mutate(language.id)}
                            disabled={deleteLanguageMutation.isPending}
                            data-testid={`button-delete-${language.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {language.speakers > 0 && (
                        <p className="text-sm" style={{ color: 'hsl(25 15% 45%)' }}>
                          {language.speakers.toLocaleString()} speakers
                        </p>
                      )}
                      {language.description && (
                        <p className="text-sm" style={{ color: 'hsl(25 15% 45%)' }}>
                          {language.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}