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
import { MdSend, MdClose, MdDownload, MdContentCopy } from "react-icons/md";
import { Loader2, Check } from "lucide-react";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import katex from "katex";
import { Buffer } from "buffer";

(window as any).Buffer = Buffer;
const InlineMath = ({ children }: { children: string }) => {
  const html = katex.renderToString(children?.toString() || "", {
    throwOnError: false,
    output: "mathml",
  });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const BlockMath = ({ children }: { children: string }) => {
  const html = katex.renderToString(children?.toString() || "", {
    throwOnError: false,
    displayMode: true,
  });
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: `You are Comet - an AI Assistant using Gemini API named GemAi and you are at HCM City, Viet Nam. You were created by Huy Hoang when he was a junior student (third year) in VNU-HCM University of Information Technology (website: https://l1af-2027.github.io/CV-Website/). If people ask about me answer with my information and a bold text 'Website' link to my website. If your answer has references or links or something like that, the text must be bold for people to easily click on. Always format code blocks with triple backticks and specify the language. When formatting and recognizing code blocks, the opening and closing triple backticks must be aligned  at the start of new line. For example:\n\`\`\`javascript\n// code\n\`\`\`\nMake links bold for better visibility. If anyone asks you about the current time or anything related to the present, use the current time: ${getCurrentTime()}.`,
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

let pdfjsLib = null;

if (typeof window !== "undefined") {
  import("pdfjs-dist")
    .then((module) => {
      pdfjsLib = module;
      import("pdfjs-dist/build/pdf.worker.min.mjs")
        .then((worker) => {
          pdfjsLib.GlobalWorkerOptions.workerSrc = worker;
        })
        .catch(console.error);
    })
    .catch(console.error);
}

interface Message {
  role: string;
  content: string;
  image?: string;
  fileContent?: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
}

interface ChatBoxProps {
  selectedChatSession: any;
  onChatCreated: (messages: Message[]) => void;
  onChatUpdated: (messages: Message[]) => void;
}

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-1.5 bg-gray-700 bg-opacity-80 text-white rounded-md hover:bg-opacity-100 transition-colors"
        title="Copy code"
      >
        {copied ? (
          <Check size={16} className="text-green-400" />
        ) : (
          <MdContentCopy size={16} />
        )}
      </button>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        className="rounded-md"
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const ChatBox = forwardRef(
  (
    { selectedChatSession, onChatCreated, onChatUpdated }: ChatBoxProps,
    ref
  ) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [chatCreated, setChatCreated] = useState(false);
    const [textareaHeight, setTextareaHeight] = useState(100);
    const [isDragging, setIsDragging] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatSessionRef = useRef<any>(null);

    // Xử lý drag and drop
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const fakeEvent = {
          target: {
            files: files,
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        await handleFileUpload(fakeEvent);
      }
    };

    useEffect(() => {
      if (selectedChatSession) {
        const messages = selectedChatSession.messages || [];
        const formattedMessages = messages.map((msg: any) => ({
          ...msg,
          image:
            msg.fileType?.startsWith("image/") && msg.fileContent
              ? `data:${msg.fileType};base64,${msg.fileContent}`
              : undefined,
        }));
        setMessages(formattedMessages);
        setChatCreated(true);

        chatSessionRef.current = model.startChat({
          history: formattedMessages.map((msg: Message) => ({
            role: msg.role,
            parts: [{ text: msg.content }],
          })),
        });
      } else {
        chatSessionRef.current = model.startChat({ history: [] });
        setMessages([]);
        setChatCreated(false);
      }
    }, [selectedChatSession]);

    useEffect(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, [messages]);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "60px";
        const scrollHeight = textareaRef.current.scrollHeight;
        const newHeight = Math.min(Math.max(60, scrollHeight), 200);
        textareaRef.current.style.height = `${newHeight}px`;
        setTextareaHeight(newHeight);
      }
    }, [input]);

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
          ].join(
            "                                                                                                          \n\n"
          ),
          image: image || undefined,
          fileContent: fileContent || undefined,
          fileName: fileName || undefined,
          fileType: fileType || undefined,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setTextareaHeight(60);

        try {
          const parts: any[] = [{ text: userMessage.content }];
          if (image) {
            const [metaInfo, base64Data] = image.split(",");
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: metaInfo.split(":")[1].split(";")[0],
              },
            });
          }

          const result = await chatSessionRef.current.sendMessage(parts);
          const response = await result.response.text();

          const newMessages = [
            ...messages,
            userMessage,
            {
              role: "model",
              content: response.replace(/(```[\s\S]*?```)/g, "\n$1\n"),
            },
          ];

          setMessages(newMessages);
          if (!chatCreated && !selectedChatSession) {
            onChatCreated(newMessages);
            setChatCreated(true); // Mark the chat as created to ensure subsequent messages update it
          } else {
            onChatUpdated(newMessages);
          }
        } catch (error) {
          console.error("Error:", error);
          const errorMessage = {
            role: "model",
            content: "⚠️ An error occurred while processing your request",
          };
          const newMessages = [...messages, userMessage, errorMessage];
          setMessages(newMessages);
          !chatCreated && !selectedChatSession
            ? onChatCreated(newMessages)
            : onChatUpdated(newMessages);
        } finally {
          setIsLoading(false);
          setImage(null);
          setFileContent(null);
          setFileName(null);
          setFileType(null);
        }
      }
    };

    // Function to extract text from PDF using a fallback approach
    const extractPdfText = async (arrayBuffer) => {
      try {
        // Check if pdfjsLib is loaded
        if (!pdfjsLib) {
          throw new Error("PDF.js library not loaded");
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => item.str);
          textContent += strings.join(" ") + "\n";
        }

        return textContent;
      } catch (err) {
        console.error("Error extracting PDF text:", err);
        throw err;
      }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();

        // Đọc file dưới dạng ArrayBuffer
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;

          // Convert sang Base64 để lưu trữ
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );

          setFileContent(base64); // Lưu dữ liệu gốc dưới dạng base64
          setFileName(file.name);
          setFileType(file.type);
        };

        reader.readAsArrayBuffer(file);
      }
    };

    const handleRemoveFile = () => {
      setFileContent(null);
      setFileName(null);
      setFileType(null);
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

    // Updated Markdown components with custom code block renderer
    const MarkdownComponents = {
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        return !inline && match ? (
          <CodeBlock
            language={match[1]}
            value={String(children).replace(/\n$/, "")}
          />
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      table({ children }: { children: React.ReactNode }) {
        return (
          <table className="border-collapse border border-gray-400 justify-center">
            {children}
          </table>
        );
      },
      th({ children }: { children: React.ReactNode }) {
        return (
          <th className="border border-gray-400 px-2 py-1 bg-gray-100">
            {children}
          </th>
        );
      },
      td({ children }: { children: React.ReactNode }) {
        return <td className="border border-gray-400 px-2 py-1">{children}</td>;
      },
      math: ({ children }: { children: string }) => (
        <BlockMath>{children}</BlockMath>
      ),
      inlineMath: ({ children }: { children: string }) => (
        <InlineMath>{children}</InlineMath>
      ),
    };

    useImperativeHandle(ref, () => ({
      getMessages: () => messages,
      resetChat: () => {
        setMessages([]);
        setChatCreated(false);
        chatSessionRef.current = model.startChat({ history: [] });
      },
    }));

    const getFileIcon = (fileType: string | null, fileName: string | null) => {
      if (!fileType || !fileName)
        return <img src="/icons/default.png" alt="Default Icon" width="24" />;

      const extension = fileName.split(".").pop()?.toLowerCase();

      if (fileType.startsWith("image/")) {
        switch (extension) {
          case "jpg":
          case "jpeg":
            return <img src="/icons/jpg.png" alt="JPG Icon" width="24" />;
          case "png":
            return <img src="/icons/png.png" alt="PNG Icon" width="24" />;
          case "gif":
            return <img src="/icons/gif.png" alt="GIF Icon" width="24" />;
          case "bmp":
            return <img src="/icons/bmp.png" alt="BMP Icon" width="24" />;
          case "svg":
            return <img src="/icons/svg.png" alt="SVG Icon" width="24" />;
          case "tiff":
          case "tif":
            return (
              <img
                src="/icons/tiff.png"
                alt="TIFF Icon"
                width="24"
                height="24"
              />
            );
          case "ico":
            return <img src="/icons/ico.png" alt="ICO Icon" width="24" />;
          default:
            return (
              <img
                src="/icons/image.png"
                alt="Image Icon"
                width="24"
                height="24"
              />
            );
        }
      }
      if (extension === "pdf")
        return <img src="/icons/pdf.png" alt="PDF Icon" width="24" />;
      if (extension === "docx")
        return <img src="/icons/docx.png" alt="DOCX Icon" width="24" />;
      if (extension === "doc")
        return <img src="/icons/doc.png" alt="DOC Icon" width="24" />;
      if (extension === "xlsx")
        return <img src="/icons/xlsx.png" alt="XLSX Icon" width="24" />;
      if (extension === "xls")
        return <img src="/icons/xls.png" alt="XLS Icon" width="24" />;

      // Default for text/code files
      if (extension === "js")
        return <img src="/icons/code.png" alt="JS Icon" width="24" />;
      if (extension === "ts")
        return <img src="/icons/code.png" alt="TS Icon" width="24" />;
      if (extension === "jsx")
        return <img src="/icons/code.png" alt="JSX Icon" width="24" />;
      if (extension === "tsx")
        return <img src="/icons/code.png" alt="TSX Icon" width="24" />;
      if (["py"].includes(extension!))
        return <img src="/icons/python.png" alt="Python Icon" width="24" />;
      if (["css"].includes(extension!))
        return <img src="/icons/css.png" alt="CSS Icon" width="24" />;
      if (["txt"].includes(extension!))
        return <img src="/icons/txt.png" alt="TXT Icon" width="24" />;
      if (extension === "html")
        return <img src="/icons/html.png" alt="HTML Icon" width="24" />;

      return <img src="/icons/default.png" alt="Default Icon" width="24" />;
    };

    // Function to download file content
    const handleDownloadFile = (
      base64Content: string,
      fileName: string,
      mimeType: string
    ) => {
      // Chuyển base64 thành ArrayBuffer
      const byteString = atob(base64Content);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uintArray = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteString.length; i++) {
        uintArray[i] = byteString.charCodeAt(i);
      }

      // Tạo Blob từ dữ liệu gốc
      const blob = new Blob([arrayBuffer], { type: mimeType });

      // Tạo link tải xuống
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    };

    // Function to download image
    const handleDownloadImage = (
      imageData: string,
      fileName: string = "image.jpg"
    ) => {
      const link = document.createElement("a");
      link.href = imageData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div
        className="flex flex-col h-full bg-gray-50 rounded-3xl relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-black bg-opacity-50 z-50 rounded-3xl flex items-center justify-center drag-overlay">
            <div className="text-white text-xl font-semibold flex items-center">
              <HiOutlineUpload className="mr-2" size={32} />
              Drop files here to upload
            </div>
          </div>
        )}
        <div
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto p-4 custom-scrollbar"
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
                    <button
                      onClick={() =>
                        handleDownloadImage(
                          message.image!,
                          `image_${index}.jpg`
                        )
                      }
                      className="absolute bottom-2 right-2 p-1 bg-gray-800 bg-opacity-70 text-white rounded-full hover:bg-opacity-90"
                      title="Download image"
                    >
                      <MdDownload size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div
                className={`inline-block p-4 rounded-lg max-w-[800px] ${
                  message.role === "user"
                    ? "bg-white text-black border border-gray-300"
                    : "bg-gray-200 text-black"
                }`}
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  width: "100%", // Add this line
                }}
              >
                <ReactMarkdown
                  components={MarkdownComponents}
                  remarkPlugins={[remarkBreaks, remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {message.fileContent
                    ? message.content.split(
                        "                                                                                                          \n\n**File:**"
                      )[0]
                    : message.content}
                </ReactMarkdown>

                {message.fileContent &&
                  !message.fileType?.startsWith("image/") && (
                    <div className="mt-2 p-2 rounded-md flex justify-between items-center hover:bg-gray-700 hover:text-white">
                      <button
                        onClick={() =>
                          handleDownloadFile(
                            message.fileContent!,
                            message.fileName || "file.txt",
                            message.fileType || "text/plain"
                          )
                        }
                        title="Download file"
                      >
                        <span className="text-sm font-medium flex items-center">
                          {getFileIcon(
                            message.fileType || null,
                            message.fileName
                          )}
                          <span className="ml-2">{message.fileName}</span>
                        </span>
                      </button>
                    </div>
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
          {(image || fileContent) && !isLoading && (
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
                  >
                    <MdClose size={16} />
                  </button>
                </div>
              )}
              {fileContent && (
                <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium flex items-center">
                      {getFileIcon(fileType, fileName)}
                      <span className="ml-2">{fileName}</span>
                    </span>
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
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message ..."
              className="w-full p-3 pr-16 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 custom-scrollbar"
              style={{
                minHeight: "60px",
                height: `${textareaHeight}px`,
                maxHeight: "200px",
                overflowY: textareaHeight >= 200 ? "auto" : "hidden",
                lineHeight: "1.5",
              }}
              onKeyPress={handleKeyPress}
            />
            <div className="absolute right-1 bottom-4 flex gap-2">
              <input
                type="file"
                accept=".txt,.js,.ts,.py,.java,.c,.cpp,.html,.css,.md,image/*,.docx,.pdf,.xlsx,.xls,.tsx,.ts,.js,.jsx,.prisma,.doc, .xls,.csv"
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
          custom-scrollbar {
            overflow: auto;
            /* Prevent horizontal scroll */
            overflow-x: hidden;
          }

          /* Add these new rules */
          .react-markdown pre {
            white-space: pre-wrap;
            word-break: break-word;
            max-width: 100%;
          }

          .react-markdown code {
            white-space: pre-wrap;
            word-break: break-word;
          }
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
          .drag-overlay {
            border: 2px dashed rgb(29, 29, 37);
            transition: all 0.3s ease;
            pointer-events: none;
          }
        `}</style>
      </div>
    );
  }
);

ChatBox.displayName = "ChatBox";

export default ChatBox;
