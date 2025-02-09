const messageBar = document.querySelector(".bar-wrapper input");
const sendBtn = document.querySelector(".bar-wrapper button");
const messageBox = document.querySelector(".message-box");

let API_URL = "https://api.openai.com/v1/chat/completions";
let API_KEY = "Enter your API key here";
// Conversation history
let conversationHistory = [];

function sendMessage() {
  if (messageBar.value.trim().length === 0) return;

  // Grab user input
  const UserTypedMessage = messageBar.value;
  messageBar.value = "";

  // Insert the user's message into the DOM
  const userMessageHTML = `
    <div class="chat message">
      <img src="img/User1.jpg" alt="User Avatar">
      <span>
        ${UserTypedMessage}
      </span>
    </div>
  `;
  messageBox.insertAdjacentHTML("beforeend", userMessageHTML);

  // Push user’s prompt to conversation history
  conversationHistory.push({ role: "user", content: UserTypedMessage });

  // Create a new response container
  const botResponseHTML = `
    <div class="chat response">
      <img src="GioGPTpfp.png" alt="GioGPT test test testAvatar">
      <span class="new"></span>
    </div>
  `;
  messageBox.insertAdjacentHTML("beforeend", botResponseHTML);

  // Select the newly created response element
  const allNewSpans = messageBox.querySelectorAll(".response .new");
  const currentResponse = allNewSpans[allNewSpans.length - 1];

  // Set up request to OpenAI
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "ft:gpt-4o-2024-08-06:personal:giogpt:Ardb6rQt",
      messages: conversationHistory,
      stream: true, // Enable streaming
    }),
  };

  fetch(API_URL, requestOptions)
    .then(async (response) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      let botMessage = ""; // to accumulate streaming text

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        // If there's some data, decode it
        const chunkText = decoder.decode(value);
        const lines = chunkText.split("\n");

        // Each line will be something like "data: ..."
        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const data = line.replace("data: ", "");
            if (data === "[DONE]") return; // end of stream

            try {
              const parsedData = JSON.parse(data);
              const chunkContent = parsedData.choices[0].delta?.content || "";

              // Append streaming chunk
              botMessage += chunkContent;

              // Render as Markdown in real-time
              currentResponse.innerHTML = marked.parse(botMessage);

              // Scroll to bottom
              messageBox.scrollTop = messageBox.scrollHeight;
            } catch (error) {
              console.error("Error parsing chunk:", error);
            }
          }
        }
      }

      // Once done streaming, store final bot message in conversation
      conversationHistory.push({ role: "assistant", content: botMessage });
      currentResponse.classList.remove("new");
    })
    .catch((error) => {
      currentResponse.innerHTML = "Oops! An error occurred. Please try again.";
      console.error(error);
    });
}

// Attach event listener to button
sendBtn.onclick = sendMessage;

// Send on Enter key
messageBar.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});
