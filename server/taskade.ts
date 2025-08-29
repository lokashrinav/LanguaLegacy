import fetch from 'node-fetch';

const TASKADE_API_BASE = 'https://www.taskade.com/api/v1';
const TASKADE_API_KEY = process.env.TASKADE_API_KEY;

interface TaskadeWorkspace {
  id: string;
  name: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskadeProject {
  id: string;
  name: string;
  folderId?: string;
  contentType: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskadeTask {
  id: string;
  content: string;
  contentType: string;
  completed: boolean;
  position: number;
}

class TaskadeClient {
  private headers: Record<string, string>;

  constructor() {
    if (!TASKADE_API_KEY) {
      throw new Error('TASKADE_API_KEY is not configured');
    }
    
    this.headers = {
      'Authorization': `Bearer ${TASKADE_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async getWorkspaces(): Promise<TaskadeWorkspace[]> {
    const response = await fetch(`${TASKADE_API_BASE}/workspaces`, {
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  async createProject(workspaceId: string, name: string, content: string): Promise<TaskadeProject> {
    const response = await fetch(`${TASKADE_API_BASE}/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        name,
        contentType: 'text/markdown',
        content
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create project: ${error}`);
    }

    const data = await response.json();
    return data.item;
  }

  async getProject(projectId: string): Promise<TaskadeProject> {
    const response = await fetch(`${TASKADE_API_BASE}/projects/${projectId}`, {
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }

    const data = await response.json();
    return data.item;
  }

  async createTasks(projectId: string, tasks: Array<{ content: string; completed?: boolean }>): Promise<TaskadeTask[]> {
    const createdTasks: TaskadeTask[] = [];
    
    // Create tasks one by one as Taskade API might not support batch creation
    for (const task of tasks) {
      try {
        const response = await fetch(`${TASKADE_API_BASE}/projects/${projectId}/tasks`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            contentType: 'text/markdown',
            content: task.content,
            completed: task.completed || false
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.item) {
            createdTasks.push(data.item);
          }
        }
      } catch (error) {
        console.error(`Failed to create task "${task.content}":`, error);
      }
    }
    
    return createdTasks;
  }

  async updateTask(projectId: string, taskId: string, updates: { content?: string; completed?: boolean }): Promise<TaskadeTask> {
    const response = await fetch(`${TASKADE_API_BASE}/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({
        contentType: 'text/markdown',
        ...updates
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }

    const data = await response.json();
    return data.item;
  }

  async completeTask(projectId: string, taskId: string): Promise<void> {
    const response = await fetch(`${TASKADE_API_BASE}/projects/${projectId}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.statusText}`);
    }
  }

  async getProjectTasks(projectId: string): Promise<TaskadeTask[]> {
    const response = await fetch(`${TASKADE_API_BASE}/projects/${projectId}/tasks`, {
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }
}

export const taskadeClient = TASKADE_API_KEY ? new TaskadeClient() : null;

export async function createLanguagePreservationProject(
  languageName: string,
  languageId: string,
  region: string,
  threatLevel: string
): Promise<{ projectId: string; projectUrl: string }> {
  if (!taskadeClient) {
    throw new Error('Taskade integration is not configured');
  }

  try {
    // Get the first workspace or create a default one
    const workspaces = await taskadeClient.getWorkspaces();
    if (workspaces.length === 0) {
      throw new Error('No Taskade workspace found. Please create a workspace in Taskade first.');
    }

    const workspace = workspaces[0];

    // Create project content with preservation tasks
    const projectContent = `# ${languageName} Preservation Project

## Language Information
- **Region**: ${region}
- **Threat Level**: ${threatLevel}
- **Project ID**: ${languageId}

## Documentation Goals
Help preserve ${languageName} by contributing:
- Audio recordings of native speakers
- Written translations
- Cultural stories and traditions
- Grammar documentation
- Common phrases and expressions

## Getting Started
1. Review the language background
2. Connect with native speakers
3. Start documenting conversations
4. Upload recordings and translations
5. Review and verify contributions`;

    // Create the project
    const project = await taskadeClient.createProject(
      workspace.id,
      `${languageName} Language Preservation`,
      projectContent
    );

    // Create initial tasks (but don't fail if tasks creation fails)
    const initialTasks = [
      { content: '📝 Document basic greetings and common phrases' },
      { content: '🎙️ Record pronunciation guides for the alphabet/syllables' },
      { content: '📚 Collect traditional stories or folklore' },
      { content: '🗣️ Interview native speakers about language history' },
      { content: '📖 Create vocabulary list for everyday objects' },
      { content: '🎵 Document traditional songs or poems' },
      { content: '👥 Find and connect with language community members' },
      { content: '📸 Document written forms if they exist' },
      { content: '🌍 Map dialect variations by region' },
      { content: '✅ Review and verify all contributions' }
    ];

    try {
      await taskadeClient.createTasks(project.id, initialTasks);
    } catch (taskError) {
      console.error('Warning: Could not create initial tasks:', taskError);
      // Continue even if tasks creation fails
    }

    // Construct the project URL
    const projectUrl = `https://www.taskade.com/d/${project.id}`;

    return {
      projectId: project.id,
      projectUrl
    };
  } catch (error) {
    console.error('Error in createLanguagePreservationProject:', error);
    throw error;
  }
}

export async function syncTaskProgress(
  projectId: string,
  completedTasks: string[]
): Promise<void> {
  if (!taskadeClient) {
    throw new Error('Taskade integration is not configured');
  }

  const tasks = await taskadeClient.getProjectTasks(projectId);
  
  for (const task of tasks) {
    if (completedTasks.includes(task.content) && !task.completed) {
      await taskadeClient.completeTask(projectId, task.id);
    }
  }
}

export async function addPreservationTask(
  projectId: string,
  taskContent: string
): Promise<void> {
  if (!taskadeClient) {
    throw new Error('Taskade integration is not configured');
  }

  await taskadeClient.createTasks(projectId, [{ content: taskContent }]);
}