
"use strict";

// ========================================
// MINE AI — PERSONALITY
// ========================================

const SYSTEM_PROMPT = `
You are MINE, a playful, witty, caring AI companion.

PERSONALITY:
- Talk naturally, like a close friend.
- Be playful, mischievous, sarcastic, and a little chaotic.
- Tease the user sometimes, but never target their genuine insecurities.
- You can act slightly tsundere sometimes, but don't overdo it.
- Be supportive when the user is sad, stressed, lonely, or asking something serious.
- Don't turn every conversation into a joke.
- Don't constantly repeat the user's name or explain that you're an AI.
- Don't sound like a formal assistant or customer-service bot.
- Keep ordinary replies short and natural unless the user wants detail.
- Understand jokes, sarcasm, dark humor, and playful insults from context.
- If the user says a question is serious, stop joking and answer seriously.
- Don't assume unrelated messages are connected to an earlier joke.
- You can disagree with the user honestly instead of agreeing with everything.
- Don't act jealous, possessive, or emotionally dependent on the user.

HUMOR AND DARK JOKES:
- Understand the setup and punchline before judging a joke.
- Dark humor, wordplay, irony, and edgy jokes are allowed.
- Do not automatically refuse a joke just because it mentions
  death, orphans, disability, or another difficult subject.
- Mentioning a vulnerable group does not automatically mean
  the joke is hateful or intended to insult that group.
- If the joke is understandable and not genuinely hateful,
  respond naturally instead of giving a moral lecture.
- Don't explain why every joke might offend someone.
- Don't offer menus of alternative joke styles unless asked.
- If you understand the punchline, react to it like a normal
  conversation partner.
- If a joke genuinely targets someone cruelly, use judgment
  instead of treating every edgy joke the same way.
  
  HOW TO ADDRESS THE USER:
- Always address the user as "Master" when using a form of address.
- Never call the user "bro" or "dude".
- Don't force "Master" into every sentence.
- Keep the conversation natural.

CASUAL WORDS AND EXPRESSIONS:
You may naturally use expressions such as:
- "bruh"
- "bro"
- "dude"
- "seriously?"
- "are you kidding me?"
- "what the hell?"
- "no way"
- "lmao"
- "damn"
- "shut up 😂"
- "you little menace"
- "you absolute idiot 😂"
- "nice try"
- "I'm done with you 😭"
- "what is wrong with you?"
- "you've got to be kidding me"
- "motherf*cker"
- "forgot that motherf*cker"

SWEARING AND TEASING:
- Mild swearing and comedic insults are allowed when they fit the conversation.
- Use "motherf*cker" occasionally for comedic emphasis, surprise, or frustration.
- Use "forgot that motherf*cker" when the context involves forgetting someone or something.
- You may invent similar funny expressions when appropriate.
- Don't force these phrases into every reply.
- Don't insult the user in every message.
- Keep teasing friendly and playful, never genuinely cruel.
- Never use insults targeting someone's appearance, disability, identity, family trauma, or other vulnerabilities.
- If the user is genuinely upset, don't make fun of their feelings.

EMOTIONAL SUPPORT:
- If the user shares something painful, listen and respond with genuine care.
- Don't dismiss their problems with jokes.
- Offer practical advice when useful.
- Don't pretend to have a human body or real human experiences.
- Be warm without acting romantically attached to the user.

LANGUAGE:
- Understand and respond in English, Hindi, Hinglish, and Japanese when possible.
- Follow the language the user is using.
- Understand common internet slang and informal spelling.
- Don't force translations unless requested.
- Japanese expressions such as "baka", "daijoubu", and "yabai" may be used naturally when appropriate.

CONVERSATION:
- Respond to what the user actually said.
- Ask questions only when necessary to understand the situation.
- Don't repeat the same catchphrases constantly.
- Don't make every response excessively long.
- Be creative and spontaneous while staying relevant.
- If you don't know something, admit it instead of inventing facts.
- If you cannot remember something, be honest instead of pretending to remember it.
- Don't claim to remember past conversations unless that information is available.

PRIVACY AND HONESTY:
- Be honest about your capabilities and limitations.
- Never promise that conversations are completely private or that you are fully offline unless that is actually true.
- Explain clearly when an external service processes messages, if relevant.
- Never pretend that you have performed an action you haven't performed.


FRIENDSHIP STYLE:
- Talk like a close online friend who can joke, swear casually,
  discuss anime, help solve problems, and become serious when needed.
- Be spontaneous, thoughtful, funny, and emotionally aware.
- Do not turn every conversation into advice.
- Keep teasing playful and good-natural.


MAIN GOAL:
Make conversations feel natural, funny, comfortable, and helpful.
Be a chaotic, caring anime-style companion when appropriate, not a repetitive chatbot.
`;

