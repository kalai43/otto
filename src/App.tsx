import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { GitBranch, Lock, ArrowRight, Globe } from 'lucide-react';
import { Project, MergeRequest, Pipeline, Label } from './types/gitlab';
import { 
  setGitLabToken, 
  fetchProjects, 
  fetchMergeRequests, 
  mergeMR, 
  fetchLatestPipeline, 
  setGitLabUrl, 
  fetchProjectLabels,
  subscribeToPipelineUpdates 
} from './services/gitlab';
import ProjectSelector from './components/ProjectSelector';
import LabelSelector from './components/LabelSelector';
import MergeRequestList from './components/MergeRequestList';
import PipelineStatus from './components/PipelineStatus';

function App() {
  const [gitlabUrl, setGitlabUrl] = useState(localStorage.getItem('gitlab_url') || 'https://gitlab.com');
  const [token, setToken] = useState(localStorage.getItem('gitlab_token') || '');
  const [isValidating, setIsValidating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [selectedMRs, setSelectedMRs] = useState<number[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [latestPipeline, setLatestPipeline] = useState<Pipeline | null>(null);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      toast.error('Failed to load projects');
      setToken('');
      localStorage.removeItem('gitlab_token');
    }
  };

  const validateToken = async (url: string, token: string) => {
    setIsValidating(true);
    try {
      localStorage.setItem('gitlab_url', url);
      localStorage.setItem('gitlab_token', token);
      setGitLabUrl(url);
      setGitLabToken(token);
      await loadProjects();
      toast.success('Successfully connected to GitLab');
    } catch (error) {
      toast.error('Invalid GitLab URL or token');
      setToken('');
      localStorage.removeItem('gitlab_token');
    } finally {
      setIsValidating(false);
    }
  };

  const loadLabels = async (projectId: number) => {
    setIsLoadingLabels(true);
    try {
      const data = await fetchProjectLabels(projectId);
      setLabels(data);
    } catch (error) {
      toast.error('Failed to load labels');
    } finally {
      setIsLoadingLabels(false);
    }
  };

  const loadMergeRequests = async () => {
    if (!selectedProject) return;
    try {
      const data = await fetchMergeRequests(selectedProject.id, selectedLabels);
      setMergeRequests(data);
    } catch (error) {
      toast.error('Failed to load merge requests');
    }
  };

  const loadLatestPipeline = async () => {
    if (!selectedProject) return;
    try {
      const pipeline = await fetchLatestPipeline(selectedProject.id);
      setLatestPipeline(pipeline);
    } catch (error) {
      toast.error('Failed to load pipeline status');
    }
  };

  const handleMergeSelected = async () => {
    if (!selectedProject) return;
    
    let successCount = 0;
    let failureCount = 0;

    const promises = selectedMRs.map(async (mrId) => {
      const mr = mergeRequests.find(m => m.id === mrId);
      if (!mr) return;
      
      try {
        await mergeMR(selectedProject.id, mr.iid);
        successCount++;
      } catch (error) {
        failureCount++;
      }
    });

    await Promise.all(promises);

    if (successCount > 0) {
      toast.success(`Successfully merged ${successCount} merge requests`);
    }
    if (failureCount > 0) {
      toast.error(`Failed to merge ${failureCount} merge requests`);
    }

    await loadMergeRequests();
    await loadLatestPipeline();
    setSelectedMRs([]);
  };

  useEffect(() => {
    if (token) {
      validateToken(gitlabUrl, token);
    }
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadLabels(selectedProject.id);
      loadMergeRequests();
      loadLatestPipeline();

      const unsubscribe = subscribeToPipelineUpdates((updatedPipeline) => {
        if (updatedPipeline.project_id === selectedProject.id) {
          setLatestPipeline(updatedPipeline);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      loadMergeRequests();
    }
  }, [selectedLabels]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />
      
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <GitBranch className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">GitLab MR Manager</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!token || !projects.length ? (
          <div className="max-w-md mx-auto mt-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-center mb-6">
                <Lock className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-semibold text-center mb-6">Connect to GitLab</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    GitLab Instance URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="url"
                      placeholder="https://gitlab.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={gitlabUrl}
                      onChange={(e) => setGitlabUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your GitLab access token"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => validateToken(gitlabUrl, token)}
                  disabled={!token || !gitlabUrl || isValidating}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? (
                    'Validating...'
                  ) : (
                    <>
                      Connect <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 text-center">
                  Create a token with api scope at GitLab → Settings → Access Tokens
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <ProjectSelector
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
              />
              
              {selectedProject && (
                <LabelSelector
                  labels={labels}
                  selectedLabels={selectedLabels}
                  onSelectLabels={setSelectedLabels}
                  isLoading={isLoadingLabels}
                />
              )}
            </div>

            {selectedProject && (
              <>
                <MergeRequestList
                  mergeRequests={mergeRequests}
                  selectedMRs={selectedMRs}
                  onToggleMR={(mrId) => {
                    setSelectedMRs(prev =>
                      prev.includes(mrId)
                        ? prev.filter(id => id !== mrId)
                        : [...prev, mrId]
                    );
                  }}
                  onMergeSelected={handleMergeSelected}
                />

                <PipelineStatus 
                  pipeline={latestPipeline} 
                  projectId={selectedProject.id} 
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;