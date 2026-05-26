# LLM-Study-Assistant-Browser-Extension

![LLM-Study-Assistant-Browser-Extension icon](assets/icon.png)

LLM-Study-Assistant-Browser-Extension is a browser extension for legitimate study help on Smartbook-style pages. Instead of silently filling answers, it reads the current question, sends it to your chosen LLM assistant, and returns guided support directly inside the page so you can think through the problem yourself.

## What It Does Now

This project has been reworked away from answer automation and toward guided learning support.

The extension now focuses on:

- explaining the concept behind a question
- giving a useful hint instead of just a final answer
- breaking down reasoning into short steps
- suggesting what to check next
- optionally showing a possible answer as something to verify yourself

## Study-First Workflow

1. Open a supported Smartbook question.
2. Open ChatGPT, Gemini, or DeepSeek in another tab.
3. Click `Guide with ...` inside the study page.
4. Review the returned study panel.
5. Use the guidance to reason through the answer yourself before submitting anything.

## Guided Support Features

- In-page study guidance panel instead of auto-filling responses
- Concept summaries for the current question
- Hints and reasoning steps
- Self-check and confidence-check guidance
- Optional possible-answer output framed as something to verify, not blindly submit
- Support for multiple choice, true/false, fill-in-the-blank, select-text, and matching-style question parsing

## Supported AI Assistants

- ChatGPT
- Gemini
- DeepSeek

The extension uses the assistant web apps you already have open in the browser and asks them for structured study guidance.

## Recent Changes

- Reworked the extension around guided study help instead of direct answer application
- Updated provider prompts so the LLM behaves like a study coach rather than an answer bot
- Added structured JSON guidance responses with fields for summary, hint, reasoning steps, next step, self-check, and possible answer
- Replaced answer-first popup copy with legitimate study-support messaging
- Improved the project documentation to reflect an educational use case
- Preserved multi-provider support and existing question parsing improvements
- Kept the stronger DeepSeek and OpenAI/ChatGPT integration paths already added in the project

## Supported Pages

- `learning.mheducation.com`
- `ezto.mheducation.com`

## Architecture

```text
assets/           Extension icons and UI assets
background/       Cross-tab coordination between study pages and assistant tabs
content-scripts/  Smartbook page handlers plus provider-specific assistant prompts
popup/            Provider selection and version/update UI
manifest.json     Chrome extension manifest
```

## Installation

1. Clone this repository or download it as a ZIP.
2. Open `chrome://extensions/` in Chrome.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the project folder.

## Responsible Use

This extension is intended to support learning, review, and guided reasoning.

- Use it to understand concepts, compare approaches, and check your thinking.
- Review every suggestion yourself before answering.
- Follow your institution's academic integrity policies.
- Do not treat the generated guidance as a substitute for learning the material.

## Repository

- Repo: [gokulsivaji03-svg/LLM-Study-Assistant-Browser-Extension](https://github.com/gokulsivaji03-svg/LLM-Study-Assistant-Browser-Extension)
- Issues: [Report bugs or request improvements](https://github.com/gokulsivaji03-svg/LLM-Study-Assistant-Browser-Extension/issues)
