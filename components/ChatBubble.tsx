import React from 'react';
import type { Message, Participant } from '../types';

interface ChatBubbleProps {
  message: Message;
  participant?: Participant;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, participant }) => {
  if (!participant) return null;

  const isModerator = participant.id === 'moderator';

  return (
    <div className="flex items-start gap-4 p-4 animate-fade-in">
      <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center font-bold text-sm text-white rounded-full ${isModerator ? 'bg-slate-600' : 'bg-cyan-600'}`}>
        {participant.avatar}
      </div>
      <div className="flex-1">
        <p className={`font-semibold mb-1 ${isModerator ? 'text-slate-400' : 'text-slate-200'}`}>
          {participant.name}
        </p>
        <p className="text-slate-300 text-base whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatBubble;