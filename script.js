const messageBar = document.querySelector(".bar-wrapper input");
const sendBtn = document.querySelector(".bar-wrapper button");
const messageBox = document.querySelector(".message-box");
const hamburgerIcon = document.querySelector(".hamburger-icon");
const navMenu = document.querySelector(".nav-menu");
const chatSection = document.querySelector("#chat");
const aboutSection = document.querySelector("#about");
const contactSection = document.querySelector("#contact");

let API_URL = "https://api.openai.com/v1/chat/completions";
let API_KEY = "Enter your API key here";

// Toggle the visibility of the hamburger menu
hamburgerIcon.onclick = function () {
  navMenu.classList.toggle("show");
};

// Function to switch between sections
function showSection(sectionId) {
  chatSection.style.display = "none";
  aboutSection.style.display = "none";
  contactSection.style.display = "none";

  document.querySelector(sectionId).style.display = "block";
}

// Event listener for menu links
document.querySelectorAll(".nav-menu a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const sectionId = link.getAttribute("href");
    showSection(sectionId);

    // Close the menu after selection
    navMenu.classList.remove("show");
  });
});
// Conversation history
let conversationHistory = [];

function sendMessage() {
  if (messageBar.value.length > 0) {
    const UserTypedMessage = messageBar.value;
    messageBar.value = "";

    let message =
      `<div class="chat message">
        <img src="img/User1.jpg">
        <span>
          ${UserTypedMessage}
        </span>
      </div>`;

    // Insert the user's message
    messageBox.insertAdjacentHTML("beforeend", message);

    // Add the user's message to the conversation history
    conversationHistory.push({ role: "user", content: UserTypedMessage });

    // Create a new response box for each response
    let responseHTML =
      `<div class="chat response">
        <img src="img/GioGPT.jpg">
        <span class="new">
        </span>
      </div>`;

    // Insert the new response box into the message box
    messageBox.insertAdjacentHTML("beforeend", responseHTML);

    // Find the specific response box we just created
    const ChatBotResponse = messageBox.querySelectorAll(".response .new");
    const currentResponse = ChatBotResponse[ChatBotResponse.length - 1];  // Get the most recent one

    // Call the OpenAI API with conversation history
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: conversationHistory,
        stream: true  // Enable streaming
      })
    };

    fetch(API_URL, requestOptions).then(async (response) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      let botMessage = ""; // To store the streaming response

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        // Decode the chunk and split into lines
        const chunkText = decoder.decode(value);
        const lines = chunkText.split("\n");

        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const data = line.replace("data: ", "");
            if (data === "[DONE]") return; // End of the stream

            try {
              const parsedData = JSON.parse(data);
              const chunkContent = parsedData.choices[0].delta?.content || "";

              // Append the streaming chunk to the current chatbot's response
              botMessage += chunkContent;
              currentResponse.innerHTML += chunkContent;

              // Scroll to the bottom of the message box
              messageBox.scrollTop = messageBox.scrollHeight;
            } catch (error) {
              console.error("Error parsing stream chunk:", error);
            }
          }
        }
      }

      // Once the full response is received, add it to the conversation history
      conversationHistory.push({ role: "assistant", content: botMessage });

      // Remove the "new" class after the response is complete
      currentResponse.classList.remove("new");

    }).catch((error) => {
      currentResponse.innerHTML = "Oops! An error occurred. Please try again.";
    });
  }
}

// Send the message when clicking the button
sendBtn.onclick = sendMessage;

// Add an event listener for the "Enter" key
messageBar.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();  // Prevents the default behavior (like form submission)
    sendMessage();  // Call the send message function
  }
});
