import Link from "next/link";

/** A Next.js link styled like a HeroUI button (for navigation, where a <button> would be wrong). */
export function LinkButton({ href, children, variant = "primary", size, className = "", external }: {
  href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost";
  size?: "sm" | "lg"; className?: string; external?: boolean;
}) {
  const cls = `button button--${variant} ${size ? `button--${size}` : ""} ${className}`.trim();
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
  ) : (
    <Link href={href} className={cls}>{children}</Link>
  );
}
