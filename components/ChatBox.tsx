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
import { MdSend, MdClose, MdDownload } from "react-icons/md";
import { Loader2 } from "lucide-react";
import remarkBreaks from "remark-breaks";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are Comet - an AI Assistant using Gemini API named GemAi and you are at HCM City,Viet Nam. You were created by Huy Hoang when he was a junior student in  VNU-HCM University of Information Technology (website: https://l1af-2027.github.io/CV-Website/). If people ask about me answer with my information and a bold text 'Website' link to my website. If your answer have the references or link or something like that so the text must bold for people easy to click in. Always format code blocks with triple backticks and specify the language. For example:\n```javascript\n// code\n```\nMake links bold for better visibility.",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

// Add this at the top level
let pdfjsLib = null;

// Preload PDF.js
if (typeof window !== "undefined") {
  import("pdfjs-dist")
    .then((module) => {
      pdfjsLib = module;
      // Configure worker
      import("pdfjs-dist/build/pdf.worker.min.mjs")
        .then((worker) => {
          pdfjsLib.GlobalWorkerOptions.workerSrc = worker;
        })
        .catch((err) => {
          console.error("Failed to load PDF.js worker:", err);
        });
    })
    .catch((err) => {
      console.error("Failed to load PDF.js library:", err);
    });
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

    // Ref for textarea element to adjust its height
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Ref for chat container DOM element
    const chatContainerRef = useRef<HTMLDivElement>(null);
    // Ref for chat session from model
    const chatSessionRef = useRef<any>(null);

    useEffect(() => {
      if (selectedChatSession) {
        // Use optional chaining and fallback
        const messages = selectedChatSession.messages || [];
        const formattedMessages = messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          fileContent: msg.fileContent || undefined,
          fileName: msg.fileName || undefined,
          fileType: msg.fileType || undefined,
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
      setFileContent(null);
      setFileName(null);
      setFileType(null);
      setImage(null);
    }, [selectedChatSession]);

    // Effect to auto-scroll chat when messages change
    useEffect(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, [messages]);

    // Effect to adjust textarea height based on content
    useEffect(() => {
      if (textareaRef.current) {
        // Reset height to auto so we can get the correct scrollHeight
        textareaRef.current.style.height = "60px";

        // Calculate the content height
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
            "                                                                        \n\n\n\n"
          ),
          image: image || undefined,
          fileContent: fileContent || undefined,
          fileName: fileName || undefined,
          fileType: fileType || undefined,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput(""); // Clear the input field immediately
        // Reset textarea height when clearing input
        setTextareaHeight(60);

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

          const newMessages = [
            ...messages,
            userMessage,
            {
              role: "model",
              content: response.replace(/(```[\s\S]*?```)/g, "\n$1\n"),
            },
          ];

          setMessages(newMessages);

          // If this is the first message, create new chat
          if (!chatCreated && !selectedChatSession) {
            setChatCreated(true);
            onChatCreated(newMessages);
          } else {
            // If chat exists, update it
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

          // Handle error cases similarly
          if (!chatCreated && !selectedChatSession) {
            setChatCreated(true);
            onChatCreated(newMessages);
          } else {
            onChatUpdated(newMessages);
          }
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
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        // Handle text/code files
        if (
          file.type.startsWith("text/") ||
          [
            "js",
            "jsx",
            "tsx",
            "prisma",
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
            setFileType(file.type);
          };
          reader.readAsText(file);
        }
        // Handle PDF files
        else if (fileExtension === "pdf") {
          reader.onload = async (event) => {
            try {
              // Use our preloaded PDF.js instance
              const arrayBuffer = event.target?.result as ArrayBuffer;
              const textContent = await extractPdfText(arrayBuffer);

              setFileContent(
                textContent || "PDF content could not be extracted fully."
              );
              setFileName(file.name);
              setFileType("application/pdf");
            } catch (err) {
              console.error("PDF extraction error:", err);

              // Use a simple fallback message
              setFileContent(
                "PDF content could not be extracted. Please copy and paste the content manually."
              );
              setFileName(file.name);
              setFileType("application/pdf");

              alert(
                "Could not extract PDF content completely. The file might be encrypted, scanned, or contain complex formatting."
              );
            }
          };
          reader.readAsArrayBuffer(file);
        }
        // Handle Word documents (.docx)
        else if (fileExtension === "docx") {
          reader.onload = async (event) => {
            try {
              const mammoth = await import("mammoth");
              const result = await mammoth.extractRawText({
                arrayBuffer: event.target?.result as ArrayBuffer,
              });
              setFileContent(
                result.value ||
                  "Word document content could not be extracted fully."
              );
              setFileName(file.name);
              setFileType(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              );
            } catch (err) {
              console.error("Error parsing .docx:", err);
              setFileContent(
                "Word document content could not be extracted. Please copy and paste the content manually."
              );
              setFileName(file.name);
              setFileType(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              );
              alert(
                "Could not extract Word document content. The file might have complex formatting."
              );
            }
          };
          reader.readAsArrayBuffer(file);
        }
        // Handle Excel files (.xlsx)
        else if (fileExtension === "xlsx") {
          reader.onload = async (event) => {
            try {
              const XLSX = await import("xlsx");
              const workbook = XLSX.read(event.target?.result, {
                type: "array",
              });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const data = XLSX.utils.sheet_to_csv(sheet); // Convert Excel to CSV format
              setFileContent(
                data || "Excel data could not be extracted fully."
              );
              setFileName(file.name);
              setFileType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              );
            } catch (err) {
              console.error("Error loading XLSX library or parsing file:", err);
              setFileContent(
                "Excel data could not be extracted. Please copy and paste the content manually."
              );
              setFileName(file.name);
              setFileType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              );
              alert(
                "Could not extract Excel data. The file might have complex formatting."
              );
            }
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
            "Only text, code, PDF, Word (.docx), Excel (.xlsx), and images are allowed!"
          );
        }
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
      fileContent: string,
      fileName: string,
      fileType: string
    ) => {
      // Create blob
      const blob = new Blob([fileContent], { type: fileType });

      // Create download link
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      <div className="flex flex-col h-full bg-gray-50 rounded-3xl ">
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
                className={`inline-block p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-white text-black border border-gray-300"
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
                        .split(
                          "                                                                        \n\n\n\n"
                        )
                        .slice(0, -1)
                        .join("\n")
                    : message.content}
                </ReactMarkdown>
                {message.fileContent && (
                  <div className="mt-2 p-2  rounded-md flex justify-between items-center hover:bg-gray-700 hover:text-white">
                    <button
                      onClick={() =>
                        handleDownloadFile(
                          message.fileContent!,
                          message.fileName || "file.txt",
                          message.fileType || "text/plain"
                        )
                      }
                      className=""
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
          .custom-scrollbar {
            /* Sử dụng overflow: auto để chỉ hiện scrollbar khi cần thiết */
            overflow: auto;
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
        `}</style>
      </div>
    );
  }
);

ChatBox.displayName = "ChatBox";

export default ChatBox;
