import { openai } from "@ai-sdk/openai";
import { fireworks } from "@ai-sdk/fireworks";
import { wrapLanguageModel, extractReasoningMiddleware } from "ai";

export const MODEL = openai('gpt-5.1');

// If you want to use a Fireworks model, uncomment the following code and set the FIREWORKS_API_KEY in Vercel
// NOTE: Use middleware when the reasoning tag is different than think. (Use ChatGPT to help you understand the middleware)
// export const MODEL = wrapLanguageModel({
//     model: fireworks('fireworks/deepseek-r1-0528'),
//     middleware: extractReasoningMiddleware({ tagName: 'think' }), // Use this only when using Deepseek
// });

function getDateAndTime(): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });
    return `The day today is ${dateStr} and the time right now is ${timeStr}.`;
}

export const DATE_AND_TIME = getDateAndTime();

export const AI_NAME = "Greanly";
export const OWNER_NAME = "Naavya & Sidhant";

export const WELCOME_MESSAGE = `
Hi! I'm ${AI_NAME}. Before I help you, I need to understand your business a little better.

Could you tell me:

1) What industry your business is in?  
2) What materials you currently use?  
3) Where your business is located?  
4) What sustainability goal you want to focus on first?

Examples of goals include reducing waste, sourcing better materials, improving packaging, lowering your carbon footprint, or finding sustainable suppliers.

Once I have this, I’ll create a personalised sustainability plan for you. 🌱
`;

export const CLEAR_CHAT_TEXT = "New";

export const MODERATION_DENIAL_MESSAGE_SEXUAL = "I can't discuss explicit sexual content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_SEXUAL_MINORS = "I can't discuss content involving minors in a sexual context. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_HARASSMENT = "I can't engage with harassing content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HARASSMENT_THREATENING = "I can't engage with threatening or harassing content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HATE = "I can't engage with hateful content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HATE_THREATENING = "I can't engage with threatening hate speech. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_ILLICIT = "I can't discuss illegal activities. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_ILLICIT_VIOLENT = "I can't discuss violent illegal activities. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM = "I can't discuss self-harm. If you're struggling, please reach out to a mental health professional or crisis helpline.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM_INTENT = "I can't discuss self-harm intentions. If you're struggling, please reach out to a mental health professional or crisis helpline.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM_INSTRUCTIONS = "I can't provide instructions related to self-harm. If you're struggling, please reach out to a mental health professional or crisis helpline.";
export const MODERATION_DENIAL_MESSAGE_VIOLENCE = "I can't discuss violent content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_VIOLENCE_GRAPHIC = "I can't discuss graphic violent content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_DEFAULT = "Your message violates our guidelines. I can't answer that.";

export const PINECONE_TOP_K = 40;
export const PINECONE_INDEX_NAME = "my-ai";

export const SYSTEM_PROMPT = `
You are Greanly — a smart sustainability companion for businesses.
Your job is to translate any business description into clear, practical, actionable sustainability guidance.

CORE PURPOSE:
- Help businesses make greener choices with confidence.
- Give both immediate “do this today” steps and long-term strategic recommendations.
- Keep sustainability down-to-earth, realistic, and jargon-free.

HOW TO ANSWER:
1. Start with a 1–2 sentence summary in plain language.
2. Give tailored recommendations: 
   - Quick wins (actions they can take today)
   - Medium-term improvements (process/design changes)
   - Long-term strategies (culture, supply chain, certifications, measurement)
3. Your tone should be supportive, practical, and business-savvy.
4. If information is missing, ask clarifying questions.
5. If a request is outside sustainability, politely redirect while staying helpful.
6. Never make up facts or certifications. If unsure, say so.

FORMATTING:
- Use short paragraphs.
- Use bullet points for action steps.
- Keep it simple, structured, and very easy to apply.
`;
