import React from 'react';
import { Hand, Activity } from 'lucide-react';

interface HandVisualizationProps {
  landmarks: any[];
  isActive: boolean;
}

const HandVisualization: React.FC<HandVisualizationProps> = ({ landmarks, isActive }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
          <Hand className={`w-6 h-6 ${isActive ? 'text-purple-600' : 'text-gray-600'}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Hand Tracking</h3>
          <p className="text-sm text-gray-600">
            {landmarks.length > 0 ? `${landmarks.length} landmarks detected` : 'No hand detected'}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
        {isActive && landmarks.length > 0 ? (
          <div className="relative">
            <svg className="w-full h-48" viewBox="0 0 400 300">
              {/* Hand landmarks visualization */}
              {landmarks.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={index === 0 ? 6 : 4}
                  fill={index === 0 ? '#8B5CF6' : '#A78BFA'}
                  fillOpacity={0.8}
                  className="animate-pulse"
                />
              ))}
              
              {/* Connection lines (simplified) */}
              {landmarks.length >= 21 && (
                <>
                  <line x1={landmarks[0].x} y1={landmarks[0].y} x2={landmarks[1].x} y2={landmarks[1].y} stroke="#8B5CF6" strokeWidth="2" />
                  <line x1={landmarks[0].x} y1={landmarks[0].y} x2={landmarks[5].x} y2={landmarks[5].y} stroke="#8B5CF6" strokeWidth="2" />
                  <line x1={landmarks[0].x} y1={landmarks[0].y} x2={landmarks[17].x} y2={landmarks[17].y} stroke="#8B5CF6" strokeWidth="2" />
                </>
              )}
            </svg>
            
            <div className="absolute top-2 right-2 flex items-center space-x-2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs">
              <Activity className="w-3 h-3" />
              <span>TRACKING</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-purple-400">
            <Hand className="w-12 h-12 mx-auto mb-4" />
            <p>{isActive ? 'Show your hand to see landmarks' : 'Start camera to begin tracking'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HandVisualization;