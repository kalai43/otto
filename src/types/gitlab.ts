export interface Project {
  id: number;
  name: string;
  path_with_namespace: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface MergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  merged_by: {
    name: string;
    username: string;
  } | null;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  target_branch: string;
  source_branch: string;
  author: {
    name: string;
    username: string;
  };
  labels: string[];
  web_url: string;
}

export interface Pipeline {
  id: number;
  status: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
}