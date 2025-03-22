import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata = {
  title: "Comet",
  icons: {
    icon: "web.ico",
  },
  description:
    "The AI Assistant website is an intelligent platform that provides an AI-powered virtual assistant with a wide range of features to support users in their daily tasks.",
  keywords:
    "AI Assistant, AI-powered virtual assistant, AI assistant website, AI assistant platform, AI assistant features, AI assistant tasks, Comet, Comet AI assistant, AI assistant by l1af-2027, AI assistant by l1af-2027 Comet",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
