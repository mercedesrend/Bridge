import Script from "next/script";

export const metadata = {
  title: "Bridge",
  description: "The extra chair in the exam room — in your language.",
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#050505",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body className="theme-dark" data-screen="lang" suppressHydrationWarning>
        {children}
        <Script src="/static/i18n.js" strategy="beforeInteractive" />
        <Script src="/static/app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
