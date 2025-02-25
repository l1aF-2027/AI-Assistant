"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ExampleChat() {
  const [messages, setMessages] = useState([
    {
      role: "user",
      content:
        "Let's make a website for my portfolio that uses Next.js and Tailwind CSS",
    },
    {
      role: "assistant",
      content:
        "I'd be happy to help you create a portfolio website using Next.js and Tailwind CSS. Here's a simple demo of what your website could look like:",
    },
  ]);

  return (
    <div className=" p-6 w-full">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-4 ${
            message.role === "user" ? "text-right" : "text-left"
          }`}
        >
          <span
            className={`inline-block p-2 rounded-lg ${
              message.role === "user"
                ? "bg-black text-white"
                : "bg-gray-200 text-black"
            }`}
          >
            {message.role === "assistant" && index === 1 ? (
              <>
                <pre className="whitespace-pre-wrap font-arial text-sm">
                  {message.content}
                </pre>
                <div className="mt-2 items-center flex justify-center">
                  <img
                    src="./demo.gif"
                    alt="Portfolio Demo"
                    className="h-60 rounded-xl flex justify-between items-center"
                  />
                </div>
              </>
            ) : (
              <pre className="whitespace-pre-wrap font-arial text-sm">
                {message.content}
              </pre>
            )}
          </span>
        </div>
      ))}
      {true && (
        <div className="flex items-center text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          AI is typing...
        </div>
      )}
    </div>
  );
}
