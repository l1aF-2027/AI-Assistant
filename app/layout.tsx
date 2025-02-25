import {
  ClerkProvider,
} from "@clerk/nextjs";
import "./globals.css";

export const metadata = {
  title: "GemAi",
  icons:
  {
    icon: 'web.ico',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
