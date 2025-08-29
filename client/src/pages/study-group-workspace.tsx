import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Calendar,
  UserPlus,
  Edit,
  Trash2,
  ChevronRight,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import type { StudyGroup, GroupTask, GroupMember, LearningGoal, TaskProgress } from "@shared/schema";

const createTaskSchema = z.object({
  title: z.string().min(3, "Task title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignedTo: z.string().optional(),
});

const createGoalSchema = z.object({
  title: z.string().min(3, "Goal title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  targetDate: z.string(),
  targetMetric: z.string().optional(),
});

export default function StudyGroupWorkspace() {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<GroupTask | null>(null);
  const [activeTab, setActiveTab] = useState("tasks");

  const taskForm = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const goalForm = useForm<z.infer<typeof createGoalSchema>>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  // Fetch study group details
  const { data: group, isLoading: loadingGroup } = useQuery<StudyGroup>({
    queryKey: ["/api/study-groups", groupId],
    queryFn: async () => {
      const response = await fetch(`/api/study-groups/${groupId}`);
      if (!response.ok) throw new Error("Failed to fetch group");
      return response.json();
    },
    enabled: !!groupId,
  });

  // Fetch group members
  const { data: members = [] } = useQuery<GroupMember[]>({
    queryKey: [`/api/study-groups/${groupId}/members`],
    enabled: !!groupId,
  });

  // Fetch group tasks
  const { data: tasks = [] } = useQuery<GroupTask[]>({
    queryKey: [`/api/study-groups/${groupId}/tasks`],
    enabled: !!groupId,
  });

  // Fetch learning goals
  const { data: goals = [] } = useQuery<LearningGoal[]>({
    queryKey: [`/api/study-groups/${groupId}/goals`],
    enabled: !!groupId,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTaskSchema>) => {
      return await apiRequest(`/api/study-groups/${groupId}/tasks`, "POST", {
        ...data,
        status: "pending",
        taskType: "general",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/study-groups/${groupId}/tasks`] });
      setIsTaskDialogOpen(false);
      taskForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return await apiRequest(`/api/tasks/${taskId}`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/study-groups/${groupId}/tasks`] });
      toast({
        title: "Success",
        description: "Task updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Update task progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      return await apiRequest(`/api/tasks/${taskId}/progress`, "POST", { 
        completed, 
        completedAt: completed ? new Date() : null 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/study-groups/${groupId}/tasks`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createGoalSchema>) => {
      return await apiRequest(`/api/study-groups/${groupId}/goals`, "POST", {
        ...data,
        status: "in_progress",
        metric: data.targetMetric || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning goal created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/study-groups/${groupId}/goals`] });
      setIsGoalDialogOpen(false);
      goalForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/study-groups/${groupId}/leave`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Left the study group",
      });
      window.location.href = "/study-groups";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      });
    },
  });

  if (loadingGroup) {
    return <div className="container mx-auto py-8">Loading workspace...</div>;
  }

  if (!group) {
    return <div className="container mx-auto py-8">Study group not found</div>;
  }

  const currentMember = members.find(m => m.userId === user?.id);
  const isCreator = currentMember?.role === "creator";
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const TaskCard = ({ task }: { task: GroupTask }) => {
    // Priority is stored as part of task description or use taskType
    const priority = "medium"; // Default priority
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case "high": return "destructive";
        case "medium": return "default";
        case "low": return "secondary";
        default: return "outline";
      }
    };

    return (
      <Card className="mb-3" data-testid={`card-task-${task.id}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {currentMember && (
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={(checked) => {
                    updateTaskMutation.mutate({
                      taskId: task.id,
                      status: checked ? "completed" : "pending",
                    });
                    if (user) {
                      updateProgressMutation.mutate({
                        taskId: task.id,
                        completed: !!checked,
                      });
                    }
                  }}
                  data-testid={`checkbox-task-${task.id}`}
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium" data-testid={`text-task-title-${task.id}`}>{task.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={getPriorityColor(priority)} data-testid={`badge-priority-${task.id}`}>
                    {priority}
                  </Badge>
                  {task.dueDate && (
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {isCreator && (
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" data-testid={`button-edit-task-${task.id}`}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" data-testid={`button-delete-task-${task.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold" data-testid="text-group-name">{group.name}</h1>
            <p className="text-muted-foreground mt-2" data-testid="text-group-description">
              {group.description}
            </p>
          </div>
          <div className="flex gap-2">
            {currentMember && (
              <Button
                variant="outline"
                onClick={() => leaveGroupMutation.mutate()}
                data-testid="button-leave-group"
              >
                Leave Group
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Group Tasks</h3>
                {currentMember && (
                  <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-task">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                          Add a task for your study group to work on together
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...taskForm}>
                        <form
                          onSubmit={taskForm.handleSubmit((data) => createTaskMutation.mutate(data))}
                          className="space-y-4"
                        >
                          <FormField
                            control={taskForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Complete lesson 5 exercises"
                                    {...field}
                                    data-testid="input-task-title"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={taskForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe what needs to be done..."
                                    {...field}
                                    data-testid="input-task-description"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={taskForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-priority">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={taskForm.control}
                            name="dueDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Due Date (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-due-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsTaskDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createTaskMutation.isPending}
                              data-testid="button-submit-task"
                            >
                              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="space-y-4">
                {pendingTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Pending ({pendingTasks.length})
                    </h4>
                    {pendingTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}

                {inProgressTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      In Progress ({inProgressTasks.length})
                    </h4>
                    {inProgressTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}

                {completedTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Completed ({completedTasks.length})
                    </h4>
                    {completedTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}

                {tasks.length === 0 && (
                  <Card className="py-8 text-center">
                    <CardContent>
                      <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No tasks yet</p>
                      <p className="text-muted-foreground mt-2">
                        Create your first task to get started with collaborative learning
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Learning Goals</h3>
                {currentMember && (
                  <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-goal">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Goal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Learning Goal</DialogTitle>
                        <DialogDescription>
                          Set a goal for your study group to achieve together
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...goalForm}>
                        <form
                          onSubmit={goalForm.handleSubmit((data) => createGoalMutation.mutate(data))}
                          className="space-y-4"
                        >
                          <FormField
                            control={goalForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Goal Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Complete beginner course"
                                    {...field}
                                    data-testid="input-goal-title"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={goalForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe what you want to achieve..."
                                    {...field}
                                    data-testid="input-goal-description"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={goalForm.control}
                            name="targetDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-target-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={goalForm.control}
                            name="targetMetric"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target Metric (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., 30 lessons, 100 words"
                                    {...field}
                                    data-testid="input-target-metric"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsGoalDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createGoalMutation.isPending}
                              data-testid="button-submit-goal"
                            >
                              {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid gap-4">
                {goals.map(goal => (
                  <Card key={goal.id} data-testid={`card-goal-${goal.id}`}>
                    <CardHeader>
                      <CardTitle className="text-lg" data-testid={`text-goal-title-${goal.id}`}>
                        {goal.title}
                      </CardTitle>
                      <CardDescription>{goal.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {goal.metric || "No metric set"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "No date"}
                          </span>
                        </div>
                        <Progress value={goal.currentValue || 0} className="w-32" />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {goals.length === 0 && (
                  <Card className="py-8 text-center">
                    <CardContent>
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No goals set</p>
                      <p className="text-muted-foreground mt-2">
                        Set learning goals to track your group's progress
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Group Progress Overview</CardTitle>
                  <CardDescription>
                    Track your collective learning achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Tasks Completed</span>
                        <span className="text-sm text-muted-foreground">
                          {completedTasks.length} / {tasks.length}
                        </span>
                      </div>
                      <Progress 
                        value={tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0} 
                        data-testid="progress-tasks"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Active Members</span>
                        <span className="text-sm text-muted-foreground">
                          {members.length} / {group.maxMembers}
                        </span>
                      </div>
                      <Progress 
                        value={(members.length / (group.maxMembers || 10)) * 100} 
                        data-testid="progress-members"
                      />
                    </div>

                    <div className="pt-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-total-tasks">
                          {tasks.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Tasks</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-completed-tasks">
                          {completedTasks.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-total-goals">
                          {goals.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Goals Set</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3" data-testid={`member-${member.userId}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {member.userId.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Member</p>
                      {member.role === "creator" && (
                        <Badge variant="secondary" className="text-xs">Creator</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {currentMember && members.length < (group.maxMembers || 10) && (
                <Button className="w-full mt-4" variant="outline" size="sm" data-testid="button-invite">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span data-testid="text-created-date">
                    {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <span data-testid="text-language-name">Learning</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Privacy</span>
                  <span data-testid="text-privacy">
                    {group.isPublic ? "Public" : "Private"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}