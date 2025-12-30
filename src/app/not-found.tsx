import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground space-y-4">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="text-xl text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <img src="/404.svg" alt="Not Found" className="w-[300px] h-[300px]" />
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
