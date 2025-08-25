import React, { useState } from 'react';
import type { Participant, AIConfig } from '../types';
import { ParticipantRole, AIProvider } from '../types';
import type { Language, TranslationSet } from '../localization';
import { testLMStudioConnection } from '../services/geminiService';

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
    t: TranslationSet['settings'];
}

const Settings: React.FC<SettingsProps> = ({
    participants, setParticipants, debateTopic, setDebateTopic, timeLimit, setTimeLimit, thinkingTime, setThinkingTime, language, setLanguage, aiConfig, setAiConfig, onStartDebate, t
}) => {

    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

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
            name: 'New Mathematician',
            role: ParticipantRole.MEMBER,
            persona: 'A brilliant mind from an unknown era, specializing in...',
            avatar: '??',
            isCustom: true,
        };
        setParticipants([...participants, newParticipant]);
        openEditModal(newParticipant);
    };

    const handleUpdateParticipant = (id: string, field: keyof Participant, value: string) => {
        setParticipants(participants.map(p => p.id === id ? { ...p, [field]: value } : p));
        if (editingParticipant?.id === id) {
             setEditingParticipant(prev => prev ? {...prev, [field]: value} : null);
        }
    };
    
    const handleRemoveParticipant = (id: string) => {
        setParticipants(participants.filter(p => p.id !== id));
        if(editingParticipant?.id === id) closeEditModal();
    };

    const handleTestConnection = async () => {
        setTestStatus('testing');
        setTestMessage(t.aiProvider.testing);
        try {
            await testLMStudioConnection(aiConfig);
            setTestStatus('success');
            setTestMessage(t.aiProvider.testSuccess);
        } catch (err) {
            setTestStatus('error');
            const errorMessage = err instanceof Error ? err.message : t.aiProvider.testError;
            setTestMessage(errorMessage);
        }
    };

    const hasEnoughMembers = participants.filter(p => p.role === ParticipantRole.MEMBER).length >= 2;
    const isAiConfigValid = aiConfig.provider === AIProvider.LMSTUDIO || (aiConfig.provider === AIProvider.GEMINI && aiConfig.apiKey.trim() !== '');
    const isStartable = hasEnoughMembers && isAiConfigValid;

    const getStartButtonText = () => {
        if (!hasEnoughMembers) return t.needMembers;
        if (!isAiConfigValid) return t.aiProvider.apiKeyRequired;
        return t.startDebate;
    }


    return (
        <div className="bg-slate-900 text-slate-300 min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">{t.title}</h1>
                    <p className="text-slate-400 mt-3 text-lg">{t.subtitle}</p>
                </header>

                <div className="space-y-8">
                    {/* Card: AI Provider & Language */}
                    <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg border border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                               <h2 className="block text-xl font-semibold text-slate-200 mb-4">{t.aiProvider.title}</h2>
                                <div className="space-y-4">
                                     <select
                                        value={aiConfig.provider}
                                        onChange={(e) => { setAiConfig(prev => ({...prev, provider: e.target.value as AIProvider})); setTestStatus('idle'); }}
                                        className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                    >
                                        <option value={AIProvider.GEMINI}>Google Gemini</option>
                                        <option value={AIProvider.LMSTUDIO}>LM Studio (Local)</option>
                                    </select>
                                    {aiConfig.provider === AIProvider.GEMINI && (
                                        <input
                                            type="password"
                                            placeholder={t.aiProvider.apiKeyPlaceholder}
                                            value={aiConfig.apiKey}
                                            onChange={(e) => setAiConfig(prev => ({...prev, apiKey: e.target.value}))}
                                            className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                        />
                                    )}
                                     {aiConfig.provider === AIProvider.LMSTUDIO && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                 <label htmlFor="lmstudio-port" className="text-slate-400 font-medium">{t.aiProvider.portLabel}:</label>
                                                 <input
                                                    id="lmstudio-port"
                                                    type="number"
                                                    value={aiConfig.lmStudioPort}
                                                    onChange={(e) => setAiConfig(prev => ({...prev, lmStudioPort: parseInt(e.target.value, 10) || 1234 }))}
                                                    className="w-28 p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                                 />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button onClick={handleTestConnection} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-md transition-colors" disabled={testStatus === 'testing'}>
                                                    {testStatus === 'testing' ? t.aiProvider.testing : t.aiProvider.testConnection}
                                                </button>
                                                {testStatus !== 'idle' && (
                                                    <p className={`text-sm ${testStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>{testMessage}</p>
                                                )}
                                            </div>
                                            <p className="text-slate-500 text-xs mt-3">{t.aiProvider.lmStudioWarning}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                             <div>
                                <h2 className="block text-xl font-semibold text-slate-200 mb-4">{t.language.label}</h2>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as Language)}
                                    className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Card: Debate Topic */}
                    <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg border border-slate-700">
                        <label htmlFor="debate-topic" className="block text-xl font-semibold text-slate-200 mb-3">{t.topic.label}</label>
                        <textarea
                            id="debate-topic"
                            value={debateTopic}
                            onChange={(e) => setDebateTopic(e.target.value)}
                            className="w-full h-24 p-3 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                        />
                    </div>
                    
                    {/* Card: Timings */}
                    <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg border border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label htmlFor="time-limit" className="block text-xl font-semibold text-slate-200 mb-3">{t.timeLimit.label}</label>
                                <input
                                    type="number"
                                    id="time-limit"
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    min="1"
                                    className="w-32 p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label htmlFor="thinking-time" className="block text-xl font-semibold text-slate-200 mb-3">{t.thinkingTime.label}</label>
                                <input
                                    type="number"
                                    id="thinking-time"
                                    value={thinkingTime}
                                    onChange={(e) => setThinkingTime(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                    min="0"
                                    step="1"
                                    className="w-32 p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>


                    {/* Card: Participants */}
                    <div className="bg-slate-800/50 rounded-lg p-6 shadow-lg border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-xl font-semibold text-slate-200">{t.participants.title}</h2>
                             <button onClick={handleAddParticipant} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-md transition-colors">{t.participants.add}</button>
                        </div>
                        <ul className="space-y-2">
                           {participants.map(p => p.role === ParticipantRole.MEMBER && (
                            <li key={p.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded-md">
                                <span className="font-medium">{p.name}</span>
                                <div>
                                    <button onClick={() => openEditModal(p)} className="text-cyan-400 hover:text-cyan-300 mr-4 font-semibold">{t.participants.edit}</button>
                                    {p.isCustom && <button onClick={() => handleRemoveParticipant(p.id)} className="text-red-500 hover:text-red-400 font-semibold">{t.participants.remove}</button>}
                                </div>
                            </li>
                           ))}
                        </ul>
                    </div>

                    {/* Start Button */}
                    <div className="text-center pt-6">
                        <button onClick={onStartDebate} disabled={!isStartable} className="bg-cyan-600 text-white font-bold py-3 px-10 text-lg rounded-md transition-all duration-300 disabled:bg-slate-700 disabled:cursor-not-allowed enabled:hover:bg-cyan-500 enabled:hover:scale-105">
                           {getStartButtonText()}
                        </button>
                    </div>
                </div>
                
                {/* Editing Modal */}
                <div onMouseDown={closeEditModal} className={`fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${isModalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div onMouseDown={e => e.stopPropagation()} className={`bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-2xl space-y-4 transition-transform duration-300 ${isModalVisible ? 'scale-100' : 'scale-95'}`}>
                       {editingParticipant && <>
                            <h3 className="text-2xl font-bold text-white">{t.modal.title(editingParticipant.name)}</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-400">{t.modal.name}</label>
                                <input type="text" value={editingParticipant.name} onChange={e => handleUpdateParticipant(editingParticipant.id, 'name', e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-400">{t.modal.avatar}</label>
                                <input type="text" value={editingParticipant.avatar} maxLength={2} onChange={e => handleUpdateParticipant(editingParticipant.id, 'avatar', e.target.value.toUpperCase())} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-1 text-slate-400">{t.modal.persona}</label>
                                <textarea value={editingParticipant.persona} onChange={e => handleUpdateParticipant(editingParticipant.id, 'persona', e.target.value)} className="w-full h-40 p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                            </div>
                            <div className="text-right pt-2">
                                <button onClick={closeEditModal} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors">{t.modal.done}</button>
                            </div>
                       </>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;