let messageListener = null;
let isRequestInFlight = false;
let lastIncorrectQuestion = null;
let lastCorrectAnswer = null;
let buttonAdded = false;

function setupMessageListener() {
  if (messageListener) {
    chrome.runtime.onMessage.removeListener(messageListener);
  }

  messageListener = (message, sender, sendResponse) => {
    if (message.type === "processChatGPTResponse") {
      processStudyGuidance(message.response);
      sendResponse({ received: true });
      return true;
    }

    if (message.type === "alertMessage") {
      alert(message.message);
      sendResponse({ received: true });
      return true;
    }
  };

  chrome.runtime.onMessage.addListener(messageListener);
}

function isQuizPage() {
  return (
    document.querySelector(".question") &&
    (document.querySelector(".answers-wrap.multiple-choice") ||
      document.querySelector(".answers-wrap.boolean") ||
      document.querySelector(".answers-wrap.input-response"))
  );
}

function checkForQuizAndAddButton() {
  if (buttonAdded) return;

  const helpLink = document.querySelector(".header__help");
  if (helpLink && isQuizPage()) {
    addAssistantButton();
    buttonAdded = true;
  }
}

function startPageObserver() {
  const observer = new MutationObserver(() => {
    if (!buttonAdded) {
      checkForQuizAndAddButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  checkForQuizAndAddButton();
}

function updateButtonState() {
  chrome.storage.sync.get("aiModel", function (data) {
    const currentModel = data.aiModel || "chatgpt";
    let currentModelName = "ChatGPT";

    if (currentModel === "gemini") {
      currentModelName = "Gemini";
    } else if (currentModel === "deepseek") {
      currentModelName = "DeepSeek";
    }

    const btn = document.querySelector(".header__automcgraw--main");
    if (btn) {
      btn.textContent = isRequestInFlight
        ? "Getting Guidance..."
        : `Guide with ${currentModelName}`;
    }
  });
}

function requestGuidance() {
  const questionData = parseQuestion();
  if (!questionData) {
    alert("No supported question was found on the page.");
    return;
  }

  isRequestInFlight = true;
  updateButtonState();

  chrome.runtime.sendMessage({
    type: "sendQuestionToChatGPT",
    question: questionData,
  });
}

function parseQuestion() {
  const questionElement = document.querySelector(".question");
  if (!questionElement) {
    return null;
  }

  let questionType = "";
  let options = [];

  if (document.querySelector(".answers-wrap.multiple-choice")) {
    questionType = "multiple_choice";
    const optionElements = document.querySelectorAll(
      ".answers--mc .answer__label--mc"
    );
    options = Array.from(optionElements).map((el) => {
      const textContent = el.textContent.trim();
      return textContent.replace(/^[a-z]\s+/, "");
    });
  } else if (document.querySelector(".answers-wrap.boolean")) {
    questionType = "true_false";
    options = ["True", "False"];
  } else if (document.querySelector(".answers-wrap.input-response")) {
    questionType = "fill_in_the_blank";
  } else {
    return null;
  }

  let questionText = "";
  if (questionType === "fill_in_the_blank") {
    const questionClone = questionElement.cloneNode(true);

    const blankSpans = questionClone.querySelectorAll(
      'span[aria-hidden="true"]'
    );
    blankSpans.forEach((span) => {
      if (span.textContent.includes("_")) {
        span.textContent = "[BLANK]";
      }
    });

    const hiddenSpans = questionClone.querySelectorAll(
      'span[style*="position: absolute"]'
    );
    hiddenSpans.forEach((span) => span.remove());

    questionText = questionClone.textContent.trim();
  } else {
    questionText = questionElement.textContent.trim();
  }

  return {
    type: questionType,
    question: questionText,
    options,
    previousCorrection: lastIncorrectQuestion
      ? {
          question: lastIncorrectQuestion,
          correctAnswer: lastCorrectAnswer,
        }
      : null,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeTextValue(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

function normalizeStepList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function normalizeStudyGuide(raw) {
  return {
    conceptSummary: normalizeTextValue(
      raw.conceptSummary || raw.summary || raw.explanation
    ),
    hint: normalizeTextValue(raw.hint),
    reasoningSteps: normalizeStepList(raw.reasoningSteps || raw.steps),
    nextStep: normalizeTextValue(raw.nextStep || raw.next_step),
    confidenceCheck: normalizeTextValue(
      raw.confidenceCheck || raw.checkYourWork || raw.selfCheck
    ),
    possibleAnswer: normalizeTextValue(raw.possibleAnswer || raw.answer),
  };
}

function renderStudyGuide(questionElement, guide) {
  if (!questionElement) return;

  let panel = document.querySelector(".llm-study-guide-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "llm-study-guide-panel";
    panel.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      border: 1px solid #d7e3ff;
      border-radius: 12px;
      background: #f7fbff;
      color: #1d2a39;
      box-shadow: 0 8px 24px rgba(34, 78, 129, 0.08);
    `;
    questionElement.insertAdjacentElement("afterend", panel);
  }

  const sections = [];

  if (guide.conceptSummary) {
    sections.push(`
      <div style="margin-top:12px;">
        <strong>Concept Summary</strong>
        <p style="margin:6px 0 0;">${escapeHtml(guide.conceptSummary)}</p>
      </div>
    `);
  }

  if (guide.hint) {
    sections.push(`
      <div style="margin-top:12px;">
        <strong>Hint</strong>
        <p style="margin:6px 0 0;">${escapeHtml(guide.hint)}</p>
      </div>
    `);
  }

  if (guide.reasoningSteps.length) {
    sections.push(`
      <div style="margin-top:12px;">
        <strong>How To Think Through It</strong>
        <ol style="margin:6px 0 0 18px; padding:0;">
          ${guide.reasoningSteps
            .map((step) => `<li style="margin:4px 0;">${escapeHtml(step)}</li>`)
            .join("")}
        </ol>
      </div>
    `);
  }

  if (guide.nextStep) {
    sections.push(`
      <div style="margin-top:12px;">
        <strong>Next Step</strong>
        <p style="margin:6px 0 0;">${escapeHtml(guide.nextStep)}</p>
      </div>
    `);
  }

  if (guide.confidenceCheck) {
    sections.push(`
      <div style="margin-top:12px;">
        <strong>Check Your Work</strong>
        <p style="margin:6px 0 0;">${escapeHtml(guide.confidenceCheck)}</p>
      </div>
    `);
  }

  if (guide.possibleAnswer) {
    sections.push(`
      <div style="margin-top:12px;">
        <strong>Possible Answer To Verify Yourself</strong>
        <p style="margin:6px 0 0;">${escapeHtml(guide.possibleAnswer)}</p>
      </div>
    `);
  }

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
      <div>
        <strong style="font-size:16px;">Study Guidance</strong>
        <p style="margin:4px 0 0; font-size:13px; color:#4a617a;">
          Review the reasoning below and decide on the answer yourself.
        </p>
      </div>
    </div>
    ${sections.join("") || '<p style="margin:12px 0 0;">No study guidance was returned.</p>'}
  `;
}

function processStudyGuidance(responseText) {
  try {
    const response = JSON.parse(responseText);
    const guide = normalizeStudyGuide(response);
    const questionElement = document.querySelector(".question");
    renderStudyGuide(questionElement, guide);
  } catch (e) {
    console.error("Error processing study guidance:", e);
    alert("Unable to parse study guidance from the AI response.");
  } finally {
    isRequestInFlight = false;
    updateButtonState();
  }
}

function addAssistantButton() {
  const helpLink = document.querySelector(".header__help");
  if (!helpLink) return;

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "header__automcgraw";
  buttonContainer.style.cssText = `
    display: inline-flex;
    margin-right: 20px;
    align-items: center;
  `;

  chrome.storage.sync.get("aiModel", function (data) {
    const aiModel = data.aiModel || "chatgpt";
    let modelName = "ChatGPT";

    if (aiModel === "gemini") {
      modelName = "Gemini";
    } else if (aiModel === "deepseek") {
      modelName = "DeepSeek";
    }

    const btn = document.createElement("button");
    btn.textContent = `Guide with ${modelName}`;
    btn.type = "button";
    btn.className = "header__automcgraw--main";
    btn.style.cssText = `
      background: #fff;
      border: 1px solid #ccc;
      color: #333;
      padding: 8px 12px;
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      border-radius: 4px 0 0 4px;
      border-right: none;
      height: 32px;
      line-height: 1;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: background-color 0.2s ease;
    `;

    btn.addEventListener("mouseenter", () => {
      btn.style.backgroundColor = "#f5f5f5";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.backgroundColor = "#fff";
    });

    btn.addEventListener("click", () => {
      if (isRequestInFlight) {
        return;
      }

      const proceed = confirm(
        "Generate study guidance for this question?\n\nUse the explanation to reason through the answer yourself."
      );

      if (proceed) {
        requestGuidance();
      }
    });

    const settingsBtn = document.createElement("button");
    settingsBtn.type = "button";
    settingsBtn.className = "header__automcgraw--settings";
    settingsBtn.title = "LLM-Study-Assistant-Browser-Extension Settings";
    settingsBtn.setAttribute(
      "aria-label",
      "LLM-Study-Assistant-Browser-Extension Settings"
    );
    settingsBtn.style.cssText = `
      background: #fff;
      border: 1px solid #ccc;
      color: #333;
      padding: 8px 10px;
      font-size: 14px;
      cursor: pointer;
      border-radius: 0 4px 4px 0;
      height: 32px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    `;

    settingsBtn.addEventListener("mouseenter", () => {
      settingsBtn.style.backgroundColor = "#f5f5f5";
    });

    settingsBtn.addEventListener("mouseleave", () => {
      settingsBtn.style.backgroundColor = "#fff";
    });

    settingsBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;

    settingsBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "openSettings" });
    });

    buttonContainer.appendChild(btn);
    buttonContainer.appendChild(settingsBtn);
    helpLink.parentNode.insertBefore(buttonContainer, helpLink);

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.aiModel && !isRequestInFlight) {
        updateButtonState();
      }
    });
  });
}

setupMessageListener();
startPageObserver();
