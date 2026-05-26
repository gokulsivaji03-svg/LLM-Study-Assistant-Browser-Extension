let hasResponded = false;
let messageCountAtQuestion = 0;
let observationStartTime = 0;
let observationTimeout = null;
let observer = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "receiveQuestion") {
    resetObservation();

    const messages = document.querySelectorAll("model-response");
    messageCountAtQuestion = messages.length;
    hasResponded = false;

    insertQuestion(message.question)
      .then(() => {
        sendResponse({ received: true, status: "processing" });
      })
      .catch((error) => {
        sendResponse({ received: false, error: error.message });
      });

    return true;
  }
});

function resetObservation() {
  hasResponded = false;
  if (observationTimeout) {
    clearTimeout(observationTimeout);
    observationTimeout = null;
  }
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function waitForIdle(timeout = 120000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const sendButton = document.querySelector(".send-button");
      if (!sendButton || !sendButton.classList.contains("stop")) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error("Timed out waiting for Gemini to finish responding"));
      }
    }, 500);
  });
}

async function insertQuestion(questionData) {
  const { type, question, options, previousCorrection } = questionData;
  let text = `Type: ${type}\nQuestion: ${question}`;

  if (
    previousCorrection &&
    previousCorrection.question &&
    previousCorrection.correctAnswer
  ) {
    text =
      `CORRECTION FROM PREVIOUS ANSWER: For the question "${
        previousCorrection.question
      }", your answer was incorrect. The correct answer was: ${JSON.stringify(
        previousCorrection.correctAnswer
      )}\n\nNow answer this new question:\n\n` + text;
  }

  if (type === "matching") {
    text +=
      "\nPrompts:\n" +
      options.prompts.map((prompt, i) => `${i + 1}. ${prompt}`).join("\n");
    text +=
      "\nChoices:\n" +
      options.choices.map((choice, i) => `${i + 1}. ${choice}`).join("\n");
    text +=
      "\n\nHelp the learner reason through the best matches. If you include a possible mapping, keep it brief and frame it as something to verify.";
  } else if (type === "fill_in_the_blank") {
    text +=
      "\n\nThis is a fill in the blank question. Focus on the concept being tested, what clues to look for, and how to verify a possible completion.";
  } else if (options && options.length > 0) {
    text +=
      "\nOptions:\n" + options.map((opt, i) => `${i + 1}. ${opt}`).join("\n");
    text +=
       "\n\nExplain which option cues matter most. If you include a possible answer, keep it short and present it as something the learner should verify.";
  }

  text +=
    '\n\nYou are acting as a study coach. Help the learner understand the question before answering it.' +
    '\n\nIMPORTANT: Your answer should be in a JSON code block.' +
    '\n\nPlease provide JSON with these keys: "conceptSummary", "hint", "reasoningSteps", "nextStep", "confidenceCheck", and optional "possibleAnswer". "reasoningSteps" should be an array of short strings. Keep the guidance concise and do not write the response like a completed submission.';

  return new Promise((resolve, reject) => {
    waitForIdle()
      .then(() => {
        const inputArea = document.querySelector(".ql-editor");
        if (inputArea) {
          setTimeout(() => {
            inputArea.focus();
            inputArea.innerHTML = `<p>${text}</p>`;
            inputArea.dispatchEvent(new Event("input", { bubbles: true }));

            setTimeout(() => {
              const sendButton = document.querySelector(".send-button");
              if (sendButton) {
                sendButton.click();
                startObserving();
                resolve();
              } else {
                reject(new Error("Send button not found"));
              }
            }, 300);
          }, 300);
        } else {
          reject(new Error("Input area not found"));
        }
      })
      .catch(reject);
  });
}

function startObserving() {
  observationStartTime = Date.now();
  observationTimeout = setTimeout(() => {
    if (!hasResponded) {
      resetObservation();
    }
  }, 180000);

  observer = new MutationObserver((mutations) => {
    if (hasResponded) return;

    const messages = document.querySelectorAll("model-response");
    if (!messages.length) return;

    if (messages.length <= messageCountAtQuestion) return;

    const latestMessage = messages[messages.length - 1];

    const codeBlocks = latestMessage.querySelectorAll("pre code");
    let responseText = "";

    for (const block of codeBlocks) {
      if (block.className.includes("hljs-") || block.closest(".code-block")) {
        responseText = block.textContent.trim();
        break;
      }
    }

    if (!responseText) {
      responseText = latestMessage.textContent.trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) responseText = jsonMatch[0];
    }

    responseText = responseText
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\n\s*/g, " ")
      .trim();

    try {
      const parsed = JSON.parse(responseText);
      if (
        (
          parsed.conceptSummary ||
          parsed.hint ||
          parsed.reasoningSteps ||
          parsed.nextStep ||
          parsed.confidenceCheck ||
          parsed.possibleAnswer ||
          parsed.answer
        ) &&
        !hasResponded
      ) {
        hasResponded = true;
        chrome.runtime
          .sendMessage({
            type: "geminiResponse",
            response: responseText,
          })
          .then(() => {
            resetObservation();
          })
          .catch((error) => {
            console.error("Error sending response:", error);
          });
      }
    } catch (e) {
      const isGenerating =
        latestMessage.querySelector(".cursor") ||
        latestMessage.classList.contains("generating");

      if (!isGenerating && Date.now() - observationStartTime > 30000) {
        const responseText = latestMessage.textContent.trim();
        try {
          const jsonPattern = /\{[\s\S]*\}/;
          const jsonMatch = responseText.match(jsonPattern);

          if (jsonMatch && !hasResponded) {
            hasResponded = true;
            chrome.runtime.sendMessage({
              type: "geminiResponse",
              response: jsonMatch[0],
            });
            resetObservation();
          }
        } catch (e) {}
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}
