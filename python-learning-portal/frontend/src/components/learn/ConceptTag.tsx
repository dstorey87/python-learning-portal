import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { conceptsDictionary, Concept } from '../../data/conceptsDictionary';
import { ExternalLink, Info } from 'lucide-react';

interface ConceptTagProps {
  conceptId: string;
  className?: string;
}

const ConceptTag: React.FC<ConceptTagProps> = ({ conceptId, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const concept = conceptsDictionary[conceptId];

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!concept) {
    return null;
  }

  const getCategoryColor = (category: Concept['category']) => {
    switch (category) {
      case 'function': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'operator': return 'bg-green-100 text-green-800 border-green-200';
      case 'keyword': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'data-type': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'method': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'concept': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    // Add a delay before hiding tooltip to allow moving cursor to tooltip
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  const handleTooltipMouseEnter = () => {
    // Clear timeout when hovering over tooltip
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(true);
  };

  const handleTooltipMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 hover:shadow-sm ${getCategoryColor(concept.category)}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Info size={10} />
        {concept.name}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 z-50"
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-lg text-blue-300">{concept.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(concept.category)} bg-opacity-20`}>
                {concept.category}
              </span>
            </div>
            
            <p className="text-gray-300 text-sm mb-3 leading-relaxed">
              {concept.description}
            </p>
            
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Example:</h5>
              <code className="block bg-gray-800 text-green-300 p-2 rounded text-sm font-mono whitespace-pre-wrap border border-gray-700">
                {concept.simpleExample}
              </code>
            </div>

            {concept.syntax && (
              <div className="mb-3">
                <h5 className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Syntax:</h5>
                <code className="block bg-gray-800 text-yellow-300 p-2 rounded text-sm font-mono border border-gray-700">
                  {concept.syntax}
                </code>
              </div>
            )}

            <Link
              to={`/dictionary#${concept.id}`}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              <ExternalLink size={12} />
              Learn More in Dictionary
            </Link>

            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptTag;