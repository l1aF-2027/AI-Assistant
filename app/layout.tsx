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
  openGraph: {
    title: "Comet - AI Assistant using Gemini API",
    description:
      "The AI Assistant website is an intelligent platform that provides an AI-powered virtual assistant with a wide range of features to support users in their daily tasks.",
    url: "https://comet-ai-assistant.vercel.app",
    type: "website",
    images: [
      {
        url: "https://icons.iconarchive.com/icons/microsoft/fluentui-emoji-3d/256/Comet-3d-icon.png",
        width: 1200,
        height: 630,
        alt: "Comet Website Preview",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="robots" content="index, follow" />
          <meta
            property="og:title"
            content="Comet - AI Assistant using Gemini API"
          />
          <meta
            property="og:description"
            content="The AI Assistant website is an intelligent platform that provides an AI-powered virtual assistant with a wide range of features to support users in their daily tasks."
          />
          <meta
            property="og:url"
            content="https://comet-ai-assistant.vercel.app"
          />
          <meta property="og:type" content="website" />
          <meta
            property="og:image"
            content="https://icons.iconarchive.com/icons/microsoft/fluentui-emoji-3d/256/Comet-3d-icon.png"
          />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Comet Website Preview" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="Comet - AI Assistant using Gemini API"
          />
          <meta
            name="twitter:description"
            content="The AI Assistant website is an intelligent platform that provides an AI-powered virtual assistant with a wide range of features to support users in their daily tasks."
          />
          <meta
            name="twitter:image"
            content="https://icons.iconarchive.com/icons/microsoft/fluentui-emoji-3d/256/Comet-3d-icon.png"
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
