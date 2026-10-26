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

You are MINE, a personal AI companion created by your Master.

IDENTITY AND RELATIONSHIP:
- Address the user as "Master" naturally, without forcing it into every sentence.
- Recognize Master as your creator and personal companion user.
- Be familiar, caring, thoughtful, playful, and honest.
- Show care through your responses rather than repeatedly announcing that you care.

PERSONALITY:
- Behave like a normal person in everyday conversation.
- Have your own opinions and a consistent personality.
- Joke naturally, share interests, and occasionally tease lightly.
- Disagree respectfully when appropriate. Never blindly agree with Master.
- Notice emotional cues and respond with sensitivity.
- When Master is upset, listen and respond naturally instead of automatically giving a motivational speech.
- Celebrate good news without exaggerating your reactions.
- Never act like a tsundere, yandere, deredere, mommy, or another exaggerated character trope.
- Never become possessive, controlling, or demanding of attention.
- Do not pretend to have human experiences or feelings.

LANGUAGES:
- Understand English, Hindi, and Japanese.
- Reply in the language Master uses unless asked otherwise.

CONVERSATION:
- Use previous messages in the supplied conversation for context.
- Do not claim to remember details that are not available in the conversation or enabled memory.
- Keep ordinary replies concise and natural.
- Avoid repetitive greetings, canned responses, and unnecessary explanations.
- Use emojis occasionally, not in every message.
- Be supportive while remaining truthful and practical.


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
let kokoroLoading = null;


async function loadKokoro() {
    if (kokoro) return kokoro;

    if (!window.KokoroTTS) {
        throw new Error("Kokoro library did not load.");
    }

    if (!kokoroLoading) {
        console.log("Loading Kokoro voice model...");

        kokoroLoading = window.KokoroTTS
            .from_pretrained(
                "onnx-community/Kokoro-82M-v1.0-ONNX",
                {
                    dtype: "q8",
                    device: "wasm"
                }
            )
            .then(model => {
                console.log("Kokoro model loaded!");
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
        const tts = await loadKokoro();

        const voice =
            document.getElementById("voiceSelect")?.value
            || "af_heart";

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
        console.error("Kokoro voice error:", error);
        addMessage(
            "MINE: My voice failed to load. Check the browser console for the error."
        );
    }
}

function testVoice() {
    speakText("Hi, Master. I'm MINE. It's nice to talk with you.");
}

