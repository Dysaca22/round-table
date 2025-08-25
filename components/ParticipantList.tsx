import React from 'react';
import type { Participant } from '../types';

interface ParticipantListProps {
  participants: Participant[];
  currentSpeakerId: string | null;
  translations: {
    title: string;
  };
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants, currentSpeakerId, translations }) => {
  return (
    <div className="bg-slate-900/50 rounded-lg p-4 h-full">
      <h2 className="text-xl font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-3">{translations.title}</h2>
      <ul className="space-y-3">
        {participants.map((p) => {
          const isSpeaking = p.id === currentSpeakerId;
          return (
            <li
              key={p.id}
              className={`flex items-center p-2 rounded-md transition-all duration-300 ${isSpeaking ? 'bg-slate-700/50' : ''}`}
            >
              <div className="relative h-10 w-10 flex-shrink-0 mr-4">
                  <div className={`h-10 w-10 flex items-center justify-center font-bold text-sm text-white rounded-full ${p.id === 'moderator' ? 'bg-slate-600' : 'bg-cyan-600'}`}>
                    {p.avatar}
                  </div>
                  {isSpeaking && <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-pulse"></div>}
              </div>
              
              <div>
                <p className={`font-semibold transition-colors ${isSpeaking ? 'text-cyan-300' : 'text-slate-200'}`}>{p.name}</p>
                <p className={`text-xs capitalize transition-colors ${isSpeaking ? 'text-slate-300' : 'text-slate-400'}`}>{p.role.toLowerCase()}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ParticipantList;