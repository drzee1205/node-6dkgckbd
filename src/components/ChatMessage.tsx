import React from 'react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Button } from './ui/button';
import { Clock, BookOpen, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  showTimestamp?: boolean;
  showCitations?: boolean;
}

export function ChatMessage({ message, showTimestamp = false, showCitations = true }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  const isTyping = message.isTyping;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'user-message' : 'assistant-message'}`}>
        {/* Message content */}
        <div className="relative group">
          {isTyping ? (
            <div className="typing-indicator flex items-center space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <>
              {isUser ? (
                <div className="text-sm">{message.content}</div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
              
              {/* Copy button for assistant messages */}
              {!isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(message.content)}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Citations */}
        {!isUser && showCitations && message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-muted">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <BookOpen size={12} />
              <span>References:</span>
            </div>
            <div className="space-y-1">
              {message.citations.map((citation, index) => (
                <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-4 h-4 bg-muted rounded-full flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  <span>
                    {citation.source}
                    {citation.page && `, p. ${citation.page}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <div className={`flex items-center gap-1 mt-2 text-[10px] text-muted-foreground ${isUser ? 'justify-end' : 'justify-start'}`}>
            <Clock size={10} />
            <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
          </div>
        )}
      </div>
    </div>
  );
}