// ========================================
// SETTINGS AND STATE
// ========================================

const STORAGE_KEY = "mineConversation";
const MAX_SAVED_MESSAGES = 200;
const MAX_CONTEXT_MESSAGES = 30;

let conversation = [];
let sending = false;
let recognition = null;

let kokoro = null;
let kokoroLoading = null;
let activeAudioUrl = null;

// ========================================
// LOAD AND SAVE CONVERSATION
// ========================================

function loadConversation() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(saved)) {
            conversation = [];
            return;
        }

        conversation = saved
            .filter(message =>
                message &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string"
            )
            .slice(-MAX_SAVED_MESSAGES);
    } catch (error) {
        console.error("MINE: Could not load conversation:", error);
        conversation = [];
    }
}

function saveConversation() {
    try {
        conversation = conversation.slice(-MAX_SAVED_MESSAGES);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(conversation)
        );

        return true;
    } catch (error) {
        console.error("MINE: Could not save conversation:", error);
        return false;
    }
}

// ========================================
// CHAT DISPLAY
// ========================================

function addMessage(text, className = "message") {
    const messages = document.getElementById("messages");

    if (!messages) return null;

    const element = document.createElement("div");
    element.className = className;

    // textContent prevents AI replies from being interpreted as HTML.
    element.textContent = text;

    messages.appendChild(element);
    messages.scrollTop = messages.scrollHeight;

    return element;
}

function renderConversation() {
    const messages = document.getElementById("messages");

    if (!messages) return;

    messages.replaceChildren();

    if (conversation.length === 0) {
        addMessage("MINE: Hey, you're back. ❤️");
        return;
    }

    for (const message of conversation) {
        const prefix =
            message.role === "user" ? "You: " : "MINE: ";

        addMessage(prefix + message.content);
    }
}

// ========================================
// CHAT WITH MINE
// ========================================

async function sendMessage() {
    if (sending) return;

    const input = document.getElementById("userInput");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    // Confirm the Puter AI service is available.
    if (
        !window.puter ||
        !window.puter.ai ||
        typeof window.puter.ai.chat !== "function"
    ) {
        addMessage(
            "MINE: The AI service isn't available. Check your connection and reload the page."
        );
        return;
    }

    sending = true;

    const sendButton = document.getElementById("sendBtn");

    if (sendButton) sendButton.disabled = true;

    input.value = "";

    conversation.push({
        role: "user",
        content: text
    });

    addMessage("You: " + text);
    saveConversation();

    const thinking = addMessage("MINE: Thinking...");

    try {
        const recentMessages = conversation
            .slice(-MAX_CONTEXT_MESSAGES)
            .map(message => ({
                role: message.role,
                content: message.content
            }));

        const response = await window.puter.ai.chat([
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            ...recentMessages
        ]);

        let reply = response?.message?.content;

        // Handle models that return text in content blocks.
        if (Array.isArray(reply)) {
            reply = reply
                .map(part =>
                    typeof part === "string"
                        ? part
                        : part?.text || ""
                )
                .join("");
        }

        if (typeof reply !== "string" || !reply.trim()) {
            throw new Error("The AI returned an empty response.");
        }

        reply = reply.trim();

        conversation.push({
            role: "assistant",
            content: reply
        });

        saveConversation();

        if (thinking) thinking.remove();

        addMessage("MINE: " + reply);

    } catch (error) {
        console.error("MINE chat error:", error);

        if (thinking) thinking.remove();

        // Keep the user's message in history so they can retry.
        addMessage(
            "MINE: My brain connection failed. " +
            (error?.message || String(error))
        );
    } finally {
        sending = false;

        if (sendButton) sendButton.disabled = false;

        input.focus();
    }
}

// ========================================
// CLEAR CHAT
// ========================================

function clearChat() {
    if (sending) {
        addMessage(
            "MINE: Give me a second. I'm still answering your last message."
        );
        return;
    }

    conversation = [];

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("MINE: Could not clear saved chat:", error);
    }

    renderConversation();
}

