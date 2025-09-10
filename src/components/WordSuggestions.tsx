import React from 'react';
import { Lightbulb } from 'lucide-react';

interface WordSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const WordSuggestions: React.FC<WordSuggestionsProps> = ({ suggestions, onSuggestionClick }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Suggestions</h3>
          <p className="text-sm text-gray-600">Smart word completion</p>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors duration-200 border border-transparent hover:border-blue-200"
            >
              <span className="font-medium">{suggestion}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Start typing to see suggestions</p>
        </div>
      )}
    </div>
  );
};

export default WordSuggestions;