'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
}

interface DupeSubmission {
  originalProduct: string;
  dupeProduct: string;
  priceComparison: string;
  similarityReason: string;
}

export default function DupeSubmissionChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome! Help us grow our dupe database by sharing your fashion finds. What original product are you submitting a dupe for?',
      timestamp: new Date(),
    },
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submission, setSubmission] = useState<DupeSubmission>({
    originalProduct: '',
    dupeProduct: '',
    priceComparison: '',
    similarityReason: '',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getNextPrompt = (step: number): string => {
    switch (step) {
      case 1:
        return "Great! Now, what's the dupe (similar product) you've found?";
      case 2:
        return "What's the price difference between the original and the dupe?";
      case 3:
        return "What makes these products similar? (materials, design, fit, etc.)";
      case 4:
        return "Thanks for your submission! Would you like to submit another dupe? (yes/no)";
      default:
        return "";
    }
  };

  const submitDupeToBackend = async (submission: DupeSubmission) => {
    try {
      const response = await fetch('/api/dupes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalProduct: submission.originalProduct,
          dupeProduct: submission.dupeProduct,
          priceComparison: submission.priceComparison,
          similarityReason: submission.similarityReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit dupe');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting dupe:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    
    // Update submission object based on current step
    const newSubmission = { ...submission };
    switch (currentStep) {
      case 1:
        newSubmission.originalProduct = inputValue;
        break;
      case 2:
        newSubmission.dupeProduct = inputValue;
        break;
      case 3:
        newSubmission.priceComparison = inputValue;
        break;
      case 4:
        newSubmission.similarityReason = inputValue;
        // Submit to backend when all information is collected
        try {
          await submitDupeToBackend(newSubmission);
        } catch (error) {
          // Add error message to chat
          setMessages(prev => [...prev, userMessage, {
            id: Date.now().toString(),
            type: 'system',
            content: "Sorry, there was an error submitting your dupe. Please try again later.",
            timestamp: new Date(),
          }]);
          setInputValue('');
          return;
        }
        break;
      case 5:
        if (inputValue.toLowerCase() === 'yes') {
          // Reset form for new submission
          setSubmission({
            originalProduct: '',
            dupeProduct: '',
            priceComparison: '',
            similarityReason: '',
          });
          setCurrentStep(1);
          setMessages([messages[0]]); // Reset to welcome message
          setInputValue('');
          return;
        } else {
          // Add thank you message
          setMessages(prev => [...prev, userMessage, {
            id: Date.now().toString(),
            type: 'system',
            content: "Thank you for your contributions to our dupe database! Your submission will be reviewed by our team.",
            timestamp: new Date(),
          }]);
          setInputValue('');
          return;
        }
    }

    // Add system response if not the last step
    const systemMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'system',
      content: getNextPrompt(currentStep),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, systemMessage]);
    setInputValue('');
    setCurrentStep(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Submit a Dupe</h2>
        <p className="text-sm text-gray-600">Help others find affordable alternatives</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 