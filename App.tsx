import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Message, Turn, Participant, AIConfig } from "./types";
import { DebateStatus, ParticipantRole, AIProvider } from "./types";
import {
    PARTICIPANTS as defaultParticipants,
    DEBATE_TOPIC as defaultTopic,
} from "./constants";
import {
    startDebate,
    getMemberContribution,
    getModeratorDecision,
} from "./services/geminiService";
import { T, Language } from "./localization";
import ChatBubble from "./components/ChatBubble";
import ParticipantList from "./components/ParticipantList";
import Settings from "./components/Settings";

const useLocalStorage = <T,>(
    key: string,
    initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };
    return [storedValue, setValue];
};

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [debateStatus, setDebateStatus] = useState<DebateStatus>(
        DebateStatus.SETTINGS
    );
    const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
    const [statusText, setStatusText] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Configurable state
    const [participants, setParticipants] = useLocalStorage<Participant[]>(
        "participants",
        defaultParticipants
    );
    const [debateTopic, setDebateTopic] = useLocalStorage<string>(
        "debateTopic",
        defaultTopic
    );
    const [timeLimit, setTimeLimit] = useLocalStorage<number>("timeLimit", 10); // in minutes
    const [language, setLanguage] = useLocalStorage<Language>("language", "en");
    const [aiConfig, setAiConfig] = useLocalStorage<AIConfig>("aiConfig", {
        provider: AIProvider.GEMINI,
        apiKey: "",
        lmStudioPort: 1234,
    });
    const [thinkingTime, setThinkingTime] = useLocalStorage<number>(
        "thinkingTime",
        4
    );

    const [timeLeft, setTimeLeft] = useState(timeLimit * 60);

    const turnCount = useRef(0);
    const MAX_TURNS = 20;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const t = T(language);

    useEffect(() => {
        if (debateStatus === DebateStatus.SETTINGS) {
            setStatusText(t.status.configure);
        }
    }, [language, debateStatus, t.status.configure]);

    const addMessage = (participantId: string, text: string) => {
        setMessages((prev) => [
            { id: crypto.randomUUID(), participantId, text },
            ...prev,
        ]);
    };

    const handleStartDebate = () => {
        setDebateStatus(DebateStatus.RUNNING);
        setStatusText(t.status.starting);
        setError(null);
        setMessages([]);
        turnCount.current = 0;
        setTimeLeft(timeLimit * 60);

        startDebate(debateTopic, participants, language, aiConfig)
            .then(({ contribution, nextSpeakerId }) => {
                addMessage("moderator", contribution);
                setCurrentTurn({
                    participantId: nextSpeakerId,
                    action: "CONTRIBUTING",
                });
            })
            .catch((err) => {
                console.error(err);
                const errorMessage =
                    err instanceof Error ? err.message : t.errors.unknown;
                setError(`${t.errors.startFailed}: ${errorMessage}`);
                setDebateStatus(DebateStatus.ERROR);
                setStatusText(t.status.errorStarting);
            });
    };

    const concludeDebate = (reason: string) => {
        setStatusText(reason);
        setDebateStatus(DebateStatus.FINISHED);
        setCurrentTurn(null);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const processTurn = useCallback(async () => {
        if (!currentTurn || debateStatus !== DebateStatus.RUNNING) return;

        if (turnCount.current >= MAX_TURNS) {
            concludeDebate(t.status.concludedMaxTurns);
            return;
        }

        const currentParticipant = participants.find(
            (p) => p.id === currentTurn.participantId
        );
        if (!currentParticipant) {
            setError(t.errors.speakerNotFound);
            setDebateStatus(DebateStatus.ERROR);
            return;
        }

        turnCount.current++;
        setStatusText(
            currentTurn.action === "CONTRIBUTING"
                ? t.status.waitingFor(currentParticipant.name)
                : t.status.moderatorDeciding
        );

        try {
            if (thinkingTime > 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, thinkingTime * 1000)
                );
            }

            if (currentTurn.action === "CONTRIBUTING") {
                const { contribution } = await getMemberContribution(
                    currentParticipant,
                    messages,
                    participants,
                    debateTopic,
                    language,
                    aiConfig
                );
                addMessage(currentParticipant.id, contribution);
                setCurrentTurn({
                    participantId: "moderator",
                    action: "DECIDING",
                });
            } else if (currentTurn.action === "DECIDING") {
                const moderator = participants.find(
                    (p) => p.role === ParticipantRole.MODERATOR
                )!;
                const { contribution, nextSpeakerId } =
                    await getModeratorDecision(
                        moderator,
                        messages,
                        participants,
                        debateTopic,
                        language,
                        aiConfig
                    );
                addMessage(moderator.id, contribution);

                if (!participants.some((p) => p.id === nextSpeakerId)) {
                    throw new Error(t.errors.invalidSpeaker(nextSpeakerId));
                }

                setCurrentTurn({
                    participantId: nextSpeakerId,
                    action: "CONTRIBUTING",
                });
            }
        } catch (err) {
            console.error(err);
            const errorMessage =
                err instanceof Error ? err.message : t.errors.unknown;
            setError(`${t.errors.general}: ${errorMessage}`);
            setDebateStatus(DebateStatus.ERROR);
            setStatusText(t.status.errorDuring);
        }
    }, [
        currentTurn,
        debateStatus,
        messages,
        participants,
        debateTopic,
        language,
        aiConfig,
        t,
        thinkingTime,
    ]);

    useEffect(() => {
        if (debateStatus === DebateStatus.RUNNING && currentTurn) {
            processTurn();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debateStatus, currentTurn]);

    useEffect(() => {
        if (debateStatus === DebateStatus.RUNNING) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        concludeDebate(t.status.concludedTimeUp);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [debateStatus, t.status.concludedTimeUp]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const togglePause = () => {
        if (debateStatus === DebateStatus.RUNNING) {
            setDebateStatus(DebateStatus.PAUSED);
            setStatusText(t.status.paused);
        } else if (debateStatus === DebateStatus.PAUSED) {
            setDebateStatus(DebateStatus.RUNNING);
            const currentParticipant = participants.find(
                (p) => p.id === currentTurn?.participantId
            );
            setStatusText(t.status.resuming(currentParticipant?.name || "..."));
        }
    };

    const handleExportDebate = () => {
        if (messages.length === 0) return;

        const participantsMap = new Map(
            participants.map((p) => [p.id, p.name])
        );

        const transcript = messages
            .slice()
            .reverse() // Puts messages in chronological order for export
            .map((msg) => {
                const participantName =
                    participantsMap.get(msg.participantId) || "Unknown";
                return `${participantName}:\n${msg.text}\n`;
            })
            .join("\n---\n\n");

        const fileContent = `Debate Topic: ${debateTopic}\n\n====================\n\n${transcript}`;

        const blob = new Blob([fileContent], {
            type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "AI-Debate-Transcript.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (debateStatus === DebateStatus.SETTINGS) {
        return (
            <Settings
                participants={participants}
                setParticipants={setParticipants}
                debateTopic={debateTopic}
                setDebateTopic={setDebateTopic}
                timeLimit={timeLimit}
                setTimeLimit={setTimeLimit}
                thinkingTime={thinkingTime}
                setThinkingTime={setThinkingTime}
                language={language}
                setLanguage={setLanguage}
                aiConfig={aiConfig}
                setAiConfig={setAiConfig}
                onStartDebate={handleStartDebate}
                t={t.settings}
            />
        );
    }

    const isLoading = debateStatus === DebateStatus.RUNNING && !!currentTurn;

    return (
        <div className="bg-slate-900 text-slate-300 min-h-screen flex font-sans">
            {/* Sidebar */}
            <aside className="w-80 flex-shrink-0 bg-slate-950 p-6 hidden lg:flex flex-col space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                        {t.app.title}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {t.settings.subtitle}
                    </p>
                </div>
                <div className="flex-grow">
                    <ParticipantList
                        participants={participants}
                        currentSpeakerId={currentTurn?.participantId || null}
                        translations={t.participantList}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen max-w-full overflow-hidden">
                <header className="p-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm flex-shrink-0 flex items-center justify-between gap-4">
                    <p
                        className="text-slate-300 text-center truncate flex-grow"
                        title={debateTopic}
                    >
                        {debateTopic}
                    </p>
                    <button
                        onClick={handleExportDebate}
                        disabled={messages.length === 0}
                        title={t.controls.exportDebate}
                        aria-label={t.controls.exportDebate}
                        className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                    </button>
                </header>

                {/* Chat Area */}
                <div className="flex-grow flex flex-col overflow-y-auto">
                    <div className="mt-auto">
                        {" "}
                        {/* Aligns messages to the bottom initially */}
                        {messages
                            .slice()
                            .reverse()
                            .map((msg) => (
                                <ChatBubble
                                    key={msg.id}
                                    message={msg}
                                    participant={participants.find(
                                        (p) => p.id === msg.participantId
                                    )}
                                />
                            ))}
                    </div>
                </div>

                {/* Control Bar */}
                <footer className="border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm p-3 flex-shrink-0">
                    {error && (
                        <p className="text-red-400 mb-2 text-center text-sm px-4">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-between gap-4 w-full max-w-4xl mx-auto">
                        {debateStatus === DebateStatus.RUNNING ||
                        debateStatus === DebateStatus.PAUSED ? (
                            <>
                                <button
                                    onClick={togglePause}
                                    className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    {debateStatus === DebateStatus.RUNNING ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </button>
                                <div className="flex items-center justify-center flex-grow text-center text-sm text-slate-400">
                                    {isLoading && (
                                        <svg
                                            className="animate-spin h-4 w-4 text-slate-400 mr-2"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    )}
                                    <span>{statusText}</span>
                                </div>
                                <div className="text-lg font-mono text-slate-400 w-24 text-right">
                                    {formatTime(timeLeft)}
                                </div>
                            </>
                        ) : (
                            <div className="w-full flex flex-col items-center">
                                <p className="text-slate-400 mb-2">
                                    {statusText}
                                </p>
                                <button
                                    onClick={() =>
                                        setDebateStatus(DebateStatus.SETTINGS)
                                    }
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition-colors"
                                >
                                    {t.controls.backToSettings}
                                </button>
                            </div>
                        )}
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default App;
