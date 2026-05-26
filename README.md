# LLM Study Assistant — Browser Extension

A Chrome extension that acts as an in-page study coach for McGraw-Hill Smartbook questions. It reads the current question, sends it to your chosen LLM assistant, and injects structured guided support directly into the page — helping you reason through problems yourself rather than just getting answers.

---

## How It Works

The extension uses a **cross-tab coordination architecture**: a background service worker monitors open LLM assistant tabs (ChatGPT, Gemini, or DeepSeek) and relays structured JSON guidance back to the active study page — no page reload required.

```
Study Page (mheducation.com)
    └── content-script detects question + type
    └── sends to background service worker
            └── routes to open LLM assistant tab
            └── injects structured prompt
            └── receives JSON guidance response
    └── renders in-page study panel
```

---

## Features

- **In-page guidance panel** — study support renders directly inside the Smartbook page
- **Multi-provider support** — works with ChatGPT, Gemini, and DeepSeek via their web apps (no API key required)
- **5 question format parsers** — handles multiple choice, true/false, fill-in-the-blank, select-text, and matching
- **Structured JSON responses** — LLM output is normalized into consistent fields: `summary`, `hint`, `reasoning_steps`, `next_step`, `self_check`, and `possible_answer`
- **Study-coach prompting** — provider-specific prompt templates instruct the LLM to guide reasoning, not just supply answers
- **Popup provider switcher** — switch between assistants from the extension popup without touching any code

---

## Supported Pages

- `learning.mheducation.com`
- `ezto.mheducation.com`

---

## Architecture

```
assets/             Extension icons and UI assets
background/         Service worker — cross-tab coordination and message routing
content-scripts/    Per-page question parsers and provider-specific prompt injection
popup/              Provider selection UI and version info
manifest.json       Chrome Manifest V3 config
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension runtime | Chrome Extensions (Manifest V3) |
| Background coordination | Service Worker API, Chrome Message Passing |
| Content scripts | Vanilla JavaScript, DOM API |
| Prompt engineering | Structured JSON templates per provider |
| Supported LLMs | ChatGPT, Gemini, DeepSeek |

---

## Installation

1. Clone this repo or download it as a ZIP
2. Go to `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the project folder

---

## Usage

1. Open a supported Smartbook question page
2. Open ChatGPT, Gemini, or DeepSeek in another tab and log in
3. Select your preferred provider in the extension popup
4. Click **Guide with [provider]** on the study page
5. Read the guidance panel and work through the problem yourself

---

## Guidance Panel Output

Each response from the LLM is parsed into structured fields:

| Field | Description |
|---|---|
| `summary` | Brief concept explanation relevant to the question |
| `hint` | A directional nudge without giving away the answer |
| `reasoning_steps` | Step-by-step breakdown of how to approach the problem |
| `next_step` | What to do or check next |
| `self_check` | A prompt to verify your own reasoning |
| `possible_answer` | Optional — framed as something to verify, not copy |

---

## Project Structure Notes

Provider-specific logic lives in `content-scripts/` — each provider has its own prompt injection and response parser to handle differences in DOM structure across LLM web apps. The background service worker handles message passing between tabs using Chrome's `runtime.sendMessage` and `tabs` APIs.
