"use client";
import { useState, useRef, useEffect } from "react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import ChatBox from "@/components/ChatBox";
import ChatHistory from "@/components/ChatHistory";
import { VscLayoutSidebarLeftOff, VscLayoutSidebarLeft } from "react-icons/vsc";
import { FaPlus } from "react-icons/fa";

export default function Home() {
  const [isChatHistoryVisible, setIsChatHistoryVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedChatSession, setSelectedChatSession] = useState<any>(null);
  const chatBoxRef = useRef<any>(null);

  const toggleChatHistory = () => {
    setIsChatHistoryVisible((prev) => !prev);
    setIsHovered(false);
  };

  const handleNewChat = async () => {
    const currentMessages = chatBoxRef.current.getMessages();
    if (currentMessages.length > 0) {
      const title = currentMessages[0].content.substring(0, 50) + "...";
      const formattedMessages = currentMessages.map((msg: any) => ({
        mess: msg.mess,
        content: msg.content,
        role: msg.role,
        file: msg.image
          ? {
              content: msg.image.split(",")[1], // Base64 data
              name: "image.jpg",
              type: msg.image.split(";")[0].split(":")[1], // e.g., "image/jpeg"
            }
          : null,
      }));

      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: formattedMessages,
            title,
            oldChatSessionId: selectedChatSession?.id,
          }),
        });
        if (!response.ok) throw new Error("Failed to save chat");
        chatBoxRef.current.resetChat();
        setRefreshTrigger((prev) => prev + 1); // Trigger ChatHistory refresh
      } catch (error) {
        console.error("Error saving chat:", error);
      }
    } else {
      chatBoxRef.current.resetChat(); // Reset even if no messages
    }
  };

  const saveCurrentChatSession = async () => {
    const currentMessages = chatBoxRef.current.getMessages();
    if (currentMessages.length > 0) {
      const title = currentMessages[0].content.substring(0, 50) + "...";
      const formattedMessages = currentMessages.map((msg: any) => ({
        mess: msg.mess,
        content: msg.content,
        role: msg.role,
        file: msg.image
          ? {
              content: msg.image.split(",")[1], // Base64 data
              name: "image.jpg",
              type: msg.image.split(";")[0].split(":")[1], // e.g., "image/jpeg"
            }
          : null,
      }));

      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: formattedMessages,
            title,
            oldChatSessionId: selectedChatSession?.id,
          }),
        });
        if (!response.ok) throw new Error("Failed to save chat");
        chatBoxRef.current.resetChat();
        setRefreshTrigger((prev) => prev + 1); // Trigger ChatHistory refresh
      } catch (error) {
        console.error("Error saving chat:", error);
      }
    } else {
      chatBoxRef.current.resetChat(); // Reset even if no messages
    }
  };

  const handleSelectChatSession = async (session: any) => {
    const currentMessages = chatBoxRef.current.getMessages();
    if (currentMessages.length > 0) {
      await saveCurrentChatSession();
    }
    setSelectedChatSession(session);
  };

  useEffect(() => {
    const handleBeforeUnload = async () => {
      const currentMessages = chatBoxRef.current.getMessages();
      if (selectedChatSession === null && currentMessages.length > 0) {
        await saveCurrentChatSession();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [selectedChatSession]);

  return (
    <div className="min-h-screen p-6 bg-gray-100 relative">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold p-2">AI Assistant 🥏</h1>
            <button
              onClick={handleNewChat}
              title="New Chat"
              className="p-2 hover:bg-gray-200 rounded"
            >
              <FaPlus size={20} />
            </button>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border border-gray-300 rounded-3xl bg-white shadow-lg">
        <div className="flex h-[calc(100vh-8rem)] relative">
          {isChatHistoryVisible && (
            <div className="relative w-1/4 border-r border-gray-300 overflow-y-auto">
              <ChatHistory
                refreshTrigger={refreshTrigger}
                onSelectChatSession={handleSelectChatSession}
              />
            </div>
          )}
          <button
            onClick={toggleChatHistory}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`absolute top-4 text-primary rounded-3xl z-10 ${
              isChatHistoryVisible ? "left-[calc(25%-2rem)]" : "left-2"
            }`}
          >
            {isChatHistoryVisible ? (
              isHovered ? (
                <VscLayoutSidebarLeftOff size={24} />
              ) : (
                <VscLayoutSidebarLeft size={24} />
              )
            ) : isHovered ? (
              <VscLayoutSidebarLeft size={24} />
            ) : (
              <VscLayoutSidebarLeftOff size={24} />
            )}
          </button>
          <div
            className={`flex flex-col rounded-3xl ${
              isChatHistoryVisible ? "w-3/4" : "w-full"
            }`}
          >
            <ChatBox
              ref={chatBoxRef}
              selectedChatSession={selectedChatSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
