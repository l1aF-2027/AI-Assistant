"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./ChatHistory.css"; // Import CSS file

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
      setChatSessions(data);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "-100%", opacity: 0 }} // Bắt đầu từ ngoài màn hình bên trái
      animate={{ x: "0%", opacity: 1 }} // Trượt vào vị trí ban đầu và hiện dần
      exit={{ x: "-100%", opacity: 0 }} // Nếu cần hiệu ứng khi tắt
      transition={{ duration: 0.3 }} // Điều chỉnh tốc độ hiệu ứng
      className="p-4"
    >
      <h2 className="text-lg font-semibold mb-4 ml-[20px] md:ml-0 rounded-3xl">
        Chat History
      </h2>
      {isLoading ? (
        <div className="loading-dots">
          <div>Loading</div>
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
