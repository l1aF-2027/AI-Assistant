# AI Assistant using Gemini API

The AI Assistant website is an intelligent platform that provides an AI-powered virtual assistant with a wide range of features to support users in their daily tasks.

[![Open website](https://img.shields.io/badge/website-000000?style=for-the-badge&logo=About.me&logoColor=white)](https://comet-ai-assistant.vercel.app/)


https://github.com/user-attachments/assets/a737a84c-0c86-4ad1-90da-15c754fa1792



## Introduction

This project was built to provide a smooth, safe, and efficient experience using the AI Assistant. The system integrates various cutting-edge technologies—from database management to handling user requests—to optimize performance and ensure security for the entire application.

## Main Features
- **AI Virtual Assistant:** By using Gemini 2.0 Flash as the main model, the AI Assistant can quickly process and respond to user requests.
- **Secure Login Management:** Clerk is integrated to manage logins and securely authenticate users.
- **Efficient Data Storage:** Prisma along with Neon is used to connect to and manage the database, ensuring that data is stored reliably and can be easily scaled.
- **User-Friendly Interface:** The user interface is designed to be intuitive and easy to use, providing an optimal experience for all users.

## Technologies Used

- **[Prisma](https://www.prisma.io/):** A powerful ORM that facilitates easy and efficient interaction with the database.
- **[Neon](https://neon.tech/):** A modern database storage solution with flexible scalability.
- **[Clerk](https://clerk.com/):** A secure platform for managing logins and authenticating users.
- **[Gemini 2.0 Flash](https://ai.google.dev/gemini-api/docs/models/gemini?authuser=1#gemini-2.0-flash):** An advanced AI model responsible for natural language processing and intelligent responses.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/l1aF-2027/AI-Assistant.git
   cd ai-assistant
   ```

2. **Install the Necessary Packages:**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**

   Create a `.env.local` file in the root directory and add the required configuration variables, for example:

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your--public-clerk-publishable-api-key"
   CLERK_SECRET_KEY="your-clerk-api-key"
   NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
   ```
   
   Create a `.env` file in the root directory and add database variable, for example:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname"
   ```
4. **Run the Project:**

   ```bash
   npm run dev
   ```

## Environment Configuration

- **DATABASE_URL:** The connection string for the Neon database.
- **CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:** API key for integrating Clerk's login management service.
- **NEXT_PUBLIC_GEMINI_API_KEY:** API key for the Gemini 2.0 Flash model.

Make sure these environment variables are correctly configured for the system to run smoothly.

## Usage Instructions

- Visit the URL: `http://localhost:3000` (or the configured address) to start experiencing the AI Assistant.
- Sign up and log in via Clerk to access personalized features.
- Interact with the AI Assistant through the chat interface or other integrated functionalities.

## Contributions

All contributions, suggestions, and bug reports are welcome. Please create a Pull Request or open an Issue on GitHub to help improve the project.
