import React from 'react';
import { ChatInterface } from './components/ChatInterface';

export default function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground dark">
      <ChatInterface />
    </div>
  );
}
