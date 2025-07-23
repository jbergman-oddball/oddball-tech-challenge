
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, limit, writeBatch } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { sendPendingApprovalEmail, sendNewUserAdminNotification } from "@/lib/email";

const SignupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof SignupFormSchema>>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SignupFormSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: values.name });
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, limit(1));
      const querySnapshot = await getDocs(q);
      const isFirstUser = querySnapshot.empty;

      const userRole = isFirstUser ? 'admin' : 'pending';
      const userStatus = isFirstUser ? 'active' : 'pending-approval';
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      if (!adminEmail) {
        console.error("Admin email is not configured. Cannot send admin notification.");
      }

      const userDocRef = doc(db, "users", user.uid);
      
      try {
        await setDoc(userDocRef, {
            uid: user.uid,
            name: values.name,
            email: values.email,
            role: userRole,
            status: userStatus,
            createdAt: new Date(),
        });

        // Send emails
        if (!isFirstUser) {
          await sendPendingApprovalEmail(values.email, values.name);
          if (adminEmail) {
            await sendNewUserAdminNotification(adminEmail, values.name, values.email);
          }
        }

      } catch (dbError: any) {
          // If Firestore write fails, we should ideally delete the auth user
          // to allow them to try signing up again.
          await user.delete();
          console.error("Firestore write failed:", dbError);
          toast({
              variant: "destructive",
              title: "Signup Failed",
              description: "Could not save user data. This might be due to security rules. Please contact an admin.",
          });
          setIsLoading(false);
          return;
      }

      if (isFirstUser) {
        toast({
          title: "Admin Account Created",
          description: "Welcome! As the first user, you are now an administrator.",
        });
        router.push("/dashboard");
      } else {
         toast({
          title: "Signup Successful",
          description: "Your account has been created. Please wait for admin approval.",
        });
        router.push("/pending-approval");
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.code === 'auth/email-already-in-use' 
            ? "This email is already in use. Please try another one or log in."
            : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>
            Create an account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} autoComplete="name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} autoComplete="email"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
