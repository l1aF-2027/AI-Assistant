"use client";
import { useState } from "react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import ChatBox from "@/components/ChatBox";
import ChatHistory from "@/components/ChatHistory";
import { VscLayoutSidebarLeftOff } from "react-icons/vsc";
import { VscLayoutSidebarLeft } from "react-icons/vsc";

export default function Home() {
  const [isChatHistoryVisible, setIsChatHistoryVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const toggleChatHistory = () => {
    setIsChatHistoryVisible((prev) => !prev);
    setIsHovered(false); // Reset trạng thái hover ngay sau khi bấm
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Khi chat history hiển thị: mặc định BsLayoutSidebar, hover đổi thành VscLayoutSidebarLeft.
  // Khi chat history ẩn: mặc định VscLayoutSidebarLeft, hover đổi thành BsLayoutSidebar.
  const renderIcon = () => {
    if (isChatHistoryVisible) {
      return isHovered ? (
        <VscLayoutSidebarLeftOff size={24} />
      ) : (
        <VscLayoutSidebarLeft size={24} />
      );
    } else {
      return isHovered ? (
        <VscLayoutSidebarLeft size={24} />
      ) : (
        <VscLayoutSidebarLeftOff size={24} />
      );
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 relative">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold p-2">AI Assitant 🥏</h1>
          <div className="w-200px">
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border border-gray-300 rounded-lg bg-white shadow-lg">
        {/* Chat container */}
        <div className="flex h-[calc(100vh-8rem)] relative">
          {/* Sidebar với chat history */}
          {isChatHistoryVisible && (
            <div className="relative w-1/4 border-r border-gray-300 overflow-y-auto">
              <ChatHistory />
            </div>
          )}

          {/* Nút toggle */}
          <button
            onClick={toggleChatHistory}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`absolute top-4 text-primary z-10 ${
              isChatHistoryVisible
                ? "left-[calc(25%-2rem)] rounded"
                : "left-2 rounded-r"
            }`}
          >
            {renderIcon()}
          </button>

          {/* Khu vực chat chính */}
          <div
            className={`flex flex-col ${
              isChatHistoryVisible ? "w-3/4" : "w-full"
            }`}
          >
            <ChatBox />
          </div>
        </div>
      </div>
    </div>
  );
}
