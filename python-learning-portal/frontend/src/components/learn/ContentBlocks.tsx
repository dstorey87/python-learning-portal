import React from 'react';
import { 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Zap,
  BookOpen,
  Code,
  Target,
  Star,
  ArrowRight
} from 'lucide-react';

// Base content types for rich formatting
export interface ContentBlock {
  type: 'paragraph' | 'highlight' | 'tip' | 'warning' | 'success' | 'code-inline' | 'list' | 'steps';
  content: string | string[];
  title?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

interface ContentBlockProps {
  block: ContentBlock;
  className?: string;
}

export const ContentBlockRenderer: React.FC<ContentBlockProps> = ({ block, className = '' }) => {
  const getColorClasses = (color?: string, type?: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'indigo':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      default:
        if (type === 'tip') return 'bg-blue-50 border-blue-200 text-blue-800';
        if (type === 'warning') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        if (type === 'success') return 'bg-green-50 border-green-200 text-green-800';
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="text-blue-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'highlight': return <Star className="text-purple-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  switch (block.type) {
    case 'paragraph':
      return (
        <div className={`prose prose-lg max-w-none mb-4 ${className}`}>
          <p className="text-gray-700 leading-relaxed text-lg">{block.content}</p>
        </div>
      );

    case 'highlight':
    case 'tip':
    case 'warning':
    case 'success':
      return (
        <div className={`rounded-lg border-l-4 p-4 mb-6 ${getColorClasses(block.color, block.type)} ${className}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(block.type)}
            </div>
            <div className="flex-1">
              {block.title && (
                <h4 className="font-semibold text-sm mb-2">{block.title}</h4>
              )}
              <p className="text-sm leading-relaxed">{block.content}</p>
            </div>
          </div>
        </div>
      );

    case 'code-inline':
      return (
        <div className={`bg-gray-900 rounded-lg p-4 mb-4 ${className}`}>
          <code className="text-green-400 font-mono text-sm">{block.content}</code>
        </div>
      );

    case 'list': {
      const items = Array.isArray(block.content) ? block.content : [block.content];
      return (
        <div className={`mb-6 ${className}`}>
          {block.title && (
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Target className="text-blue-500" size={18} />
              {block.title}
            </h4>
          )}
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
                <p className="text-gray-700">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case 'steps': {
      const steps = Array.isArray(block.content) ? block.content : [block.content];
      return (
        <div className={`mb-6 ${className}`}>
          {block.title && (
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="text-purple-500" size={18} />
              {block.title}
            </h4>
          )}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-gray-700">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return (
        <div className={`mb-4 ${className}`}>
          <p className="text-gray-700">{block.content}</p>
        </div>
      );
  }
};

// Enhanced section header component
interface SectionHeaderProps {
  title: string;
  type: 'theory' | 'example' | 'interactive';
  description?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  type, 
  description,
  className = '' 
}) => {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'theory':
        return {
          icon: <BookOpen size={24} />,
          color: 'bg-blue-100 text-blue-600 border-blue-200',
          bgGradient: 'from-blue-50 to-blue-100',
          badge: 'Learning'
        };
      case 'example':
        return {
          icon: <Code size={24} />,
          color: 'bg-green-100 text-green-600 border-green-200',
          bgGradient: 'from-green-50 to-green-100',
          badge: 'Example'
        };
      case 'interactive':
        return {
          icon: <Zap size={24} />,
          color: 'bg-purple-100 text-purple-600 border-purple-200',
          bgGradient: 'from-purple-50 to-purple-100',
          badge: 'Practice'
        };
      default:
        return {
          icon: <Info size={24} />,
          color: 'bg-gray-100 text-gray-600 border-gray-200',
          bgGradient: 'from-gray-50 to-gray-100',
          badge: 'Section'
        };
    }
  };

  const config = getTypeConfig(type);

  return (
    <div className={`mb-8 ${className}`}>
      <div className={`bg-gradient-to-r ${config.bgGradient} rounded-xl p-6 border border-gray-200`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${config.color}`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color} border`}>
                {config.badge}
              </span>
            </div>
            {description && (
              <p className="text-gray-600 text-sm">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Key concepts box
interface KeyConceptsProps {
  concepts: string[];
  title?: string;
  className?: string;
}

export const KeyConcepts: React.FC<KeyConceptsProps> = ({ 
  concepts, 
  title = "Key Concepts",
  className = '' 
}) => {
  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 p-6 mb-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <Target className="text-indigo-600" size={20} />
        </div>
        <h3 className="font-semibold text-indigo-800">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {concepts.map((concept, index) => (
          <div key={index} className="flex items-center gap-2">
            <ArrowRight className="text-indigo-500 flex-shrink-0" size={16} />
            <span className="text-indigo-700 text-sm font-medium">{concept}</span>
          </div>
        ))}
      </div>
    </div>
  );
};