"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { HiOutlineUpload } from "react-icons/hi";
import { MdSend, MdClose } from "react-icons/md";
import { Loader2 } from "lucide-react";
import remarkBreaks from "remark-breaks";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are an AI Assistant using Gemini API named GemAi. You were created by Huy Hoang (website: https://l1af-2027.github.io/CV-Website/). If people ask about me answer with my information and a bold text 'Website' link to my website. If your answer have the references or link or something like that so the text must bold for people easy to click in. Always format code blocks with triple backticks and specify the language. For example:\n```javascript\n// code\n```\nMake links bold for better visibility.",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

interface Message {
  role: string;
  content: string;
  image?: string;
  fileContent?: string;
  fileName?: string;
}

interface ChatBoxProps {
  selectedChatSession: any;
}

const ChatBox = forwardRef(({ selectedChatSession }: ChatBoxProps, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ref cho phần tử DOM chứa khung chat
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // Ref cho phiên chat từ model
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize chat session with empty history or load selected chat session
    if (selectedChatSession) {
      setMessages(selectedChatSession.messages);
      chatSessionRef.current = model.startChat({
        history: selectedChatSession.messages.map((msg: Message) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });
    } else {
      chatSessionRef.current = model.startChat({
        history: [],
      });
    }
  }, [selectedChatSession]);

  // useEffect để tự động cuộn xuống dưới khi messages thay đổi
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((input.trim() || image || fileContent) && !isLoading) {
      setIsLoading(true);

      const userMessage: Message = {
        role: "user",
        content: [
          input,
          fileContent
            ? `**File:** ${fileName}\n\`\`\`${fileName
                ?.split(".")
                .pop()}\n${fileContent}\n\`\`\``
            : "",
        ].join("                                  \n\n-\n\n-"),
        image: image || undefined,
        fileContent: fileContent || undefined,
        fileName: fileName || undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput(""); // Clear the input field immediately

      try {
        const parts: any[] = [{ text: userMessage.content }];

        if (image) {
          const [metaInfo, base64Data] = image.split(",");
          const mimeType = metaInfo.split(":")[1].split(";")[0];
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }

        const result = await chatSessionRef.current.sendMessage(parts);
        const response = await result.response.text();

        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: response.replace(/(```[\s\S]*?```)/g, "\n$1\n"),
          },
        ]);
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: "⚠️ An error occurred while processing your request",
          },
        ]);
      } finally {
        setIsLoading(false);
        setImage(null);
        setFileContent(null);
        setFileName(null);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      // Handle text/code files
      if (
        file.type.startsWith("text/") ||
        [
          "js",
          "ts",
          "py",
          "java",
          "c",
          "cpp",
          "html",
          "css",
          "md",
          "txt",
        ].includes(fileExtension!)
      ) {
        reader.onload = (event) => {
          setFileContent(event.target?.result as string);
          setFileName(file.name);
        };
        reader.readAsText(file);
      }
      // Handle Word documents (.docx)
      else if (fileExtension === "docx") {
        reader.onload = async (event) => {
          const mammoth = await import("mammoth");
          mammoth
            .extractRawText({
              arrayBuffer: event.target?.result as ArrayBuffer,
            })
            .then((result) => {
              setFileContent(result.value);
              setFileName(file.name);
            })
            .catch((err) => console.error("Error parsing .docx:", err));
        };
        reader.readAsArrayBuffer(file);
      }
      // Handle Excel files (.xlsx)
      else if (fileExtension === "xlsx") {
        reader.onload = async (event) => {
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(event.target?.result, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_csv(sheet); // Convert Excel to CSV format
          setFileContent(data);
          setFileName(file.name);
        };
        reader.readAsArrayBuffer(file);
      }
      // Handle images
      else if (file.type.startsWith("image/")) {
        reader.onload = (event) => {
          setImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert(
          "Only text, code, Word (.docx), Excel (.xlsx), and images are allowed!"
        );
      }
    }
  };

  const handleRemoveFile = () => {
    setFileContent(null);
    setFileName(null);
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Allow Shift+Enter for new lines
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setInput((prev) => prev + "\n");
    }
  };

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  useImperativeHandle(ref, () => ({
    getMessages: () => messages,
    resetChat: () => {
      setMessages([]);
      chatSessionRef.current = model.startChat({ history: [] });
    },
  }));

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-3xl">
      <div
        ref={chatContainerRef}
        className="flex-grow overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-400"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex flex-col ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {message.image && (
              <div className="mb-2 max-w-[600px]">
                <div className="relative inline-block">
                  <img
                    src={message.image}
                    alt="Uploaded"
                    className="max-h-40 rounded-lg object-contain"
                  />
                </div>
              </div>
            )}

            <div
              className={`inline-block p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-black text-white"
                  : "bg-gray-200 text-black"
              }`}
              style={{ maxWidth: "min(90%, 600px)" }}
            >
              <ReactMarkdown
                components={MarkdownComponents}
                remarkPlugins={[remarkBreaks]}
              >
                {message.fileContent
                  ? message.content
                      .split("                                  \n\n-\n\n-")
                      .slice(0, -1)
                      .join("\n")
                  : message.content}
              </ReactMarkdown>
              {message.fileContent && (
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                    message.fileContent
                  )}`}
                  download={message.fileName}
                  className="text-white"
                >
                  <span className="text-sm font-medium">
                    📄 {message.fileName}
                  </span>
                </a>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="flex items-center text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI is typing...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t rounded-b-3xl bg-white">
        {(image || fileContent) && (
          <div className="relative mb-2 space-y-2">
            {image && (
              <div className="relative inline-block">
                <img
                  src={image}
                  alt="Upload preview"
                  className="max-h-20 object-contain rounded-lg"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                  style={{ transform: "translate(50%, -50%)" }}
                >
                  <MdClose size={16} />
                </button>
              </div>
            )}
            {fileContent && (
              <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">📄 {fileName}</span>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-700"
                >
                  <MdClose size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message ..."
            className="w-full p-3 pr-16 border rounded-lg resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-gray-500 custom-scrollbar"
            onKeyPress={handleKeyPress}
          />
          <div className="absolute right-1 bottom-4 flex gap-2">
            <input
              type="file"
              accept=".txt,.js,.ts,.py,.java,.c,.cpp,.html,.css,.md,image/*,.docx,.pdf,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              multiple={false}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              <HiOutlineUpload size={22} className="text-gray-600" />
            </label>
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <MdSend size={22} className="text-gray-600" />
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
});

export default ChatBox;
