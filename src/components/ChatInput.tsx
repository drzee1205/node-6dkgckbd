import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({ 
  onSendMessage, 
  isLoading = false,
  placeholder = "Ask about pediatric medicine...",
  maxLength = 1000
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    if (isListening) {
      setIsListening(false);
      // Stop speech recognition
      return;
    }

    setIsListening(true);
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Medical quick actions
  const quickActions = [
    'Calculate drug dosage',
    'Emergency protocol',
    'Growth chart assessment',
    'Vaccine schedule'
  ];

  const insertQuickAction = (action: string) => {
    setMessage(action + ': ');
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-border bg-background p-4">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto">
        {quickActions.map((action) => (
          <Button
            key={action}
            variant="outline"
            size="sm"
            className="text-xs whitespace-nowrap"
            onClick={() => insertQuickAction(action)}
            disabled={isLoading}
          >
            {action}
          </Button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            className="min-h-[44px] max-h-[120px] resize-none pr-12 bg-input border-border text-foreground placeholder:text-muted-foreground"
            rows={1}
          />
          
          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {message.length}/{maxLength}
          </div>
        </div>

        {/* Voice Input Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleVoiceInput}
          disabled={isLoading}
          className={`h-11 w-11 ${isListening ? 'bg-red-500 text-white' : ''}`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </Button>

        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isLoading}
          className="h-11 w-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </Button>
      </form>
    </div>
  );
}

// Extend window interface for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}