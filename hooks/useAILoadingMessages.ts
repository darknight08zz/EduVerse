import { useState, useEffect } from 'react';

const SLOW_MESSAGES: Record<string, string[]> = {
  career: [
    'Analyzing 50,000+ university profiles...',
    'Matching your profile to admission patterns...',
    'Calculating career trajectories...',
    'Almost done — generating your personalized report...',
  ],
  admission: [
    'Reviewing your academic profile...',
    'Comparing with admitted student data...',
    'Calculating probability scores...',
    'Preparing your detailed feedback...',
  ],
  sop: [
    'Understanding your unique story...',
    'Crafting your opening hook...',
    'Building your academic narrative...',
    'Polishing your statement of purpose...',
  ],
  roi: [
    'Crunching the financial numbers...',
    'Modeling salary projections...',
    'Calculating break-even timeline...',
  ],
};

export function useAILoadingMessages(endpoint: string, isLoading: boolean) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = SLOW_MESSAGES[endpoint] || ['AI is thinking...'];

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex(prev => Math.min(prev + 1, messages.length - 1));
    }, 3000); // advance message every 3 seconds
    return () => clearInterval(interval);
  }, [isLoading, messages.length]);

  return messages[messageIndex];
}
