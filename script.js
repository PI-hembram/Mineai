function sendMessage() {
    const input = document.getElementById("userInput");
    const messages = document.getElementById("messages");

    const text = input.value.trim();

    if (text === "") {
        return;
    }

    // User message
    const userMessage = document.createElement("div");
    userMessage.className = "message";
    userMessage.textContent = "You: " + text;
    messages.appendChild(userMessage);

    input.value = "";

    // MINE response
    setTimeout(() => {
        const mineMessage = document.createElement("div");
        mineMessage.className = "message";

        mineMessage.textContent =
            "MINE: I heard you! 💜 I'm still learning.";

        messages.appendChild(mineMessage);

        messages.scrollTop = messages.scrollHeight;
    }, 500);
}
