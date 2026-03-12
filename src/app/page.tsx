import { ModeToggle } from "@/components/mode-toggle";
import { H1, Paragraph, Link } from "@/components/typography";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <H1 className="text-5xl font-bold tracking-tight">Hello World</H1>

      <div className="flex items-center gap-4">
        <Link href="/dashboard">Garmin Dashboard →</Link>
        <Link href="/inspect">Inspect Data →</Link>
      </div>
    </div>
  );
}
