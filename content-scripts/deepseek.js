let hasResponded = false;
let messageCountAtQuestion = 0;
let observationStartTime = 0;
let observationTimeout = null;
let checkIntervalId = null;
let observer = null;
const MESSAGE_SELECTORS = [
  "[data-testid='chat-message-assistant']",
  "[data-testid='message-content']",
  "model-response",
  ".ds-markdown",
  ".f9bf7997",
];
const CHAT_INPUT_SELECTORS = [
  "#chat-input",
  'textarea[data-testid="chat_input_input"]',
  "textarea",
  '[role="textbox"][contenteditable="true"]',
];
const SEND_BUTTON_SELECTORS = [
  '[data-testid="submit-button"]',
  '[data-testid="send-button"]',
  '[data-testid="chat_input_send_button"]',
  '[role="button"].f6d670',
  ".f6d670",
  'button[type="submit"]',
  '[aria-label="Send message"]',
  '[aria-label*="Send"]',
  ".bf38813a button",
];

function getMessageNodes() {
  for (const selector of MESSAGE_SELECTORS) {
    const nodes = document.querySelectorAll(selector);
    if (nodes.length > 0) {
      return Array.from(nodes);
    }
  }

  return [];
}

function findChatInput() {
  for (const selector of CHAT_INPUT_SELECTORS) {
    const input = document.querySelector(selector);
    if (input) {
      return input;
    }
  }

  return null;
}

function isButtonUsable(button) {
  if (!button) return false;
  if (button.disabled) return false;
  if (button.getAttribute("aria-disabled") === "true") return false;
  return true;
}

function findSendButton() {
  for (const selector of SEND_BUTTON_SELECTORS) {
    try {
      const button = document.querySelector(selector);
      if (isButtonUsable(button)) {
        return button;
      }
    } catch (e) {
      continue;
    }
  }

  const composerContainer = document.querySelector(".bf38813a");
  if (composerContainer) {
    const candidates = Array.from(
      composerContainer.querySelectorAll("button, [role='button']")
    );
    const lastEnabled = candidates.reverse().find((button) => isButtonUsable(button));
    if (lastEnabled) {
      return lastEnabled;
    }
  }

  return null;
}

function updateChatInputValue(chatInput, text) {
  chatInput.focus();

  if (
    chatInput instanceof HTMLTextAreaElement ||
    chatInput instanceof HTMLInputElement
  ) {
    const prototype = Object.getPrototypeOf(chatInput);
    const valueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      "value"
    )?.set;

    if (valueSetter) {
      valueSetter.call(chatInput, text);
    } else {
      chatInput.value = text;
    }
  } else if (chatInput.isContentEditable) {
    chatInput.textContent = text;
  } else {
    return false;
  }

  chatInput.dispatchEvent(new Event("input", { bubbles: true }));
  chatInput.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "receiveQuestion") {
    resetObservation();

    const messages = getMessageNodes();
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
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
  if (observer) {
    observer.disconnect();
    observer = null;
  }
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
    const chatInput = findChatInput();
    if (chatInput) {
      setTimeout(() => {
        if (!updateChatInputValue(chatInput, text)) {
          reject(new Error("Unable to fill input area"));
          return;
        }

        setTimeout(() => {
          const sendButton = findSendButton();

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
  });
}

function processResponse(responseText) {
  const cleanedText = responseText
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\n\s*/g, " ")
    .trim();

  try {
    const parsed = JSON.parse(cleanedText);

    if (
      parsed &&
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
          type: "deepseekResponse",
          response: cleanedText,
        })
        .then(() => {
          resetObservation();
          return true;
        })
        .catch((error) => {
          return false;
        });

      return true;
    }
  } catch (e) {
    return false;
  }

  return false;
}

function checkForResponse() {
  if (hasResponded) {
    return;
  }

  const messages = getMessageNodes();

  if (messages.length <= messageCountAtQuestion) {
    return;
  }

  const newMessages = Array.from(messages).slice(messageCountAtQuestion);

  for (const message of newMessages) {
    const codeBlockSelectors = [
      ".md-code-block pre",
      "pre code",
      "pre",
      ".code-block pre",
      ".ds-markdown pre",
    ];

    for (const selector of codeBlockSelectors) {
      const codeBlocks = message.querySelectorAll(selector);

      for (const block of codeBlocks) {
        const parent = block.closest(
          ".md-code-block, .code-block, .ds-markdown"
        );

        if (parent) {
          const infoElements = parent.querySelectorAll(
            '.d813de27, .md-code-block-infostring, [class*="json"], [class*="language"]'
          );
          const hasJsonInfo = Array.from(infoElements).some((el) =>
            el.textContent.toLowerCase().includes("json")
          );

          if (hasJsonInfo || !infoElements.length) {
            const responseText = block.textContent.trim();
            if (
              responseText.includes("{") &&
              responseText.includes('"answer"')
            ) {
              if (processResponse(responseText)) return;
            }
          }
        }
      }
    }

    const messageText = message.textContent.trim();
    const jsonMatch = messageText.match(/\{[\s\S]*?"answer"[\s\S]*?\}/);
    if (jsonMatch) {
      const responseText = jsonMatch[0];
      if (processResponse(responseText)) return;
    }

    if (Date.now() - observationStartTime > 30000) {
      try {
        const jsonPattern = /\{[\s\S]*?"answer"[\s\S]*?"explanation"[\s\S]*?\}/;
        const jsonMatch = messageText.match(jsonPattern);

        if (jsonMatch && !hasResponded) {
          hasResponded = true;
          chrome.runtime.sendMessage({
            type: "deepseekResponse",
            response: jsonMatch[0],
          });
          resetObservation();
          return true;
        }
      } catch (e) {}
    }
  }
}

function startObserving() {
  observationStartTime = Date.now();
  observationTimeout = setTimeout(() => {
    if (!hasResponded) {
      resetObservation();
    }
  }, 180000);

  observer = new MutationObserver(() => {
    checkForResponse();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });

  checkIntervalId = setInterval(checkForResponse, 1000);
}
