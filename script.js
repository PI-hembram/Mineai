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
  function speakText(text) {
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();

    let lang = "en-US";

    // Japanese
    if (/[\u3040-\u30ff\u3400-\u9fff]/.test(text)) {
        lang = "ja-JP";
    }
    // Hindi / Devanagari
    else if (/[\u0900-\u097F]/.test(text)) {
        lang = "hi-IN";
    }

    // Find a voice matching the detected language
    let voice = voices.find(v => v.lang === lang);

    if (!voice) {
        voice = voices.find(v => v.lang.startsWith(lang.split("-")[0]));
    }

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = lang;
    speech.voice = voice || null;

    // Softer anime-style delivery
    speech.rate = 0.92;
    speech.pitch = 1.18;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);
}
