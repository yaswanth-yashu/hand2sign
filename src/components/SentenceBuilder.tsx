import React from 'react';
import { Type, Trash2 } from 'lucide-react';

interface SentenceBuilderProps {
  sentence: string;
  onChange: (sentence: string) => void;
}

const SentenceBuilder: React.FC<SentenceBuilderProps> = ({ sentence, onChange }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Type className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sentence</h3>
            <p className="text-sm text-gray-600">Your composed text</p>
          </div>
        </div>
        
        {sentence.trim() && (
          <button
            onClick={() => onChange('')}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Clear sentence"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          value={sentence}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[120px] p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none text-lg leading-relaxed"
          placeholder="Your sentence will appear here as you sign..."
        />
        
        {sentence.trim() && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <span>{sentence.trim().split(' ').length} words</span>
            <span>{sentence.length} characters</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SentenceBuilder;