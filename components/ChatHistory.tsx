"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./ChatHistory.css";

export default function ChatHistory({
  refreshTrigger,
  onSelectChatSession,
}: {
  refreshTrigger: number;
  onSelectChatSession: (session: any) => void;
}) {
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChatSessions();
  }, [refreshTrigger]);

  const fetchChatSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chats");
      if (!response.ok) throw new Error("Failed to fetch chat sessions");
      const data = await response.json();

      // Chỉ lấy dữ liệu cơ bản và không fetch lại từng session
      setChatSessions(data);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      setChatSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: "0%", opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="p-4"
    >
      <h2 className="text-lg font-semibold mb-4 ml-[20px] md:ml-0 rounded-3xl">
        Chat History
      </h2>
      {isLoading ? (
        <div className="loading-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      ) : (
        <ul>
          {chatSessions.map((session) => (
            <li key={session.id} className="mb-2">
              <button
                className="w-full text-left p-2 hover:bg-gray-100 rounded"
                onClick={() => onSelectChatSession(session)}
              >
                <div className="flex justify-between">
                  <span className="max-w-[200px] truncate">
                    {session.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
