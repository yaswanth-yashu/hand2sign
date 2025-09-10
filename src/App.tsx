import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, RotateCcw, Volume2, Hand, Zap } from 'lucide-react';
import VideoFeed from './components/VideoFeed';
import CharacterDisplay from './components/CharacterDisplay';
import SentenceBuilder from './components/SentenceBuilder';
import WordSuggestions from './components/WordSuggestions';
import ControlPanel from './components/ControlPanel';
import HandVisualization from './components/HandVisualization';
import { wordSuggestionEngine } from './utils/wordSuggestions';

function App() {
  const [currentCharacter, setCurrentCharacter] = useState<string>('');
  const [sentence, setSentence] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [handLandmarks, setHandLandmarks] = useState<any[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [characterHistory, setCharacterHistory] = useState<string[]>([]);
  const [lastAddedTime, setLastAddedTime] = useState<number>(0);

  // Handle real hand detection results
  const handleHandDetection = (character: string, conf: number, landmarks: any[]) => {
    setCurrentCharacter(character);
    setConfidence(conf);
    setHandLandmarks(landmarks);
    
    // Update character history for stability
    setCharacterHistory(prev => {
      const newHistory = [...prev, character].slice(-5); // Keep last 5 characters
      return newHistory;
    });
  };

  const handleAddCharacter = (char: string) => {
    const now = Date.now();
    // Prevent rapid additions (debounce)
    if (now - lastAddedTime < 1000) return;
    
    setSentence(prev => prev + char);
    setLastAddedTime(now);
    updateSuggestions(sentence + char);
  };

  const updateSuggestions = (text: string) => {
    const words = text.trim().split(' ');
    const currentWord = words[words.length - 1];
    
    if (currentWord && currentWord.length > 0) {
      // Use the enhanced word suggestion engine
      const suggestions = wordSuggestionEngine.getSuggestions(currentWord, 4);
      setSuggestions(suggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const words = sentence.trim().split(' ');
    if (words.length > 0) {
      words[words.length - 1] = suggestion;
      setSentence(words.join(' ') + ' ');
    } else {
      setSentence(suggestion + ' ');
    }
    setSuggestions([]);
    
    // Record the selection to improve future suggestions
    wordSuggestionEngine.recordSelection(suggestion);
  };

  const handleSpeak = async () => {
    if ('speechSynthesis' in window && sentence.trim()) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.8;
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleClear = () => {
    setSentence('');
    setSuggestions([]);
    setCurrentCharacter('');
    setConfidence(0);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl">
                <Hand className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">SignSpeak</h1>
                <p className="text-sm text-slate-600">AI-Powered Sign Language Recognition</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-slate-700">
                  {isRecording ? 'Live Detection' : 'Paused'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-slate-600">
                  {currentCharacter ? `Detected: ${currentCharacter}` : 'No gesture'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Video and Hand Tracking */}
          <div className="lg:col-span-2 space-y-6">
            <VideoFeed 
              isRecording={isRecording}
              onToggleRecording={toggleRecording}
              onHandDetection={handleHandDetection}
            />
            
            <HandVisualization 
              landmarks={handLandmarks}
              isActive={isRecording}
            />
          </div>

          {/* Right Panel - Recognition Results */}
          <div className="space-y-6">
            <CharacterDisplay 
              character={currentCharacter}
              confidence={confidence}
              isActive={isRecording}
              onAddCharacter={handleAddCharacter}
            />
            
            <SentenceBuilder 
              sentence={sentence}
              onChange={setSentence}
            />
            
            <WordSuggestions 
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
            
            <ControlPanel 
              onSpeak={handleSpeak}
              onClear={handleClear}
              isSpeaking={isSpeaking}
              hasText={sentence.trim().length > 0}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;