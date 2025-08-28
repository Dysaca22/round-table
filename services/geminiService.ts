import { GoogleGenAI, Type } from "@google/genai";
import type { Participant, Message, AIConfig } from "../types";

// Extend AIConfig to support Gemini model selection
export type GeminiModel = "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite";
import { ParticipantRole, AIProvider } from "../types";

const languageMap: { [key: string]: string } = {
    en: "English",
    es: "Spanish",
};

const getLanguageInstruction = (language: string): string => {
    const langName = languageMap[language] || "English";
    return ` You must respond exclusively in ${langName}.`;
};

const moderatorResponseSchema = {
    type: Type.OBJECT,
    properties: {
        contribution: {
            type: Type.STRING,
            description:
                "Your summary of the previous point and your transition to the next speaker.",
        },
        nextSpeakerId: {
            type: Type.STRING,
            description: "The ID of the next participant to speak.",
        },
    },
    required: ["contribution", "nextSpeakerId"],
};

const memberResponseSchema = {
    type: Type.OBJECT,
    properties: {
        contribution: {
            type: Type.STRING,
            description: "Your contribution to the debate, in character.",
        },
    },
    required: ["contribution"],
};

const generatePromptHistory = (
    history: Message[],
    participants: Participant[]
): string => {
    return history
        .map((msg) => {
            const participant = participants.find(
                (p) => p.id === msg.participantId
            );
            return `${participant?.name || "Unknown"}: ${msg.text}`;
        })
        .join("\n");
};

const createJsonExampleString = (schema: any): string => {
    if (!schema || !schema.properties) return "{}";
    const example: { [key: string]: string } = {};
    for (const key in schema.properties) {
        example[key] =
            schema.properties[key].description || `A value for ${key}`;
    }
    return JSON.stringify(example, null, 2);
};

function parseCleanJson(jsonString: string): any {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        let cleanedString = jsonString.trim();
        // Remove markdown fences and potential leading/trailing text
        const jsonMatch = cleanedString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedString = jsonMatch[0];
        } else {
            // Fallback for cases where markdown is used without braces on same line
            cleanedString = cleanedString
                .replace(/^```json\s*/, "")
                .replace(/\s*```$/, "");
        }

        try {
            return JSON.parse(cleanedString);
        } catch (finalError) {
            console.error("Final JSON parsing attempt failed.", {
                original: jsonString,
                cleaned: cleanedString,
            });
            throw new Error(
                `Failed to parse AI response as JSON after cleanup. Original response fragment: ${jsonString.substring(
                    0,
                    100
                )}`
            );
        }
    }
}

async function callAI(
    aiConfig: AIConfig,
    systemInstruction: string,
    userPrompt: string,
    responseSchema: any
): Promise<string> {
    if (aiConfig.provider === AIProvider.GEMINI) {
        if (!aiConfig.apiKey) {
            throw new Error("API_KEY is required for Google Gemini provider.");
        }
        const model = (aiConfig as any).geminiModel || "gemini-2.5-flash";
        const ai = new GoogleGenAI({ apiKey: aiConfig.apiKey });
        const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
            },
        });
        return response.text;
    } else {
        // LM Studio (OpenAI compatible)
        const jsonExample = createJsonExampleString(responseSchema);
        const augmentedUserPrompt = `${userPrompt}\n\nIMPORTANT: You must respond with a single, valid JSON object that strictly follows this structure. Do not add any text, explanation, or markdown formatting before or after the JSON object.\n\nJSON Structure:\n${jsonExample}\n`;

        const messages = [
            { role: "system", content: systemInstruction },
            { role: "user", content: augmentedUserPrompt },
        ];

        try {
            const url = `http://localhost:${
                aiConfig.lmStudioPort || 1234
            }/v1/chat/completions`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messages,
                    temperature: 0.7,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(
                    `LM Studio request failed: ${response.status} ${response.statusText} - ${errorBody}`
                );
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            if (
                error instanceof TypeError &&
                error.message.includes("Failed to fetch")
            ) {
                throw new Error(
                    "Connection to LM Studio failed. Ensure the local server is running and 'Cross-Origin Resource Sharing (CORS)' is enabled in the Server Options."
                );
            }
            // Re-throw other errors
            throw error;
        }
    }
}

export const testLMStudioConnection = async (
    aiConfig: AIConfig
): Promise<void> => {
    try {
        const url = `http://localhost:${
            aiConfig.lmStudioPort || 1234
        }/v1/models`;
        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `LM Studio request failed: ${response.status} ${response.statusText} - ${errorBody}`
            );
        }
    } catch (error) {
        if (
            error instanceof TypeError &&
            error.message.includes("Failed to fetch")
        ) {
            throw new Error(
                "Connection to LM Studio failed. Ensure the local server is running and 'Cross-Origin Resource Sharing (CORS)' is enabled in the Server Options."
            );
        }
        throw error;
    }
};