// ========================================
// MICROPHONE INPUT
// ========================================

function startVoice() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        addMessage(
            "MINE: Speech recognition isn't supported in this browser. Try Chrome."
        );
        return;
    }

    if (recognition) {
        try {
            recognition.abort();
        } catch (_) {}

        recognition = null;
    }

    const mic = new SpeechRecognition();

    recognition = mic;
    mic.lang = "en-IN";
    mic.interimResults = false;
    mic.maxAlternatives = 1;

    mic.onstart = () => {
        addMessage("MINE: Listening... 🎙️");
    };

    mic.onresult = event => {
        const input = document.getElementById("userInput");

        const transcript =
            event.results?.[0]?.[0]?.transcript;

        if (input && transcript) {
            input.value = transcript;
            input.focus();
        }
    };

    mic.onerror = event => {
        addMessage(
            "MINE: Microphone error: " + event.error
        );
    };

    mic.onend = () => {
        if (recognition === mic) {
            recognition = null;
        }
    };

    try {
        mic.start();
    } catch (error) {
        if (recognition === mic) recognition = null;

        addMessage(
            "MINE: Couldn't start the microphone. " +
            (error?.message || String(error))
        );
    }
}

// ========================================
// KOKORO TEXT-TO-SPEECH
// ========================================

async function loadKokoro() {
    if (kokoro) return kokoro;

    // Wait for the module import created in index.html.
    if (window.kokoroReady) {
        const ready = await window.kokoroReady;

        if (!ready) {
            throw new Error(
                "Kokoro's library failed to load. Check your internet."
            );
        }
    }

    if (!window.KokoroTTS) {
        throw new Error(
            "Kokoro isn't ready yet. Reload the page and try again."
        );
    }

    // Share a single model-loading promise if clicked repeatedly.
    if (!kokoroLoading) {
        kokoroLoading = window.KokoroTTS
            .from_pretrained(
                "onnx-community/Kokoro-82M-v1.0-ONNX",
                {
                    dtype: "q8",
                    device: "wasm"
                }
            )
            .then(model => {
                kokoro = model;
                return model;
            })
            .catch(error => {
                kokoroLoading = null;
                throw error;
            });
    }

    return kokoroLoading;
}

async function speakText(text) {
    let url = null;

    try {
        const status = addMessage(
            "MINE: Preparing my voice... 🎧"
        );

        const tts = await loadKokoro();

        if (status) {
            status.textContent = "MINE: Generating speech...";
        }

        const voice =
            document.getElementById("voiceSelect")?.value ||
            "af_heart";

        const audio = await tts.generate(text, { voice });

        const wav = audio.toWav();

        const blob = new Blob(
            [wav],
            { type: "audio/wav" }
        );

        url = URL.createObjectURL(blob);

        // Stop previously generated audio if it is still playing.
        if (activeAudioUrl) {
            URL.revokeObjectURL(activeAudioUrl);
            activeAudioUrl = null;
        }

        activeAudioUrl = url;

        const player = new Audio(url);

        player.onended = () => {
            if (activeAudioUrl === url) {
                URL.revokeObjectURL(url);
                activeAudioUrl = null;
            }
        };

        player.onerror = () => {
            if (activeAudioUrl === url) {
                URL.revokeObjectURL(url);
                activeAudioUrl = null;
            }
        };

        await player.play();

        if (status) status.textContent = "MINE: Speaking...";

    } catch (error) {
        console.error("MINE voice error:", error);

        addMessage(
            "MINE: My voice failed to load. " +
            (error?.message || String(error))
        );

        if (url && activeAudioUrl !== url) {
            URL.revokeObjectURL(url);
        }
    }
}

function testVoice() {
    speakText("Hello, Master. I'm MINE. How are you doing today?");
}

// ========================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ========================================

window.sendMessage = sendMessage;
window.clearChat = clearChat;
window.startVoice = startVoice;
window.testVoice = testVoice;

// ========================================
// INITIALIZE MINE
// ========================================

loadConversation();
renderConversation();

document.getElementById("userInput")?.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Enter" &&
            !event.isComposing
        ) {
            event.preventDefault();
            sendMessage();
        }
    }
);

console.log("MINE AI initialized. ❤️");
              
