import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <MailCheck className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">Account Pending Approval</CardTitle>
          <CardDescription className="text-lg">
            Thank you for signing up! Your account is currently under review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You will receive an email notification once your account has been approved by an administrator. This usually takes 1-2 business days. If you have any questions, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
