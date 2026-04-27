# ⚡ DecisionMatrix

An AI-powered weighted decision analysis application that helps you make complex choices with confidence. Describe your dilemma, and let Google's Gemini models automatically build a weighted decision matrix, score the options, and debate the final winner.

## ✨ Features

- **🧠 AI-Powered Matrix Generation**: Simply describe what you are trying to decide. The AI will extract the options, determine the most important criteria, assign appropriate weights, and score everything automatically.
- **🗣️ AI Debate Mode**: Once a winner is calculated, the AI acts as a critical analyst, arguing *for* and *against* the top choice to give you a nuanced final verdict.
- **⚙️ Dynamic Model Selection**: Choose the Gemini model that fits your needs (e.g., Gemini 2.5 Flash for speed, Gemini 2.5 Pro for deep reasoning, or Experimental models).
- **🔒 Privacy First**: Your Gemini API key and all your decision data are stored strictly in your browser's `localStorage`. No intermediate backends or databases are used.
- **📤 Export & Share**: 
  - Download your decision matrix as a standard CSV file (compatible with Excel/Google Sheets).
  - Generate a shareable link that embeds your decision state directly into the URL, allowing you to easily share matrices with friends or colleagues.
- **📱 Fully Responsive**: A beautiful, dark-themed, mobile-first design that looks great on any device.

## 🚀 Quick Start

### Prerequisites
You need [Node.js](https://nodejs.org/) installed on your machine.
You will also need a free [Gemini API Key from Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aman-khare/Decision-Matrix-with-AI-.git
   cd Decision-Matrix-with-AI-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173/`

## 🛠️ Built With

- [React 19](https://react.dev/) — Frontend library
- [Vite](https://vitejs.dev/) — Frontend tooling and bundler
- [Google Gemini API](https://aistudio.google.com/) — AI reasoning engine
- Vanilla CSS (CSS Modules) — For custom styling, animations, and responsive layout

## 🛡️ Security & Data Flow

This application is completely serverless. It operates under a "Bring Your Own Key" (BYOK) model. 
When you enter your Gemini API key, it is saved locally in your browser. All API requests are made directly from your client machine to Google's `generativelanguage.googleapis.com` endpoint.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
