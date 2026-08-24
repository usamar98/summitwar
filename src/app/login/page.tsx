import type { Metadata } from "next";
import { LoginForm } from "@/components/summitwar/login-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Owner login",
  robots: { index: false, follow: false },
};
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const nextPath =
    query.next?.startsWith("/") && !query.next.startsWith("//")
      ? query.next
      : "/dashboard";
  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <Card>
        <CardHeader>
          <Badge
            variant="outline"
            className="mb-3 w-fit border-primary/30 text-primary"
          >
            Passwordless
          </Badge>
          <CardTitle className="text-3xl">Manage your climb</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Use the same verified email entered at checkout. No password to
            remember.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm nextPath={nextPath} />
        </CardContent>
      </Card>
    </div>
  );
}
