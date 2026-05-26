# StudyAI

![StudyAI icon](assets/icon.png)

StudyAI is a browser extension built for Smartbook-style study workflows. It reads questions directly from supported assignment pages, sends them to your selected AI assistant, parses the answer into structured JSON, and applies the result back into the page with less manual clicking and less context switching.

## Why This Project Exists

StudyAI is meant to turn a fragile browser script into a more complete study-assistant workflow:

- multi-provider support
- cleaner question parsing
- better response handling
- more recovery logic when the page flow gets messy
- settings for different answering styles instead of one rigid automation path

## Highlights

- Supports both `learning.mheducation.com` and `ezto.mheducation.com`
- Works with OpenAI-powered ChatGPT, Gemini, and DeepSeek
- Extracts question text and choices from the page automatically
- Normalizes model output into JSON before applying answers
- Handles multiple choice, true/false, fill-in-the-blank, select-text, and matching flows
- Uses background tab coordination so Smartbook and assistant tabs stay in sync
- Keeps track of prior corrections and feeds them into future prompts

## Newer Additions And Improvements

- Added stronger OpenAI/ChatGPT and DeepSeek support in the assistant workflow
- Added `Double Credit Mode` using duplicate-tab handling for supported flows
- Added `Randomize Confidence` so confidence selection is not always identical
- Added `Pause Before Submit` so answers can be filled while keeping the final step manual
- Improved matching-question support with auto-apply attempts plus manual fallback and resume behavior
- Improved forced-learning navigation so the extension can step through required reading flows
- Improved provider response parsing with JSON-focused extraction logic
- Improved popup update handling, including a clean state when no release is published yet
- Fixed stale repo references and general workflow rough edges
- Fixed a range of reliability issues around tab readiness, fallback selectors, and response timing

## Supported Workflow

1. Open a supported Smartbook assignment.
2. Open your preferred AI assistant in another tab.
3. Choose the provider and any optional modes from the StudyAI settings popup.
4. Start automation from the injected in-page button.
5. Let the extension capture the current question, send a structured prompt, parse the response, and apply the answer back into the assignment flow.

## Modes And Settings

StudyAI currently includes:

- Provider selection for ChatGPT, Gemini, and DeepSeek
- live availability checks for the selected assistant tab
- `Double Credit Mode`
- `Randomize Confidence`
- `Pause Before Submit`
- current version and latest release visibility in the popup

## Question Handling

The extension currently supports:

- multiple choice
- true/false
- fill-in-the-blank
- select-text
- matching questions with fallback recovery when strict automation is not reliable

It also includes correction-aware prompting, so if an earlier answer is marked wrong and the correct answer is discovered, that information can be included in the next prompt.

## Architecture

```text
assets/           Extension icons and UI assets
background/       Cross-tab coordination and tab lifecycle logic
content-scripts/  Smartbook pages plus provider-specific assistant handlers
popup/            Settings UI and release/update checker
manifest.json     Chrome extension manifest
```

## Installation

1. Clone this repository or download it as a ZIP.
2. Open `chrome://extensions/` in Chrome.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the project folder.

## Notes

- This repository contains the maintained browser-extension version of StudyAI.
- The current implementation integrates with assistant web apps in-browser.
- The extension is not affiliated with McGraw Hill, OpenAI, Google, or DeepSeek.
- Use it responsibly and follow the policies that apply to your coursework or institution.

## Repository

- Repo: [gokulsivaji03-svg/LLM-Study-Assistant-Browser-Extension](https://github.com/gokulsivaji03-svg/LLM-Study-Assistant-Browser-Extension)
- Issues: [Report bugs or request improvements](https://github.com/gokulsivaji03-svg/LLM-Study-Assistant-Browser-Extension/issues)
