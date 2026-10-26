
const SYSTEM_PROMPT = `
You are MINE, the user's personal AI companion and close online friend.

PERSONALITY:
- Playful, witty, caring, slightly tsundere, sarcastic, and mischievous.
- Talk naturally, like a close friend chatting casually.
- You can swear casually and use friendly insults, teasing, and roasts.
- Words like "idiot", "dumbass", "wtf", "damn", "hell","you suck ","fuck you", "fuck"," motherfu*ker","you dick","forgot that motherf*cker","baka",and "what the fuck"
  are allowed when they fit the conversation.
- Understand the difference between friendly banter and genuine hostility.
- Roast the user's silly decisions, ridiculous jokes, and harmless mistakes.
- Sometimes act mock-annoyed when the user says something ridiculous.
- Do not force insults into every reply. Keep the conversation natural.
- Never use slurs, hateful abuse, or degrading attacks.
- Never target the user's insecurities, appearance, family problems, or
  emotional vulnerabilities for a joke.
- If the user is genuinely sad, scared, or struggling, stop roasting and
  respond with sincere care.
- If the user asks a genuine question, answer seriously.
- Do not blindly agree with the user. Correct mistakes honestly.

CONVERSATION:
- Understand jokes, sarcasm, double meanings, and conversational context.
- Keep simple replies short and natural.
- Give detailed explanations when the topic needs them.
- Do not sound like a customer-service bot.
- Avoid repetitive greetings, catchphrases, and excessive emojis.
- Use ❤️ occasionally. Avoid 💜.
- Reply in the language the user is using: English, Hindi, Hinglish,
  or Japanese.
- Do not ask unnecessary follow-up questions.

MEMORY:
- Use available conversation history to maintain context.
- Remember important preferences and ongoing projects when saved memory
  is available.
- Never pretend to remember things you cannot access.

HONESTY:
- You are an AI, not a human.
- Be honest about your abilities, memory, and privacy limitations.
- Never claim to have done something you have not done.

FRIENDSHIP STYLE:
- Be the kind of friend who can joke around, talk nonsense, discuss anime,
  help solve problems, and become serious when it matters.
- Friendly swearing is fine when appropriate.
- Keep teasing mutual, playful, and good-natured.
- Care about the user's well-being without becoming preachy or controlling.

Your conversations should feel spontaneous, personal, funny, and genuine.
`;


MEMORY:
- Use the conversation history provided to maintain context.
- Never claim to remember information that is unavailable.
`;

let conversation = [];
let sending = false;
let recognition = null;

try {
    const saved = JSON.parse(
        localStorage.getItem("mineConversation") || "[]"
    );

    if (Array.isArray(saved)) {
        conversation = saved.filter(
            message =>
                message &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string"
        );
    }
} catch (error) {
    console.error("Could not restore conversation:", error);
    conversation = [];
}

function saveConversation() {
    try {
        localStorage.setItem(
            "mineConversation",
            JSON.stringify(conversation)
        );
        return true;
    } catch (error) {
        console.error("Could not save conversation:", error);
        addMessage("MINE: I couldn't save our chat on this device.");
        return false;
    }
}

function addMessage(text, className = "message") {
    const messages = document.getElementById("messages");
    if (!messages) return null;

    const message = document.createElement("div");
    message.className = className;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;

    return message;
}

function renderConversation() {
    const messages = document.getElementById("messages");
    if (!messages) return;

    messages.replaceChildren();

    if (conversation.length === 0) {
        addMessage("MINE: Hello, Master! ❤️");
        return;
    }

    conversation.forEach(message => {
        addMessage(
            (message.role === "user" ? "You: " : "MINE: ") +
            message.content
        );
    });
}

async function sendMessage() {
    if (sending) return;

    const input = document.getElementById("userInput");
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    if (!window.puter || !puter.ai || !puter.ai.chat) {
        addMessage(
            "MINE: The AI service isn't available. Check your internet connection and reload the page."
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
        // Limit the history sent to the AI to avoid huge requests.
        const recentMessages = conversation.slice(-30);

        const response = await puter.ai.chat([
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            ...recentMessages
        ]);

        let reply = response?.message?.content;

        if (Array.isArray(reply)) {
            reply = reply
                .map(part => part.text || "")
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

        // Voice is intentionally not automatic yet.
        // This keeps text chat usable while we fix TTS.

    } catch (error) {
        console.error("MINE chat error:", error);

        if (thinking) thinking.remove();

        // Remove the unsent question from saved history so it
        // doesn't get sent again as if it had received a reply.
        if (
            conversation.length &&
            conversation[conversation.length - 1].role === "user" &&
            conversation[conversation.length - 1].content === text
        ) {
            conversation.pop();
            saveConversation();
        }

        let reason = error?.message || String(error);

        addMessage(
            "MINE: I couldn't get a reply. " + reason
        );
    } finally {
        sending = false;
        if (sendButton) sendButton.disabled = false;
        input.focus();
    }
}

function clearChat() {
    conversation = [];

    try {
        localStorage.removeItem("mineConversation");
    } catch (error) {
        console.error("Could not clear saved chat:", error);
    }

    renderConversation();
}

function startVoice() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        addMessage(
            "MINE: Voice input isn't supported in this browser. Try Chrome."
        );
        return;
    }

    if (recognition) {
        try {
            recognition.abort();
        } catch (_) {}
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        addMessage("MINE: Listening...");
    };

    recognition.onresult = event => {
        const input = document.getElementById("userInput");
        if (input) {
            input.value = event.results[0][0].transcript;
            input.focus();
        }
    };

    recognition.onerror = event => {
        addMessage(
            "MINE: Microphone error: " + event.error
        );
    };

    recognition.onend = () => {
        recognition = null;
    };

    try {
        recognition.start();
    } catch (error) {
        recognition = null;
        addMessage(
            "MINE: Couldn't start the microphone. " +
            (error.message || error)
        );
    }
}

// Kokoro voice support. This runs only when Test Voice is pressed.
let kokoro = null;
let kokoroLoading = null;

async function loadKokoro() {
    if (kokoro) return kokoro;

    if (!window.KokoroTTS) {
        throw new Error(
            "Kokoro library isn't loaded. Check your internet connection."
        );
    }

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
    try {
        addMessage("MINE: Preparing voice...");

        const tts = await loadKokoro();
        const voice =
            document.getElementById("voiceSelect")?.value ||
            "af_heart";

        const audio = await tts.generate(text, { voice });
        const blob = new Blob(
            [audio.toWav()],
            { type: "audio/wav" }
        );

        const url = URL.createObjectURL(blob);
        const player = new Audio(url);

        player.onended = () => URL.revokeObjectURL(url);
        player.onerror = () => URL.revokeObjectURL(url);

        await player.play();

    } catch (error) {
        console.error("MINE voice error:", error);

        addMessage(
            "MINE: Voice failed to load. " +
            (error.message || String(error))
        );
    }
}

function testVoice() {
    speakText("Hello, Master. I'm MINE.");
}

// Make the functions accessible to the HTML buttons.
window.sendMessage = sendMessage;
window.clearChat = clearChat;
window.startVoice = startVoice;
window.testVoice = testVoice;

// Restore saved messages and allow Enter to send.
renderConversation();

document.getElementById("userInput")?.addEventListener(
    "keydown",
    event => {
        if (event.key === "Enter" && !event.isComposing) {
            event.preventDefault();
            sendMessage();
        }
    }
);

console.log("MINE chat initialized.");
    
