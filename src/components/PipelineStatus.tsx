import React, { useEffect } from 'react';
import { Pipeline } from '../types/gitlab';
import { CircleDot, Clock, ExternalLink, Play } from 'lucide-react';
import { subscribeToPipelineUpdates, triggerPipelineStage } from '../services/gitlab';

interface PipelineStatusProps {
  pipeline: Pipeline | null;
  projectId: number;
}

export default function PipelineStatus({ pipeline, projectId }: PipelineStatusProps) {
  useEffect(() => {
    const unsubscribe = subscribeToPipelineUpdates((updatedPipeline) => {
      if (updatedPipeline.project_id === projectId) {
        // Update pipeline state in parent component
        // You might want to lift this state up and handle it in App.tsx
        console.log('Pipeline updated:', updatedPipeline);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [projectId]);

  if (!pipeline) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'running': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const handleTriggerStage = async (stage: string) => {
    try {
      await triggerPipelineStage(projectId, stage);
      toast.success(`Triggered ${stage} stage successfully`);
    } catch (error) {
      toast.error(`Failed to trigger ${stage} stage`);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-lg font-medium mb-3">Latest Master Pipeline</h3>
      <div className="flex items-center gap-4 mb-4">
        <div className={`flex items-center gap-2 ${getStatusColor(pipeline.status)}`}>
          <CircleDot size={18} />
          <span className="capitalize">{pipeline.status}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Clock size={18} />
          <span>{new Date(pipeline.created_at).toLocaleString()}</span>
        </div>
        <a
          href={pipeline.web_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
          View Pipeline <ExternalLink size={16} />
        </a>
      </div>

      {pipeline.stages && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Pipeline Stages</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pipeline.stages.map((stage) => (
              <div
                key={stage.name}
                className={`p-3 rounded-md border ${
                  stage.status === 'success' ? 'border-green-200 bg-green-50' :
                  stage.status === 'failed' ? 'border-red-200 bg-red-50' :
                  stage.status === 'running' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stage.name}</span>
                  {stage.manual && (
                    <button
                      onClick={() => handleTriggerStage(stage.name)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                      title="Trigger stage manually"
                    >
                      <Play size={16} className="text-gray-600" />
                    </button>
                  )}
                </div>
                <span className={`text-sm ${getStatusColor(stage.status)}`}>
                  {stage.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}