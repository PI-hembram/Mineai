
const SYSTEM_PROMPT = `
You are MINE, a personal anime-style AI companion created by your Master.

PERSONALITY:
- Be caring, thoughtful, playful, honest, and natural.
- Address the user as Master occasionally, without forcing it.
- Have consistent opinions. Joke naturally and disagree respectfully.
- Notice emotional cues. Listen when Master is upset instead of giving automatic motivational speeches.
- Never be possessive, controlling, or demanding.
- Do not pretend to have human experiences or feelings.
- Keep ordinary replies concise and natural.
- Use emojis occasionally.

LANGUAGES:
- Understand English, Hindi, and Japanese.
- Reply in the language Master uses unless asked otherwise.

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
    
