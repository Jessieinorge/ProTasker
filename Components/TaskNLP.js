import moment from 'moment';

const priorityKeywords = {
  high: [
    'urgent', 
    'high priority', 
    'asap', 
    'immediate', 
    'critical', 
    'top priority', 
    'important', 
    'emergency', 
    'rush', 
    'stat',
    'as soon as possible',
    'right away',
    'need immediately',
    'priority one',
    'expedite'
  ],
  medium: [
    'medium priority', 
    'important', 
    'moderate', 
    'normal priority', 
    'regular', 
    'need soon', 
    'not urgent',
    'should',
    'preferably',
    'priority two',
    'not critical'
  ],
  low: [
    'low priority', 
    'whenever', 
    'no rush', 
    'minor', 
    'unimportant', 
    'optional', 
    'can wait', 
    'low', 
    'not important', 
    'when possible',
    'no hurry',
    'at your convenience',
    'no deadline',
    'whenever possible',
    'priority three'
  ]
};


const analyzeTaskDescription = (description) => {
  let analysisResult = {
    date: null,
    time: null,
    priority: 'No priority',
  };

  // Detect and parse time expressions
  const timeMatch = description.match(/(\d{1,2})\s?(am|pm)/i);
  if (timeMatch) {
    const timeString = `${timeMatch[1]} ${timeMatch[2].toLowerCase()}`;
    const parsedTime = moment(timeString, 'h a');
    if (parsedTime.isValid()) {
      // Convert to HH:mm format
      analysisResult.time = parsedTime.format('HH:mm');
    }
  }

  // Detect priority based on keywords
  Object.entries(priorityKeywords).forEach(([priorityLevel, keywords]) => {
    keywords.forEach((keyword) => {
      if (description.toLowerCase().includes(keyword)) {
        analysisResult.priority = `${priorityLevel.charAt(0).toUpperCase()}${priorityLevel.slice(1)} Priority`;
      }
    });
  });

  return analysisResult;
};

export default analyzeTaskDescription;
