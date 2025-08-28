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
    return (
        <div>
            <h2 className="font-sans uppercase text-lg tracking-widest border-b border-gray-light pb-3 mb-6">
                {translations.title}
            </h2>
            <ul className="space-y-6">
                {participants.map((p) => {
                    const isSpeaking = p.id === currentSpeakerId;
                    return (
                        <li
                            key={p.id}
                            className={`flex items-center transition-all duration-300 ${isSpeaking ? "pl-4 border-l-2 border-accent" : "pl-0 border-l-2 border-transparent"}`}>
                            <div className="h-12 w-12 flex-shrink-0 mr-4 flex items-center justify-center border border-gray-light/80 rounded-full">
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
