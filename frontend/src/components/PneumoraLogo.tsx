import Image from "next/image";

interface PneumoraLogoProps {
  size?: number;
  variant?: "icon" | "full";
  className?: string;
}

export default function PneumoraLogo({
  size = 32,
  variant = "icon",
  className = "",
}: PneumoraLogoProps) {
  if (variant === "full") {
    return (
      <Image
        src="/pneumora-brand-full.png"
        alt="Pneumora Logo"
        width={160}
        height={38}
        className={`h-8 w-auto object-contain drop-shadow-[0_0_14px_rgba(6,182,212,0.4)] ${className}`}
        priority
      />
    );
  }

  return (
    <Image
      src="/pneumora-icon.png"
      alt="Pneumora Icon"
      width={size}
      height={size}
      className={`object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.45)] ${className}`}
      style={{ width: size, height: size }}
      priority
    />
  );
}
