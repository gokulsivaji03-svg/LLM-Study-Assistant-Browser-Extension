# StudyAI

![StudyAI icon](assets/icon.png)

StudyAI is a Chrome extension for multi-tab Smartbook automation. It captures prompts from supported Smartbook pages, sends them to your selected AI assistant, normalizes the response into structured JSON, and applies the result back into the assignment flow.

## What Makes This Version Different

This is no longer just a bare automation script. The current build behaves like a fuller workflow tool with provider switching, settings-driven modes, fallback handling, and recovery logic for messy quiz states.

## Current Feature Set

- Supports both `learning.mheducation.com` and `ezto.mheducation.com`
- Works with [ChatGPT](https://chatgpt.com), [Gemini](https://gemini.google.com), and [DeepSeek](https://chat.deepseek.com)
- Routes answers through a background worker so Smartbook tabs and AI tabs stay coordinated
- Handles multiple choice, true/false, fill-in-the-blank, select-text, and matching-style question flows
- Parses model output as structured JSON instead of relying on plain-text matching only
- Feeds previous corrections back into the next AI prompt after a wrong answer is detected

## Recent Improvements

- Added `Double Credit Mode`, which uses duplicate tabs to complete the same answer flow twice when supported
- Added `Randomize Confidence`, which rotates between confidence levels instead of always selecting the same one
- Added `Pause Before Submit`, which fills answers and lets you manually handle confidence and next-step review
- Improved matching-question behavior with attempted auto-application, manual fallback alerts, and automatic resume after you move on
- Improved forced-learning handling so the extension can navigate reading and return-to-questions flows
- Improved DeepSeek support with broader selector fallback and response detection
- Improved release checking in the popup, including a clean state when no GitHub release exists yet
- Fixed stale GitHub references from the old project identity

## How It Works

1. Open a supported Smartbook assignment page.
2. Open one supported AI assistant in another tab.
3. Choose the assistant and any optional modes in the popup settings.
4. Start automation from the injected Smartbook button.
5. The extension gathers the current question, sends a structured prompt to the selected provider, parses the JSON response, and applies the answer in-page.

## Settings

The popup currently includes:

- AI provider selection for ChatGPT, Gemini, and DeepSeek
- live assistant availability checks
- `Double Credit Mode`
- `Randomize Confidence`
- `Pause Before Submit`
- current version and latest release status

## Project Structure

```text
assets/           Extension icons and UI assets
background/       Cross-tab coordination and tab lifecycle logic
content-scripts/  Smartbook and provider-specific automation scripts
popup/            Settings UI and update checker
manifest.json     Chrome extension manifest
```

## Installation

1. Clone this repository or download it as a ZIP.
2. Open `chrome://extensions/` in Chrome.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the project folder.

## Notes

- This repository is the maintained source for the current extension.
- The extension is not affiliated with McGraw Hill, OpenAI, Google, or DeepSeek.
- Use it responsibly and follow the policies that apply to your coursework or institution.

## Issues

Bug reports and improvement ideas are welcome through the [issue tracker](https://github.com/gokulsivaji03-svg/StudyAI/issues).
