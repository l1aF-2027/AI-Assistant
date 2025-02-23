"use client";

import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import { HiOutlineUpload } from "react-icons/hi";
import { MdSend, MdClose } from "react-icons/md";

// Khởi tạo Gemini client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  },
});

interface Message {
  role: string;
  content: string;
  image?: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    // Khởi tạo chat session với history trống
    chatRef.current = model.startChat({
      history: [],
    });
  }, []);

  const handleSend = async () => {
    if ((input.trim() || image) && !isLoading) {
      setIsLoading(true);

      // Thêm message người dùng vào UI
      const userMessage: Message = {
        role: "user",
        content: input,
        image: image || undefined,
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // Chuẩn bị nội dung gửi đi
        const parts: any[] = [{ text: input }];

        if (image) {
          const [mimeType, base64Data] = image.split(",");
          parts.push({
            inlineData: {
              data: base64Data.split(";base64,")[1],
              mimeType: mimeType.split(":")[1],
            },
          });
        }

        // Gửi message tới Gemini
        const result = await chatRef.current.sendMessage(parts);
        const response = await result.response.text();

        // Thêm phản hồi AI vào history
        setMessages((prev) => [...prev, { role: "model", content: response }]);
      } catch (error) {
        console.error("Lỗi chat:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: "⚠️ Có lỗi xảy ra khi xử lý yêu cầu",
          },
        ]);
      } finally {
        setIsLoading(false);
        setInput("");
        setImage(null);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImage(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-400 max-w-60px">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}
          >
            {message.image && (
              <img
                src={message.image}
                alt="Uploaded"
                className="max-h-40 mb-2 rounded-lg"
              />
            )}
            <div
              className={`inline-block p-2 rounded-lg ${
                message.role === "user" ? "bg-black text-white" : "bg-gray-200"
              }`}
              style={{
                maxWidth: "600px",
                wordBreak: "break-word",
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block p-2 rounded-lg bg-gray-200">
              <div className="animate-pulse">Đang xử lý...</div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        {image && (
          <div className="relative mb-2">
            <div className="relative inline-block">
              <img
                src={image}
                alt="Uploaded"
                className="max-h-20 object-contain w-auto"
              />
              <button
                onClick={handleImageRemove}
                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                style={{ transform: "translate(50%, -50%)" }}
              >
                <MdClose size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-2 pr-16 pb-10 border resize-none rounded-lg min-h-[100px] custom-scrollbar"
            onKeyPress={handleKeyPress}
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#9CA3AF transparent",
            }}
          />
          <div className="absolute right-2 bottom-4 flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer p-1 hover:bg-gray-300 rounded"
            >
              <HiOutlineUpload size={20} className="text-gray-600" />
            </label>
            <button
              onClick={handleSend}
              className="p-1 hover:bg-gray-300 rounded"
            >
              <MdSend size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #9ca3af;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
