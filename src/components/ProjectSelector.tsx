import React from 'react';
import { Project } from '../types/gitlab';
import { Building2 } from 'lucide-react';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
}

export default function ProjectSelector({ projects, selectedProject, onSelectProject }: ProjectSelectorProps) {
  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <select
          className="block w-full pl-10 pr-4 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md"
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const project = projects.find(p => p.id === Number(e.target.value));
            if (project) onSelectProject(project);
          }}
        >
          <option value="">Select a project...</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.path_with_namespace}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}