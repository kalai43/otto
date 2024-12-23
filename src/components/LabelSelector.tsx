import React from 'react';
import { Label } from '../types/gitlab';
import { Tag, X } from 'lucide-react';

interface LabelSelectorProps {
  labels: Label[];
  selectedLabels: string[];
  onSelectLabels: (labels: string[]) => void;
  isLoading: boolean;
}

export default function LabelSelector({ labels, selectedLabels, onSelectLabels, isLoading }: LabelSelectorProps) {
  const toggleLabel = (labelName: string) => {
    if (selectedLabels.includes(labelName)) {
      onSelectLabels(selectedLabels.filter(l => l !== labelName));
    } else {
      onSelectLabels([...selectedLabels, labelName]);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Labels
      </label>
      <div className="border rounded-md p-2 bg-white min-h-[2.5rem]">
        <div className="flex flex-wrap gap-2">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label) => {
              const labelData = labels.find(l => l.name === label);
              return (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: labelData?.color || '#e5e7eb',
                    color: getContrastColor(labelData?.color || '#e5e7eb')
                  }}
                >
                  {label}
                  <button
                    onClick={() => toggleLabel(label)}
                    className="hover:opacity-75"
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-1">
              <Tag size={16} />
              <span>Select labels to filter merge requests</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2">
        <div className="text-sm font-medium text-gray-700 mb-2">Available Labels</div>
        <div className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <button
              key={label.id}
              onClick={() => toggleLabel(label.name)}
              className={`inline-flex items-center px-2 py-1 rounded-full text-sm transition-opacity ${
                selectedLabels.includes(label.name) ? 'opacity-50' : ''
              }`}
              style={{
                backgroundColor: label.color,
                color: getContrastColor(label.color)
              }}
            >
              {label.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to determine text color based on background
function getContrastColor(hexcolor: string): string {
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}