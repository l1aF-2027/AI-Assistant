"use client";
import { useState, useRef, useEffect } from "react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import ChatBox from "@/components/ChatBox";
import ChatHistory from "@/components/ChatHistory";
import { VscLayoutSidebarLeftOff, VscLayoutSidebarLeft } from "react-icons/vsc";
import { FaPlus } from "react-icons/fa";

export default function Home() {
  // State để xác định màn hình mobile (dưới md)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  // Khởi tạo trạng thái hiển thị chatHistory:
  // Nếu màn hình lớn (>=768px) thì mặc định true, nếu nhỏ thì false.
  const [isChatHistoryVisible, setIsChatHistoryVisible] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  const [isHovered, setIsHovered] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedChatSession, setSelectedChatSession] = useState<any>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const chatBoxRef = useRef<any>(null);

  // Lắng nghe resize để cập nhật isMobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Nếu chuyển sang mobile, ta có thể ẩn ChatHistory
      if (mobile) {
        setIsChatHistoryVisible(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleChatHistory = () => {
    setIsChatHistoryVisible((prev) => !prev);
    setIsHovered(false);
  };

  const handleNewChat = () => {
    setSelectedChatSession(null);
    setCurrentChatId(null);
    chatBoxRef.current.resetChat();
  };

  const handleChatCreated = async (messages: any[]) => {
    if (messages.length > 0) {
      const title = messages[0].content.substring(0, 50) + "...";
      const formattedMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        file: msg.image
          ? {
              content: msg.image.split(",")[1],
              name: "image.jpg",
              type: msg.image.split(";")[0].split(":")[1],
            }
          : msg.fileContent
          ? {
              content: msg.fileContent,
              name: msg.fileName || "file",
              type: msg.fileType || "text/plain",
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
          }),
        });

        if (!response.ok) throw new Error("Failed to save chat");

        const data = await response.json();
        setCurrentChatId(data.chatSession.id);
        setRefreshTrigger((prev) => prev + 1); // Trigger ChatHistory refresh
      } catch (error) {
        console.error("Error creating chat:", error);
      }
    }
  };

  const handleChatUpdated = async (messages: any[]) => {
    if (messages.length > 0 && currentChatId) {
      const title = messages[0].content.substring(0, 50) + "...";
      const formattedMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        file: msg.image
          ? {
              content: msg.image.split(",")[1],
              name: "image.jpg",
              type: msg.image.split(";")[0].split(":")[1],
            }
          : msg.fileContent
          ? {
              content: msg.fileContent,
              name: msg.fileName || "file",
              type: msg.fileType || "text/plain",
            }
          : null,
      }));

      try {
        const response = await fetch(`/api/chats/${currentChatId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: formattedMessages,
            title,
          }),
        });

        if (!response.ok) throw new Error("Failed to update chat");
        setRefreshTrigger((prev) => prev + 1); // Trigger ChatHistory refresh
      } catch (error) {
        console.error("Error updating chat:", error);
      }
    }
  };

  const handleSelectChatSession = (session: any) => {
    setSelectedChatSession(session);
    setCurrentChatId(session.id);
  };

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
          {/* ChatHistory */}
          {isChatHistoryVisible && (
            <div
              className={
                isMobile
                  ? "absolute top-0 left-0 w-full h-full z-20 bg-white overflow-y-auto rounded-3xl"
                  : "relative w-1/4 border-r border-gray-300 overflow-y-auto"
              }
            >
              <ChatHistory
                refreshTrigger={refreshTrigger}
                onSelectChatSession={handleSelectChatSession}
              />
            </div>
          )}

          {/* Nút toggle menu */}
          <button
            onClick={toggleChatHistory}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`absolute top-4 text-primary rounded-3xl z-30 ${
              !isMobile
                ? isChatHistoryVisible
                  ? "left-[calc(25%-2rem)]"
                  : "left-2"
                : "left-2"
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

          {/* ChatBox: Trên mobile, ẩn ChatBox khi ChatHistory đang hiển thị */}
          {(!isMobile || (isMobile && !isChatHistoryVisible)) && (
            <div
              className={`flex flex-col rounded-3xl ${
                !isMobile
                  ? isChatHistoryVisible
                    ? "w-3/4"
                    : "w-full rounded-3xl"
                  : "w-full"
              }`}
            >
              <ChatBox
                ref={chatBoxRef}
                selectedChatSession={selectedChatSession}
                onChatCreated={handleChatCreated}
                onChatUpdated={handleChatUpdated}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
