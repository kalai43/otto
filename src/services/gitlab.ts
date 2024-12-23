import axios from 'axios';
import { io } from 'socket.io-client';
import { MergeRequest, Pipeline, Project, Label } from '../types/gitlab';

const api = axios.create({
  baseURL: 'https://gitlab.com/api/v4',
});

const BACKEND_URL = import.meta.env.PROD 
  ? 'https://your-backend-url.com'  // You'll need to deploy the backend separately
  : 'http://localhost:3000';

const socket = io(BACKEND_URL);

export const setGitLabUrl = (url: string) => {
  api.defaults.baseURL = `${url.replace(/\/$/, '')}/api/v4`;
};

export const setGitLabToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const fetchProjects = async (): Promise<Project[]> => {
  const { data } = await api.get('/projects?membership=true&per_page=100');
  return data;
};

export const fetchProjectLabels = async (projectId: number): Promise<Label[]> => {
  const { data } = await api.get(`/projects/${projectId}/labels`);
  return data;
};

export const fetchMergeRequests = async (projectId: number, labels?: string[]): Promise<MergeRequest[]> => {
  const labelParam = labels?.length ? `&labels=${labels.join(',')}` : '';
  const { data } = await api.get(`/projects/${projectId}/merge_requests?state=opened${labelParam}`);
  return data;
};

export const mergeMR = async (projectId: number, mrIid: number): Promise<void> => {
  await api.put(`/projects/${projectId}/merge_requests/${mrIid}/merge`);
};

export const fetchLatestPipeline = async (projectId: number): Promise<Pipeline> => {
  const { data } = await api.get(`/projects/${projectId}/pipelines?ref=master&per_page=1`);
  return data[0];
};

export const triggerPipelineStage = async (projectId: number, stage: string): Promise<void> => {
  const token = api.defaults.headers.common['Authorization'].replace('Bearer ', '');
  await axios.post(`${BACKEND_URL}/api/pipeline/${projectId}/stages/${stage}/trigger`, {
    gitlabToken: token
  });
};

export const subscribeToPipelineUpdates = (callback: (pipeline: Pipeline) => void) => {
  socket.on('pipelineUpdate', callback);
  return () => {
    socket.off('pipelineUpdate', callback);
  };
};