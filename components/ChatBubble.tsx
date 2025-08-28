import React from "react";
import type { Message, Participant } from "../types";

interface ChatBubbleProps {
    message: Message;
    participant?: Participant;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, participant }) => {
    if (!participant) return null;

    const isModerator = participant.id === "moderator";

    return (
        <div className="grid grid-cols-10 gap-6">
            <div className="col-span-1 flex justify-center">
                <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center border border-gray-light/80 rounded-full">
                    <span className="font-mono text-sm text-gray-dark/80">{participant.avatar}</span>
                </div>
            </div>
            <div className="col-span-9">
                <p className={`font-sans uppercase tracking-widest text-sm mb-3 ${isModerator ? "text-accent" : "text-gray-dark"}`}>
                    {participant.name}
                </p>
                <p className="font-serif text-lg leading-relaxed text-gray-dark/90 whitespace-pre-wrap">
                    {message.text}
                </p>
            </div>
        </div>
    );
};

export default ChatBubble;
