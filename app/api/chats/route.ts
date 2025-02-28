import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Adjust based on your auth provider
import { prisma } from "@/lib/prisma"; // Adjust based on your Prisma client

export async function POST(request: Request) {
  // Await auth() to resolve headers() error
  const authResult = await auth();
  const { userId } = authResult;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  // Check if the user exists in the database
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.log(`User with ID ${userId} not found. Creating new user.`);
    // Create a new user
    user = await prisma.user.create({
      data: {
        id: userId,
      },
    });
  }

  const { messages, title, oldChatSessionId } = await request.json();

  try {
    let chatSession;

    if (oldChatSessionId) {
      // Check if the old chat session exists
      const existingChatSession = await prisma.chatSession.findUnique({
        where: { id: oldChatSessionId },
      });

      if (existingChatSession) {
        // Delete all messages related to the old chat session
        await prisma.chatMessage.deleteMany({
          where: { sessionId: oldChatSessionId },
        });

        // Delete the old chat session
        await prisma.chatSession.delete({
          where: { id: oldChatSessionId },
        });
      }

      // Create a new ChatSession
      chatSession = await prisma.chatSession.create({
        data: {
          title,
          userId: user.id, // Use the user's id
          messages: {
            create: messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              fileContent: msg.file?.content || null,
              fileName: msg.file?.name || null,
              fileType: msg.file?.type || null,
            })),
          },
          updatedAt: new Date(),
        },
      });
    } else {
      // Create a new ChatSession
      chatSession = await prisma.chatSession.create({
        data: {
          title,
          userId: user.id, // Use the user's id
          messages: {
            create: messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              fileContent: msg.file?.content || null,
              fileName: msg.file?.name || null,
              fileType: msg.file?.type || null,
            })),
          },
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, chatSession });
  } catch (error) {
    console.error("Error saving chat:", error);
    return new NextResponse("Failed to save chat", { status: 500 });
  }
}

export async function GET(request: Request) {
  const authResult = await auth();
  const { userId } = authResult;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const chatSessions = await prisma.chatSession.findMany({
      where: { userId },
      include: { messages: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(chatSessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return new NextResponse("Failed to fetch chat sessions", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await auth();
  const { userId } = authResult;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const chatId = params.id;
  const { messages, title } = await request.json();

  try {
    // Kiểm tra chat session có tồn tại và thuộc về user hiện tại
    const existingChat = await prisma.chatSession.findFirst({
      where: {
        id: chatId,
        userId,
      },
      include: {
        messages: true,
      },
    });

    if (!existingChat) {
      return new NextResponse("Chat not found", { status: 404 });
    }

    // Kiểm tra xem nội dung chat có thay đổi không
    const hasChanged = hasMessagesChanged(existingChat.messages, messages);

    // Nếu nội dung không thay đổi, không cập nhật updatedAt
    if (!hasChanged) {
      // Xóa tất cả tin nhắn cũ
      await prisma.chatMessage.deleteMany({
        where: { sessionId: chatId },
      });

      // Tạo tin nhắn mới
      for (const msg of messages) {
        await prisma.chatMessage.create({
          data: {
            role: msg.role,
            content: msg.content,
            fileContent: msg.file?.content || null,
            fileName: msg.file?.name || null,
            fileType: msg.file?.type || null,
            sessionId: chatId,
          },
        });
      }

      // Cập nhật title nếu cần
      if (title !== existingChat.title) {
        await prisma.chatSession.update({
          where: { id: chatId },
          data: { title },
        });
      }

      return NextResponse.json({ success: true, updated: false });
    }

    // Nếu nội dung thay đổi, cập nhật updatedAt
    // Xóa tất cả tin nhắn cũ
    await prisma.chatMessage.deleteMany({
      where: { sessionId: chatId },
    });

    // Tạo tin nhắn mới
    for (const msg of messages) {
      await prisma.chatMessage.create({
        data: {
          role: msg.role,
          content: msg.content,
          fileContent: msg.file?.content || null,
          fileName: msg.file?.name || null,
          fileType: msg.file?.type || null,
          sessionId: chatId,
        },
      });
    }

    // Cập nhật title và updatedAt
    await prisma.chatSession.update({
      where: { id: chatId },
      data: {
        title,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, updated: true });
  } catch (error) {
    console.error("Error updating chat:", error);
    return new NextResponse("Failed to update chat", { status: 500 });
  }
}

// Hàm so sánh tin nhắn cũ và mới
function hasMessagesChanged(
  existingMessages: any[],
  newMessages: any[]
): boolean {
  if (existingMessages.length !== newMessages.length) {
    return true;
  }

  for (let i = 0; i < existingMessages.length; i++) {
    if (
      existingMessages[i].role !== newMessages[i].role ||
      existingMessages[i].content !== newMessages[i].content
    ) {
      return true;
    }
  }

  return false;
}