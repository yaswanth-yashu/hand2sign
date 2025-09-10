// Enhanced word suggestion system
export class WordSuggestionEngine {
  private commonWords: string[] = [
    // Basic words
    'hello', 'world', 'help', 'please', 'thank', 'you', 'good', 'morning',
    'afternoon', 'evening', 'night', 'yes', 'no', 'maybe', 'sorry', 'excuse',
    
    // Question words
    'me', 'how', 'are', 'what', 'when', 'where', 'why', 'who', 'can', 'will',
    'would', 'could', 'should', 'have', 'has', 'had', 'do', 'does', 'did',
    
    // Action words
    'go', 'come', 'see', 'look', 'hear', 'listen', 'speak', 'talk', 'say',
    'tell', 'ask', 'answer', 'know', 'think', 'feel', 'want', 'need', 'like',
    
    // Emotions and states
    'love', 'hate', 'happy', 'sad', 'angry', 'tired', 'hungry', 'thirsty',
    'cold', 'hot', 'warm', 'cool', 'sick', 'well', 'fine', 'okay',
    
    // Common phrases
    'beautiful', 'wonderful', 'amazing', 'terrible', 'awful', 'great', 'nice',
    'pretty', 'ugly', 'smart', 'stupid', 'funny', 'serious', 'important',
    
    // Time and place
    'today', 'tomorrow', 'yesterday', 'now', 'later', 'soon', 'never', 'always',
    'sometimes', 'often', 'rarely', 'here', 'there', 'everywhere', 'nowhere',
    
    // Family and people
    'family', 'mother', 'father', 'sister', 'brother', 'friend', 'teacher',
    'student', 'doctor', 'nurse', 'police', 'fire', 'work', 'school', 'home'
  ];

  private wordFrequency: Map<string, number> = new Map();

  constructor() {
    // Initialize word frequencies (higher = more common)
    const highFrequency = ['hello', 'thank', 'you', 'please', 'help', 'good', 'yes', 'no'];
    const mediumFrequency = ['how', 'are', 'what', 'when', 'where', 'can', 'will', 'want'];
    
    highFrequency.forEach(word => this.wordFrequency.set(word, 10));
    mediumFrequency.forEach(word => this.wordFrequency.set(word, 5));
    this.commonWords.forEach(word => {
      if (!this.wordFrequency.has(word)) {
        this.wordFrequency.set(word, 1);
      }
    });
  }

  getSuggestions(currentWord: string, maxSuggestions: number = 4): string[] {
    if (!currentWord || currentWord.length === 0) {
      return [];
    }

    const suggestions = this.commonWords
      .filter(word => 
        word.toLowerCase().startsWith(currentWord.toLowerCase()) && 
        word.length > currentWord.length
      )
      .sort((a, b) => {
        // Sort by frequency first, then alphabetically
        const freqA = this.wordFrequency.get(a) || 0;
        const freqB = this.wordFrequency.get(b) || 0;
        
        if (freqA !== freqB) {
          return freqB - freqA; // Higher frequency first
        }
        
        return a.localeCompare(b); // Alphabetical order
      })
      .slice(0, maxSuggestions);

    return suggestions;
  }

  // Learn from user selections to improve suggestions
  recordSelection(word: string): void {
    const currentFreq = this.wordFrequency.get(word) || 0;
    this.wordFrequency.set(word, currentFreq + 1);
  }

  // Add new words to the vocabulary
  addWord(word: string): void {
    if (!this.commonWords.includes(word.toLowerCase())) {
      this.commonWords.push(word.toLowerCase());
      this.wordFrequency.set(word.toLowerCase(), 1);
    }
  }
}

export const wordSuggestionEngine = new WordSuggestionEngine();