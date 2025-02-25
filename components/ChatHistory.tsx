"use client";
import { useState, useEffect } from "react";

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
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Chat History</h2>
      <ul>
        {chatSessions.map((session) => (
          <li key={session.id} className="mb-2">
            <button
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
              onClick={() => onSelectChatSession(session)}
            >
              <div className="flex justify-between">
                <span className="max-w-[200px] truncate">{session.title}</span>
                <span className="text-xs text-gray-500">
                  {new Date(session.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
