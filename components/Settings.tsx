import React, { useState } from "react";
import type { Participant, AIConfig } from "../types";
import { ParticipantRole, AIProvider } from "../types";
import type { Language, TranslationSet } from "../localization";
import { testLMStudioConnection } from "../services/geminiService";

interface SettingsProps {
    participants: Participant[];
    setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
    debateTopic: string;
    setDebateTopic: React.Dispatch<React.SetStateAction<string>>;
    timeLimit: number;
    setTimeLimit: React.Dispatch<React.SetStateAction<number>>;
    thinkingTime: number;
    setThinkingTime: React.Dispatch<React.SetStateAction<number>>;
    language: Language;
    setLanguage: React.Dispatch<React.SetStateAction<Language>>;
    aiConfig: AIConfig;
    setAiConfig: React.Dispatch<React.SetStateAction<AIConfig>>;
    onStartDebate: () => void;
    t: TranslationSet["settings"];
}

const Settings: React.FC<SettingsProps> = ({
    participants,
    setParticipants,
    debateTopic,
    setDebateTopic,
    timeLimit,
    setTimeLimit,
    thinkingTime,
    setThinkingTime,
    language,
    setLanguage,
    aiConfig,
    setAiConfig,
    onStartDebate,
    t,
}) => {
    const [editingParticipant, setEditingParticipant] =
        useState<Participant | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [testStatus, setTestStatus] = useState<
        "idle" | "testing" | "success" | "error"
    >("idle");
    const [testMessage, setTestMessage] = useState("");

    const openEditModal = (participant: Participant) => {
        setEditingParticipant(participant);
        setIsModalVisible(true);
    };

    const closeEditModal = () => {
        setIsModalVisible(false);
    };

    const handleAddParticipant = () => {
        const newParticipant: Participant = {
            id: `custom-${crypto.randomUUID()}`,
            name: "New Mathematician",
            role: ParticipantRole.MEMBER,
            persona: "A brilliant mind from an unknown era, specializing in...",
            avatar: "??",
            isCustom: true,
        };
        setParticipants([...participants, newParticipant]);
        openEditModal(newParticipant);
    };

    const handleUpdateParticipant = (
        id: string,
        field: keyof Participant,
        value: string
    ) => {
        setParticipants(
            participants.map((p) =>
                p.id === id ? { ...p, [field]: value } : p
            )
        );
        if (editingParticipant?.id === id) {
            setEditingParticipant((prev) =>
                prev ? { ...prev, [field]: value } : null
            );
        }
    };

    const handleRemoveParticipant = (id: string) => {
        setParticipants(participants.filter((p) => p.id !== id));
        if (editingParticipant?.id === id) closeEditModal();
    };

    const handleTestConnection = async () => {
        setTestStatus("testing");
        setTestMessage(t.aiProvider.testing);
        try {
            await testLMStudioConnection(aiConfig);
            setTestStatus("success");
            setTestMessage(t.aiProvider.testSuccess);
        } catch (err) {
            setTestStatus("error");
            const errorMessage =
                err instanceof Error ? err.message : t.aiProvider.testError;
            setTestMessage(errorMessage);
        }
    };

    const hasEnoughMembers =
        participants.filter((p) => p.role === ParticipantRole.MEMBER).length >=
        2;
    const isAiConfigValid =
        aiConfig.provider === AIProvider.LMSTUDIO ||
        (aiConfig.provider === AIProvider.GEMINI &&
            aiConfig.apiKey.trim() !== "");
    const isStartable = hasEnoughMembers && isAiConfigValid;

    const getStartButtonText = () => {
        if (!hasEnoughMembers) return t.needMembers;
        if (!isAiConfigValid) return t.aiProvider.apiKeyRequired;
        return t.startDebate;
    };

    return (
        <div className="bg-cream text-gray-dark min-h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12 font-serif">
            <div className="max-w-5xl mx-auto w-full">
                <header className="text-center mb-16">
                    <h1 className="text-6xl lg:text-8xl font-sans uppercase tracking-wider">
                        {t.title}
                    </h1>
                    <p className="text-gray-dark/70 mt-4 text-lg lg:text-xl max-w-2xl mx-auto">
                        {t.subtitle}
                    </p>
                </header>

                <div className="space-y-12">
                    {/* Section: Core Setup */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                        <div className="lg:col-span-1">
                            <h2 className="font-sans uppercase text-lg tracking-widest border-b border-gray-light pb-2">
                                {t.aiProvider.title}
                            </h2>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <select
                                    value={aiConfig.provider}
                                    onChange={(e) => {
                                        setAiConfig((prev) => ({ ...prev, provider: e.target.value as AIProvider }));
                                        setTestStatus("idle");
                                    }}
                                    className="w-full p-2 bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                >
                                    <option value={AIProvider.GEMINI}>Google Gemini</option>
                                    <option value={AIProvider.LMSTUDIO}>LM Studio (Local)</option>
                                </select>
                                {aiConfig.provider === AIProvider.GEMINI && (
                                    <>
                                        <input
                                            type="password"
                                            placeholder={t.aiProvider.apiKeyPlaceholder}
                                            value={aiConfig.apiKey}
                                            onChange={(e) => setAiConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                                            className="w-full p-2 bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                        />
                                        <select
                                            value={aiConfig.geminiModel || "gemini-2.5-flash"}
                                            onChange={(e) => setAiConfig((prev) => ({ ...prev, geminiModel: e.target.value }))}
                                            className="w-full p-2 mt-2 bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                        >
                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                                        </select>
                                    </>
                                )}
                                {aiConfig.provider === AIProvider.LMSTUDIO && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <label htmlFor="lmstudio-port" className="font-mono text-sm whitespace-nowrap">{t.aiProvider.portLabel}:</label>
                                            <input
                                                id="lmstudio-port"
                                                type="number"
                                                value={aiConfig.lmStudioPort}
                                                onChange={(e) => setAiConfig((prev) => ({ ...prev, lmStudioPort: parseInt(e.target.value, 10) || 1234 }))}
                                                className="w-24 p-2 bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={handleTestConnection} className="font-mono text-sm border border-gray-light rounded-full px-4 py-1 hover:border-accent hover:text-accent transition-colors disabled:opacity-50" disabled={testStatus === "testing"}>
                                                {testStatus === "testing" ? t.aiProvider.testing : t.aiProvider.testConnection}
                                            </button>
                                            {testStatus !== "idle" && (
                                                <p className={`font-mono text-xs ${testStatus === "success" ? "text-green-600" : "text-red-600"}`}>
                                                    {testMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-6">
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as Language)}
                                    className="w-full p-2 bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-light/50"/>

                    {/* Section: Debate Topic */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                         <div className="lg:col-span-1">
                            <h2 className="font-sans uppercase text-lg tracking-widest border-b border-gray-light py-2">
                                {t.topic.label}
                            </h2>
                        </div>
                        <div className="lg:col-span-2">
                            <textarea
                                id="debate-topic"
                                value={debateTopic}
                                onChange={(e) => setDebateTopic(e.target.value)}
                                className="w-full h-28 p-3 bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors text-lg"
                                placeholder="e.g., The role of AI in modern art..."
                            />
                        </div>
                    </div>

                    <hr className="border-gray-light/50"/>

                    {/* Section: Timings */}
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                         <div className="lg:col-span-1">
                            <h2 className="font-sans uppercase text-lg tracking-widest border-b border-gray-light py-2">
                                {t.timeLimit.label}
                            </h2>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="flex items-baseline gap-4">
                                <input
                                    type="number"
                                    id="time-limit"
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    min="1"
                                    className="w-24 p-2 text-lg bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                />
                                <label htmlFor="time-limit" className="font-mono text-sm text-gray-dark/60">{t.timeLimitDebate.label}</label>
                            </div>
                             <div className="flex items-baseline gap-4">
                                <input
                                    type="number"
                                    id="thinking-time"
                                    value={thinkingTime}
                                    onChange={(e) => setThinkingTime(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                    min="0"
                                    step="1"
                                    className="w-24 p-2 text-lg bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                />
                                <label htmlFor="thinking-time" className="font-mono text-sm text-gray-dark/60">{t.thinkingTime.label}</label>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-light/50"/>

                    {/* Section: Participants */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                        <div className="lg:col-span-1">
                             <h2 className="font-sans uppercase text-lg tracking-widest border-b border-gray-light py-2">
                                {t.participants.title}
                            </h2>
                        </div>
                        <div className="lg:col-span-2">
                            <ul className="space-y-3">
                                {participants.map((p) =>
                                    p.role === ParticipantRole.MEMBER && (
                                        <li key={p.id} className="flex items-center justify-between p-2 border-b border-gray-light/50">
                                            <span className="text-lg">{p.name}</span>
                                            <div className="space-x-4 font-mono text-sm">
                                                <button onClick={() => openEditModal(p)} className="text-gray-dark/60 hover:text-accent transition-colors">
                                                    {t.participants.edit}
                                                </button>
                                                {p.isCustom && (
                                                    <button onClick={() => handleRemoveParticipant(p.id)} className="text-red-600/70 hover:text-red-600 transition-colors">
                                                        {t.participants.remove}
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    )
                                )}
                            </ul>
                            <button onClick={handleAddParticipant} className="font-mono text-sm border border-gray-light rounded-full px-4 py-1 hover:border-accent hover:text-accent transition-colors mt-6">
                                {t.participants.add}
                            </button>
                        </div>
                    </div>

                    {/* Start Button */}
                    <div className="text-center pt-12">
                        <button
                            onClick={onStartDebate}
                            disabled={!isStartable}
                            className="group inline-flex items-center font-sans uppercase tracking-widest text-2xl text-gray-dark hover:text-accent transition-colors disabled:text-gray-dark/40 disabled:cursor-not-allowed"
                        >
                            <span>{getStartButtonText()}</span>
                            {!isStartable ? null : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-3 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Editing Modal */}
                <div onMouseDown={closeEditModal} className={`fixed inset-0 bg-cream/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${isModalVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                    <div onMouseDown={(e) => e.stopPropagation()} className={`bg-white border border-gray-light/80 shadow-2xl p-8 w-full max-w-2xl space-y-6 transition-transform duration-300 ${isModalVisible ? "scale-100" : "scale-95"}`}>
                        {editingParticipant && (
                            <>
                                <h3 className="text-3xl font-sans uppercase">
                                    {t.modal.title(editingParticipant.name)}
                                </h3>
                                <div className="space-y-6 pt-4">
                                    <div>
                                        <label className="block font-mono text-sm mb-2 text-gray-dark/60">{t.modal.name}</label>
                                        <input
                                            type="text"
                                            value={editingParticipant.name}
                                            onChange={(e) => handleUpdateParticipant(editingParticipant.id, "name", e.target.value)}
                                            className="w-full p-2 text-lg bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-mono text-sm mb-2 text-gray-dark/60">{t.modal.avatar}</label>
                                        <input
                                            type="text"
                                            value={editingParticipant.avatar}
                                            maxLength={2}
                                            onChange={(e) => handleUpdateParticipant(editingParticipant.id, "avatar", e.target.value.toUpperCase())}
                                            className="w-full p-2 text-lg bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-mono text-sm mb-2 text-gray-dark/60">{t.modal.persona}</label>
                                        <textarea
                                            value={editingParticipant.persona}
                                            onChange={(e) => handleUpdateParticipant(editingParticipant.id, "persona", e.target.value)}
                                            className="w-full h-32 p-2 text-lg bg-transparent border-b border-gray-light focus:outline-none focus:ring-0 focus:border-accent transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="text-right pt-4">
                                    <button onClick={closeEditModal} className="font-sans uppercase tracking-widest text-gray-dark hover:text-accent transition-colors">
                                        {t.modal.done}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;