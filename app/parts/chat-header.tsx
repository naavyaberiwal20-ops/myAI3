import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Left block for header content
 */
export function ChatHeaderBlock({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("gap-2 flex items-center", className)}>
      {children}
    </div>
  );
}

/**
 * Main header – NOW locked so no “New” or “Save”
 * Only shows:
 *  - Left content (ChatHeaderBlock)
 *  - Theme toggle on the right
 */
export function ChatHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex items-center justify-between py-5 px-5 bg-linear-to-b from-background to-transparent">

      {/* LEFT SIDE: All injected blocks */}
      <div className="flex items-center gap-4">
        {children}
      </div>

      {/* RIGHT SIDE: FIXED — ONLY THEME TOGGLE */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </div>
  );
}
