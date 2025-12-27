# FixMate – AI Code Review Assistant

FixMate is a VS Code extension that automatically reviews and fixes code in your project using Google Gemini AI.

It scans JavaScript, TypeScript, HTML, and CSS files, detects bugs, security issues, and bad practices, and applies fixes directly to files.

---

## ✨ Features

- 📂 Review an entire project folder
- 🧠 AI-powered code analysis using Gemini
- 🐞 Fix bugs, security issues, and bad practices
- ✍️ Automatically applies fixes to files
- 📊 Shows a clear summary in Output panel
- 🔑 API key is configured by the user (not bundled)

---

## 🚀 How to Use

1. Open any project in VS Code
2. Press `Ctrl + Shift + P`
3. Run **FixMate: Review Project**
4. Select the project folder
5. View progress and results in the **FixMate Output** panel

---

## ⚙️ Extension Settings

This extension contributes the following setting:

- `fixmate.apiKey`  
  Google Gemini API key required to run FixMate.

You can set it from:

Settings → Extensions → FixMate → API Key

---

## 🛠 Requirements

- Node.js 18+
- A valid Google Gemini API key

---

## ❗ Known Issues

- Very large projects may take longer to review
- Some complex refactors may require manual review

---

## 📦 Release Notes

### 0.0.1

- Initial release
- Project-wide AI code review
- Automatic fixes via Gemini

---

## 👤 Author

**Shivam Kumar**  
AI Code Review (FixMate)

---

Enjoy coding with FixMate 🚀
