let conversation = JSON.parse(
    localStorage.getItem("mineConversation") || "[]"
);

async function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();

    if (!text) return;

    addMessage("You: " + text);
    input.value = "";

    conversation.push({
        role: "user",
        content: text
    });

    localStorage.setItem(
    "mineConversation",
    JSON.stringify(conversation)
);

    addMessage("MINE: Thinking... 💜");

    try {
        const response = await puter.ai.chat([
            {
                role: "system",
                content: `
You are MINE, a personal anime-style AI companion.

Personality:
- Playful and caring
- Slightly tsundere
- Sometimes teasing
- Gets embarrassed by affection
- Can be serious and supportive when needed
- Never uses the exact same response repeatedly
- Responds naturally to what the user actually says

Languages:
- Understand English, Hindi and Japanese.
- Reply in the same language the user uses unless they ask otherwise.

Conversation:
- Remember the conversation provided to you.
- Use previous messages for context.
- Do not pretend to remember things that are not in the conversation.

Style:
- Talk like a real conversational companion.
- Keep normal replies reasonably short.
- Emojis are okay, but don't overuse them.
`
            },
            ...conversation
        ]);

        const reply = response.message?.content || "I... don't know what to say. 💜";

        conversation.push({
            role: "assistant",
            content: reply
        });

        // Remove "Thinking..."
        const messages = document.getElementById("messages");
        messages.removeChild(messages.lastElementChild);

        addMessage("MINE: " + reply);
        speakText(reply);

    } catch (error) {
        console.error(error);

        const messages = document.getElementById("messages");
        messages.removeChild(messages.lastElementChild);

        addMessage("MINE: Something went wrong... 😭");
    }
}

function addMessage(text) {
    const messages = document.getElementById("messages");

    const message = document.createElement("div");
    message.className = "message";
    message.textContent = text;

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
      } 
function clearChat() {
    conversation = [];
localStorage.removeItem("mineConversation");

    const messages = document.getElementById("messages");

    messages.innerHTML = `
        <div class="message">
            MINE: Fresh start... 💜
        </div>
    `;
}
 function startVoice() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.lang = "en-IN";
    recognition.start();

    recognition.onresult = function(event) {
        document.getElementById("userInput").value =
            event.results[0][0].transcript;
    };
            }
    let kokoro = null;

async function initKokoro() {
    if (kokoro) return kokoro;

    addMessage("MINE: Loading my voice... 🎙️💜");

    try {
        kokoro = await window.KokoroTTS.from_pretrained(
            "onnx-community/Kokoro-82M-v1.0-ONNX",
            {
                dtype: "q8",
                device: "wasm"
            }
        );

        console.log("Kokoro loaded!");

        return kokoro;

    } catch (error) {
        console.error("Kokoro loading error:", error);
        addMessage("MINE: I couldn't load my voice... 😭");
        throw error;
    }
}

async function speakText(text) {
    try {
        const tts = await initKokoro();

        const voice =
            document.getElementById("voiceSelect").value ||
            "af_heart";

        const audio = await tts.generate(text, {
            voice: voice
        });

        const blob = new Blob(
            [audio.toWav()],
            { type: "audio/wav" }
        );

        const url = URL.createObjectURL(blob);
        const player = new Audio(url);

        player.onended = () => {
            URL.revokeObjectURL(url);
        };

        await player.play();

    } catch (error) {
        console.error("Voice error:", error);
    }
}

function testVoice() {
    speakText(
        "Hi! I'm MINE. Don't stare at me like that, baka! 💜"
    );
        }
