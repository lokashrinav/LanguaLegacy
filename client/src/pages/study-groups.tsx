import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Users,
  Plus,
  Globe,
  Lock,
  Clock,
  Target,
  Calendar,
  ChevronRight,
} from "lucide-react";
import type { StudyGroup, Language } from "@shared/schema";
import Navigation from "@/components/Navigation";

const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  languageId: z.string().min(1, "Please select a language"),
  isPublic: z.boolean(),
  maxMembers: z.number().min(2).max(50),
});

export default function StudyGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      languageId: "",
      isPublic: true,
      maxMembers: 10,
    },
  });

  // Fetch all languages for the language selector
  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  // Fetch public study groups
  const { data: publicGroups = [], isLoading: loadingPublic } = useQuery<StudyGroup[]>({
    queryKey: ["/api/study-groups", { isPublic: true }],
  });

  // Fetch user's study groups
  const { data: myGroups = [], isLoading: loadingMyGroups } = useQuery<StudyGroup[]>({
    queryKey: ["/api/user/study-groups"],
    enabled: !!user,
  });

  // Create study group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createGroupSchema>) => {
      return await apiRequest("/api/study-groups", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Study group created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/study-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/study-groups"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create study group",
        variant: "destructive",
      });
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return await apiRequest(`/api/study-groups/${groupId}/join`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Joined study group successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/study-groups"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join study group",
        variant: "destructive",
      });
    },
  });

  const filteredPublicGroups = publicGroups.filter(
    group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const GroupCard = ({ group, showJoinButton = false }: { group: StudyGroup; showJoinButton?: boolean }) => {
    const language = languages.find(l => l.id === group.languageId);
    const isUserMember = myGroups.some(g => g.id === group.id);

    return (
      <Card className="hover:shadow-lg transition-shadow" data-testid={`card-group-${group.id}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {group.name}
                {group.isPublic ? (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription className="mt-2">
                {group.description}
              </CardDescription>
            </div>
            <Badge variant="outline" data-testid={`text-language-${group.id}`}>
              {language?.name || "Unknown"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span data-testid={`text-members-${group.id}`}>
                  0/{group.maxMembers || 10}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : "Unknown"}
              </span>
            </div>
            <div className="flex gap-2">
              {showJoinButton && !isUserMember && user && (
                <Button
                  size="sm"
                  onClick={() => joinGroupMutation.mutate(group.id)}
                  disabled={joinGroupMutation.isPending}
                  data-testid={`button-join-${group.id}`}
                >
                  Join Group
                </Button>
              )}
              <Link href={`/study-group/${group.id}`}>
                <Button size="sm" variant={isUserMember ? "default" : "outline"} data-testid={`link-view-${group.id}`}>
                  {isUserMember ? "Open Workspace" : "View Details"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground mt-2">
            Join collaborative learning spaces to study languages together
          </p>
        </div>
        {user && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-group">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
                <DialogDescription>
                  Start a new collaborative learning space for language learners
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createGroupMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Spanish Beginners Club"
                            {...field}
                            data-testid="input-group-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your group's goals and what you'll be learning together..."
                            {...field}
                            data-testid="input-group-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="languageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-language">
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((language) => (
                              <SelectItem key={language.id} value={language.id}>
                                {language.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Members</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="2"
                            max="50"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-members"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Public Group</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Allow anyone to discover and join your group
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-public"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createGroupMutation.isPending}
                      data-testid="button-submit-create"
                    >
                      {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="discover">Discover Groups</TabsTrigger>
          <TabsTrigger value="my-groups" disabled={!user}>
            My Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search study groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
              data-testid="input-search"
            />
          </div>

          {loadingPublic ? (
            <div className="text-center py-8">Loading study groups...</div>
          ) : filteredPublicGroups.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No study groups found</p>
                <p className="text-muted-foreground mt-2">
                  {user
                    ? "Be the first to create a study group for collaborative learning!"
                    : "Sign in to create or join study groups"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPublicGroups.map((group) => (
                <GroupCard key={group.id} group={group} showJoinButton />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-4">
          {!user ? (
            <Card className="py-12 text-center">
              <CardContent>
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Sign in required</p>
                <p className="text-muted-foreground mt-2">
                  Please sign in to view your study groups
                </p>
              </CardContent>
            </Card>
          ) : loadingMyGroups ? (
            <div className="text-center py-8">Loading your groups...</div>
          ) : myGroups.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">You haven't joined any groups yet</p>
                <p className="text-muted-foreground mt-2">
                  Discover and join study groups to start collaborative learning!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}