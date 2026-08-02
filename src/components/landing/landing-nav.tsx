import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { primaryCtaSm } from "./styles";

const links = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "How it works" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Docket home">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-mono text-sm font-semibold text-accent-ink">
            D
          </span>
          <span className="font-display text-lg tracking-tight text-ink">Docket</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Landing">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link href="/register" className={primaryCtaSm}>
            Start free
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
