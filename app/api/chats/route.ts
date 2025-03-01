"use client";
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
export async function PUT(request: Request) {
  const authResult = await auth();
  const { userId } = authResult;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  // Extract ID from the URL
  const url = new URL(request.url);
  const chatId = url.searchParams.get("id");

  if (!chatId) {
    return new NextResponse("Chat ID is required", { status: 400 });
  }

  const { messages, title } = await request.json();

  try {
    // Rest of your code remains the same
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

    // Check if chat content has changed
    const hasChanged = hasMessagesChanged(existingChat.messages, messages);

    // Delete all old messages
    await prisma.chatMessage.deleteMany({
      where: { sessionId: chatId },
    });

    // Create new messages
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

    // Update title and updatedAt if content changed
    await prisma.chatSession.update({
      where: { id: chatId },
      data: {
        title,
        ...(hasChanged ? { updatedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, updated: hasChanged });
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