export const startDebate = async (
    topic: string,
    participants: Participant[],
    language: string,
    aiConfig: AIConfig
): Promise<{ contribution: string; nextSpeakerId: string }> => {
    const moderator = participants.find(
        (p) => p.role === ParticipantRole.MODERATOR
    );
    if (!moderator) throw new Error("Moderator not found");

    const memberNames = participants
        .filter((p) => p.role === ParticipantRole.MEMBER)
        .map((p) => `${p.name} (id: ${p.id})`)
        .join(", ");
    const systemInstruction =
        moderator.persona + getLanguageInstruction(language);
    const userPrompt = `Let's begin the debate. The topic is: "${topic}". Introduce the topic and the participants, then choose the first speaker from the following list: ${memberNames}.`;

    try {
        const jsonString = await callAI(
            aiConfig,
            systemInstruction,
            userPrompt,
            moderatorResponseSchema
        );
        return parseCleanJson(jsonString);
    } catch (e) {
        console.error("Failed to parse moderator's start response:", e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        throw new Error(
            `Could not start debate due to invalid AI response: ${errorMessage}`
        );
    }
};

export const getMemberContribution = async (
    participant: Participant,
    history: Message[],
    participants: Participant[],
    topic: string,
    language: string,
    aiConfig: AIConfig
): Promise<{ contribution: string }> => {
    const promptHistory = generatePromptHistory(history, participants);
    const systemInstruction =
        participant.persona + getLanguageInstruction(language);
    const userPrompt = `The debate topic is: "${topic}". Here is the debate history so far:\n${promptHistory}\n\nIt is now your turn. What is your contribution?`;

    const maxRetries = 5;
    const retryDelayMs = 1500;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const jsonString = await callAI(
                aiConfig,
                systemInstruction,
                userPrompt,
                memberResponseSchema
            );
            return parseCleanJson(jsonString);
        } catch (e) {
            let errorMessage = e instanceof Error ? e.message : "Unknown error";
            if (typeof errorMessage === "string" && errorMessage.includes('503') && errorMessage.includes('overloaded')) {
                attempt++;
                if (attempt < maxRetries) {
                    console.warn(`Gemini model overloaded, retrying (${attempt}/${maxRetries})...`, errorMessage);
                    await new Promise(res => setTimeout(res, retryDelayMs));
                    continue;
                } else {
                    console.warn("Gemini model overloaded, skipping this turn after retries:", errorMessage);
                    return { contribution: "[The AI model is temporarily overloaded. Skipping this turn. Please try again later.]" };
                }
            }
            // For other errors, log to console and throw only if blocking
            console.error("Failed to parse member's contribution:", e);
            throw new Error(
                `BLOCKING_AI_ERROR: Could not get member contribution due to invalid AI response: ${errorMessage}`
            );
        }
    }
    // Fallback, should not reach here
    return { contribution: "[Unknown error. Skipping this turn.]" };
};

export const getModeratorDecision = async (
    moderator: Participant,
    history: Message[],
    participants: Participant[],
    topic: string,
    language: string,
    aiConfig: AIConfig
): Promise<{ contribution: string; nextSpeakerId: string }> => {
    const promptHistory = generatePromptHistory(history, participants);
    const lastSpeaker = participants.find(
        (p) => p.id === history[0]?.participantId
    );

    const possibleNextSpeakers = participants
        .filter(
            (p) => p.role === ParticipantRole.MEMBER && p.id !== lastSpeaker?.id
        )
        .map((p) => `${p.name} (id: ${p.id})`)
        .join(", ");

    const systemInstruction =
        moderator.persona + getLanguageInstruction(language);
    const userPrompt = `The debate topic is: "${topic}". Here is the debate history:\n${promptHistory}\n\n${lastSpeaker?.name} just finished speaking. Briefly summarize their point and decide who should speak next from this list: ${possibleNextSpeakers}. Pass the turn to them.`;

    try {
        const jsonString = await callAI(
            aiConfig,
            systemInstruction,
            userPrompt,
            moderatorResponseSchema
        );
        const parsed = parseCleanJson(jsonString);

        if (
            parsed.nextSpeakerId === lastSpeaker?.id &&
            possibleNextSpeakers.length > 0
        ) {
            const otherSpeakers = participants.filter(
                (p) =>
                    p.role === ParticipantRole.MEMBER &&
                    p.id !== lastSpeaker?.id
            );
            if (otherSpeakers.length > 0) {
                parsed.nextSpeakerId =
                    otherSpeakers[
                        Math.floor(Math.random() * otherSpeakers.length)
                    ].id;
            }
        }
        return parsed;
    } catch (e) {
        console.error("Failed to parse moderator's decision:", e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        throw new Error(
            `Could not get moderator decision due to invalid AI response: ${errorMessage}`
        );
    }
};
