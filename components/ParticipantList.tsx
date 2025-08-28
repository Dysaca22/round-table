import React from "react";
import type { Participant } from "../types";

interface ParticipantListProps {
    participants: Participant[];
    currentSpeakerId: string | null;
    translations: {
        title: string;
    };
}

const ParticipantList: React.FC<ParticipantListProps> = ({
    participants,
    currentSpeakerId,
    translations,
}) => {
    // Move current speaker to the top
    const sortedParticipants = React.useMemo(() => {
        if (!currentSpeakerId) return participants;
        const current = participants.find((p) => p.id === currentSpeakerId);
        const rest = participants.filter((p) => p.id !== currentSpeakerId);
        return current ? [current, ...rest] : participants;
    }, [participants, currentSpeakerId]);

    return (
        <div className="flex flex-col h-full max-h-[55vh]">
            <h2 className="font-sans uppercase text-lg tracking-widest border-b border-gray-light pb-3 mb-6">
                {translations.title}
            </h2>
            <ul className="space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50 flex-1 transition-all duration-500" style={{ minHeight: 0 }}>
                {sortedParticipants.map((p) => {
                    const isSpeaking = p.id === currentSpeakerId;
                    return (
                        <li
                            key={p.id}
                            className={`flex items-center transition-all duration-500 ${isSpeaking ? "pl-4 border-l-2 border-accent bg-accent/10" : "pl-0 border-l-2 border-transparent"}`}
                            style={{ order: isSpeaking ? -1 : 0 }}
                        >
                            <div className="h-12 w-12 flex-shrink-0 mr-4 flex items-center justify-center border border-gray-light/80 rounded-full bg-white">
                                <span className="font-mono text-sm text-gray-dark/80">{p.avatar}</span>
                            </div>

                            <div>
                                <p className={`font-serif text-lg ${isSpeaking ? "text-gray-dark" : "text-gray-dark/80"}`}>
                                    {p.name}
                                </p>
                                <p className={`font-mono text-xs capitalize ${isSpeaking ? "text-gray-dark/70" : "text-gray-dark/50"}`}>
                                    {p.role.toLowerCase()}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default ParticipantList;
