import Link from "next/link";

/**
 * A link that looks like a HeroUI Button (HeroUI's own button classes), for navigation and
 * downloads, where a <button> would be wrong.
 */
export function LinkButton({ href, children, variant = "primary", size, className = "", external, download, "aria-label": label }: {
  href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost";
  size?: "sm" | "lg"; className?: string; external?: boolean; download?: boolean; "aria-label"?: string;
}) {
  const cls = `button button--${variant} ${size ? `button--${size}` : ""} no-underline ${className}`.trim();
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={label}>{children}</a>;
  // Files from the API proxy are plain downloads, not pages.
  if (download) return <a href={href} className={cls} download aria-label={label}>{children}</a>;
  return <Link href={href} className={cls} aria-label={label}>{children}</Link>;
}
