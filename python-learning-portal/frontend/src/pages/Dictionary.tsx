import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { conceptsDictionary, searchConcepts, Concept } from '../data/conceptsDictionary';
import { Search, Filter, BookOpen, Code, Settings, Database, Lightbulb, Hash, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

const Dictionary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Concept['category'] | 'all'>('all');
  const [filteredConcepts, setFilteredConcepts] = useState(Object.values(conceptsDictionary));
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  const location = useLocation();

  // Handle URL hash for direct concept navigation
  useEffect(() => {
    if (location.hash) {
      const conceptId = location.hash.substring(1);
      // Expand the concept if it's not already expanded
      setExpandedConcepts(prev => new Set([...prev, conceptId]));
      setTimeout(() => {
        const element = document.getElementById(conceptId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  useEffect(() => {
    let concepts: Concept[] = Object.values(conceptsDictionary);

    // Filter by search query
    if (searchQuery) {
      concepts = searchConcepts(searchQuery);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      concepts = concepts.filter((concept: Concept) => concept.category === selectedCategory);
    }

    // Sort alphabetically by name
    concepts = concepts.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredConcepts(concepts);
  }, [searchQuery, selectedCategory]);

  const toggleConcept = (conceptId: string) => {
    setExpandedConcepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conceptId)) {
        newSet.delete(conceptId);
      } else {
        newSet.add(conceptId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedConcepts(new Set(filteredConcepts.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedConcepts(new Set());
  };

  const handleTagClick = (tagText: string) => {
    setSearchQuery(tagText);
  };

  const getCategoryIcon = (category: Concept['category']) => {
    switch (category) {
      case 'function': return <Code size={16} />;
      case 'operator': return <Settings size={16} />;
      case 'keyword': return <Hash size={16} />;
      case 'data-type': return <Database size={16} />;
      case 'method': return <Code size={16} />;
      case 'concept': return <Lightbulb size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

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

  const categories: Array<{ value: Concept['category'] | 'all', label: string }> = [
    { value: 'all', label: 'All Concepts' },
    { value: 'function', label: 'Functions' },
    { value: 'data-type', label: 'Data Types' },
    { value: 'operator', label: 'Operators' },
    { value: 'keyword', label: 'Keywords' },
    { value: 'method', label: 'Methods' },
    { value: 'concept', label: 'Concepts' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Python Dictionary</h1>
              <p className="text-gray-600">Complete reference for Python concepts, functions, and syntax</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search concepts, functions, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Concept['category'] | 'all')}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredConcepts.length} of {Object.keys(conceptsDictionary).length} concepts
            </p>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Concepts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredConcepts.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center py-12">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No concepts found</h3>
              <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            filteredConcepts.map((concept: Concept) => {
              const isExpanded = expandedConcepts.has(concept.id);
              
              return (
                <div
                  key={concept.id}
                  id={concept.id}
                  className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${
                    isExpanded ? 'md:col-span-2' : ''
                  }`}
                >
                  {/* Collapsible Header - Compact design */}
                  <div
                    className={`flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                      isExpanded ? 'p-3' : 'p-2'
                    }`}
                    onClick={() => toggleConcept(concept.id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="text-gray-400" size={16} />
                        ) : (
                          <ChevronRight className="text-gray-400" size={16} />
                        )}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${getCategoryColor(concept.category)}`}>
                          {getCategoryIcon(concept.category)}
                          <span className="hidden sm:inline">{concept.category}</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{concept.name}</h3>
                        {!isExpanded && (
                          <p className="text-xs text-gray-600 truncate">{concept.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick preview - hide when expanded or on small screens */}
                    {!isExpanded && (
                      <div className="hidden lg:flex items-center text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded text-right max-w-24 overflow-hidden">
                        <span className="truncate">
                          {concept.syntax?.split('(')[0] || concept.simpleExample?.split('\n')[0]?.substring(0, 15) || '...'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Content - Compact design spanning full width */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <div className="p-4 bg-white">
                        {/* Full description when expanded */}
                        <p className="text-sm text-gray-700 mb-4">{concept.description}</p>
                        
                        <div className="grid gap-4">
                          {/* Example */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                              <Code size={14} />
                              Example
                            </h4>
                            <div className="bg-gray-900 rounded-md p-3 border">
                              <code className="text-green-300 text-sm font-mono whitespace-pre-wrap block">
                                {concept.simpleExample}
                              </code>
                            </div>
                          </div>

                          {/* Syntax */}
                          {concept.syntax && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                                <Hash size={14} />
                                Syntax
                              </h4>
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <code className="text-blue-800 text-sm font-mono block">
                                  {concept.syntax}
                                </code>
                              </div>
                            </div>
                          )}

                          {/* Parameters */}
                          {concept.parameters && concept.parameters.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Parameters</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {concept.parameters.map((param: string) => (
                                  <button
                                    key={param}
                                    onClick={() => handleTagClick(param)}
                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-mono transition-colors cursor-pointer"
                                  >
                                    {param}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Related Concepts and Tags in a grid */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Related Concepts */}
                            {concept.relatedConcepts && concept.relatedConcepts.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Related</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {concept.relatedConcepts.map((relatedId: string) => {
                                    const relatedConcept = conceptsDictionary[relatedId];
                                    return relatedConcept ? (
                                      <button
                                        key={relatedId}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!expandedConcepts.has(relatedId)) {
                                            toggleConcept(relatedId);
                                          }
                                          setTimeout(() => {
                                            document.getElementById(relatedId)?.scrollIntoView({ 
                                              behavior: 'smooth', 
                                              block: 'center' 
                                            });
                                          }, 100);
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium transition-colors border border-blue-200"
                                      >
                                        <ExternalLink size={10} />
                                        {relatedConcept.name}
                                      </button>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Search Tags */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Tags</h4>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  onClick={() => handleTagClick(concept.name)}
                                  className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs font-medium transition-colors border border-green-200"
                                >
                                  {concept.name}
                                </button>
                                <button
                                  onClick={() => handleTagClick(concept.category)}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs font-medium transition-colors border border-purple-200"
                                >
                                  {concept.category}
                                </button>
                                {concept.parameters?.slice(0, 2).map((param: string) => (
                                  <button
                                    key={param}
                                    onClick={() => handleTagClick(param)}
                                    className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-xs font-mono transition-colors border border-gray-200"
                                  >
                                    {param}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dictionary;