import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Update the type definition to match Next.js App Router's expected format
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
    // Check if chat session exists and belongs to current user
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

// Also update the DELETE handler to be consistent
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await auth();
  const { userId } = authResult;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const chatId = params.id;

  try {
    // Check if chat session exists and belongs to current user
    const existingChat = await prisma.chatSession.findFirst({
      where: {
        id: chatId,
        userId,
      },
    });

    if (!existingChat) {
      return new NextResponse("Chat not found", { status: 404 });
    }

    // Delete all messages related to the chat session
    await prisma.chatMessage.deleteMany({
      where: { sessionId: chatId },
    });

    // Delete the chat session
    await prisma.chatSession.delete({
      where: { id: chatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return new NextResponse("Failed to delete chat", { status: 500 });
  }
}

// Function to compare old and new messages
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