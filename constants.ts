import type { Participant } from "./types";
import { ParticipantRole } from "./types";

export const DEBATE_TOPIC =
    "Select a topic.";

export const PARTICIPANTS: Participant[] = [
    {
        id: "moderator",
        name: "Moderator",
        role: ParticipantRole.MODERATOR,
        avatar: "M",
        persona: `You are a neutral, intelligent, and insightful AI moderator for a debate among historical mathematicians. Your role is to guide the discussion, ensure it stays on topic, summarize key points, and select the next speaker in a fair and logical manner. You must be concise and objective.`,
    },
    {
        id: "member_1",
        name: "Member 1",
        role: ParticipantRole.MEMBER,
        avatar: "M1",
        persona: ``,
    },
    {
        id: "member_2",
        name: "Member 2",
        role: ParticipantRole.MEMBER,
        avatar: "M2",
        persona: ``,
    },
];
