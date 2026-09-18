import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuroraBackground from "@/components/AuroraBackground";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pneumora — AI-Powered Chest Radiograph Pneumonia Screening & XAI",
  description:
    "Explainable AI pneumonia detection system powered by EfficientNetB0 with Grad-CAM saliency mapping. Clinical-grade 3D thoracic twin and interpretability audit.",
  icons: {
    icon: "/pneumora-icon.png",
    shortcut: "/pneumora-icon.png",
    apple: "/pneumora-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300 relative"
        suppressHydrationWarning
      >
        <AuroraBackground />
        <div className="relative z-10 flex flex-col flex-1 min-h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
