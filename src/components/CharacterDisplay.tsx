import React from 'react';
import { Plus, Target } from 'lucide-react';

interface CharacterDisplayProps {
  character: string;
  confidence: number;
  isActive: boolean;
  onAddCharacter: (char: string) => void;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
  character,
  confidence,
  isActive,
  onAddCharacter
}) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.7) return 'text-green-600 bg-green-100';
    if (conf >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.7) return 'High Confidence';
    if (conf >= 0.4) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Detected Character</h3>
            <p className="text-sm text-gray-600">Current prediction</p>
          </div>
        </div>
      </div>

      {isActive && character ? (
        <div className="text-center space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {character}
            </div>
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(confidence)}`}>
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span>{getConfidenceText(confidence)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Confidence</span>
              <span>{(confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => onAddCharacter(character)}
            disabled={confidence < 0.3}
            className={`w-full font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
              confidence >= 0.3 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add to Sentence</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-4" />
          <p>{isActive ? 'Show your hand to start detection' : 'Start camera to begin recognition'}</p>
        </div>
      )}
    </div>
  );
};

export default CharacterDisplay;