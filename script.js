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
    
function speakText(text) {
    if (!("speechSynthesis" in window)) {
        addMessage("MINE: Your browser doesn't support built-in speech.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(text)) {
        utterance.lang = "ja-JP";
    } else if (/[\u0900-\u097F]/.test(text)) {
        utterance.lang = "hi-IN";
    } else {
        utterance.lang = "en-IN";
    }

    utterance.rate = 0.88;
    utterance.pitch = 1.30;

    window.speechSynthesis.speak(utterance);
}

function testVoice() {
    speakText("Hi Master! I am MINE. Can you hear me?");
}

