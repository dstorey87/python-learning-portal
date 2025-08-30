import React from 'react';
import ConceptTag from './ConceptTag';
import { BookOpen } from 'lucide-react';

interface ConceptTagsProps {
  conceptIds: string[];
  className?: string;
}

const ConceptTags: React.FC<ConceptTagsProps> = ({ conceptIds, className = '' }) => {
  if (!conceptIds || conceptIds.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={14} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          Concepts covered in this section:
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {conceptIds.map((conceptId) => (
          <ConceptTag key={conceptId} conceptId={conceptId} />
        ))}
      </div>
    </div>
  );
};

export default ConceptTags;