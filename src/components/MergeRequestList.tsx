import React, { useState } from 'react';
import { MergeRequest } from '../types/gitlab';
import { GitMerge, Tag, Loader2 } from 'lucide-react';

interface MergeRequestListProps {
  mergeRequests: MergeRequest[];
  selectedMRs: number[];
  onToggleMR: (mrId: number) => void;
  onMergeSelected: () => Promise<void>;
}

export default function MergeRequestList({ 
  mergeRequests, 
  selectedMRs, 
  onToggleMR, 
  onMergeSelected 
}: MergeRequestListProps) {
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      await onMergeSelected();
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Merge Requests</h2>
        {selectedMRs.length > 0 && (
          <button
            onClick={handleMerge}
            disabled={isMerging}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isMerging ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Merging...
              </>
            ) : (
              <>
                <GitMerge size={18} />
                Merge Selected ({selectedMRs.length})
              </>
            )}
          </button>
        )}
      </div>
      <div className="space-y-4">
        {mergeRequests.map((mr) => (
          <div
            key={mr.id}
            className={`p-4 border rounded-lg transition-colors ${
              selectedMRs.includes(mr.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedMRs.includes(mr.id)}
                onChange={() => onToggleMR(mr.id)}
                disabled={isMerging}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">{mr.title}</h3>
                  <a
                    href={mr.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </a>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {mr.source_branch} → {mr.target_branch}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Tag size={16} className="text-gray-400" />
                  <div className="flex flex-wrap gap-2">
                    {mr.labels.map((label) => (
                      <span
                        key={label}
                        className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {mergeRequests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No merge requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}