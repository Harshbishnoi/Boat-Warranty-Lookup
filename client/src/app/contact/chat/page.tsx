"use client";

import { useState } from "react";

type Message = {
  id: number;
  sender: "user" | "bot";
  text: string;
};

const quickQuestions = [
  "How can I check my warranty?",
  "Where can I find my serial number?",
  "How can I request a repair?",
  "How can I submit a warranty claim?",
];

function getBotResponse(message: string): string {
  const text = message.toLowerCase();

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return "Hello! 👋 Welcome to boAt Warranty Support. How can I help you today?";
  }

  if (
    text.includes("warranty") &&
    (text.includes("check") ||
      text.includes("status") ||
      text.includes("expire"))
  ) {
    return "You can check your warranty status using the Warranty Lookup page. Enter your product's serial number to view its warranty status and expiry date.";
  }

  if (
    text.includes("serial") ||
    text.includes("serial number")
  ) {
    return "Your serial number is the unique identifier for your product. You can usually find it on the product, packaging, invoice, or purchase documentation.";
  }

  if (
    text.includes("repair") ||
    text.includes("fix") ||
    text.includes("service")
  ) {
    return "For repair support, visit the Repair section. You can explore repair options and service-related information for your device.";
  }

  if (
    text.includes("claim") ||
    text.includes("warranty claim")
  ) {
    return "To submit a warranty claim, open the Warranty Claim section and follow the steps provided. Make sure you have your product and purchase details available.";
  }

  if (
    text.includes("extend") ||
    text.includes("extension")
  ) {
    return "You can explore extended warranty options from the Extend Warranty section.";
  }

  if (
    text.includes("replacement") ||
    text.includes("replace")
  ) {
    return "Replacement eligibility depends on your product and warranty status. Please check your warranty information or visit the Warranty Claim section.";
  }

  if (
    text.includes("account") ||
    text.includes("login") ||
    text.includes("sign in")
  ) {
    return "You can sign in to your account from the Login page. Your account can be used to access your warranty and support information.";
  }

  if (
    text.includes("contact") ||
    text.includes("support") ||
    text.includes("human") ||
    text.includes("agent")
  ) {
    return "You are currently in the Live Support section. For this demo, I can help with warranty, repairs, claims, serial numbers and account-related questions.";
  }

  return "I'm still learning! 🤖 Try asking me about warranty status, serial numbers, repairs, warranty claims, replacement, extended warranty, or account access.";
}

export default function ChatPage() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Hi! 👋 I'm the boAt Warranty Assistant. How can I help you today?",
    },
  ]);

  const sendMessage = (text?: string) => {
    const userMessage = (text ?? message).trim();

    if (!userMessage) {
      return;
    }

    const botResponse = getBotResponse(userMessage);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        text: userMessage,
      },
      {
        id: Date.now() + 1,
        sender: "bot",
        text: botResponse,
      },
    ]);

    setMessage("");
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <main className="page chat-page">
      <section className="chat-container">

        {/* HEADER */}

        <div className="chat-header">
          <div>
            <span className="hero-label">
              LIVE SUPPORT
            </span>

            <h1>
              Warranty Assistant
            </h1>

            <p>
              Get quick answers about your boAt product.
            </p>
          </div>

          <span className="online-status">
            ● Online
          </span>
        </div>

        {/* MESSAGES */}

        <div className="chat-messages">

          {messages.map((item) => (
            <div
              key={item.id}
              className={
                item.sender === "user"
                  ? "chat-message user-message"
                  : "chat-message bot-message"
              }
            >
              {item.sender === "bot" && (
                <div className="chat-sender">
                  🤖 Warranty Assistant
                </div>
              )}

              {item.text}
            </div>
          ))}

          {/* QUICK QUESTIONS */}

          {messages.length === 1 && (
            <div className="chat-quick-actions">

              <p>
                Popular questions
              </p>

              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </button>
              ))}

            </div>
          )}

        </div>

        {/* INPUT */}

        <form
          className="chat-input"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Ask about your warranty..."
          />

          <button
            type="submit"
            className="primary-btn"
          >
            Send
          </button>
        </form>

      </section>
    </main>
  );
}