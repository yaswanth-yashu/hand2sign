import React from 'react';
import { Volume2, RotateCcw, Loader } from 'lucide-react';

interface ControlPanelProps {
  onSpeak: () => void;
  onClear: () => void;
  isSpeaking: boolean;
  hasText: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onSpeak,
  onClear,
  isSpeaking,
  hasText
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Controls</h3>
      
      <div className="space-y-3">
        <button
          onClick={onSpeak}
          disabled={!hasText || isSpeaking}
          className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-medium transition-all duration-200 ${
            hasText && !isSpeaking
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSpeaking ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
          <span>{isSpeaking ? 'Speaking...' : 'Speak Text'}</span>
        </button>

        <button
          onClick={onClear}
          disabled={!hasText}
          className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-medium transition-all duration-200 ${
            hasText
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Pro Tip</p>
            <p className="text-xs text-blue-700">
              Position your hand clearly in front of the camera and hold each sign for 2-3 seconds for best recognition accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;