"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import UserRegistration from "./UserRegistration";

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Updated public paths to include catch-all routes
const publicPaths = [
    "/", 
    "/sign-in", 
    "/sign-up", 
    "/about", 
    "/contact", 
    "/pricing",
    "../../app/profile/[[...profile]].page", // Use /profile/ prefix before the catch-all
    "/sign-in/[[...sign-in]]",
    "/sign-up/[[...sign-up]]"
];

const clerkPatterns = [
    /^\/sign-in(\/.*)?$/,
    /^\/sign-up(\/.*)?$/,
    /^\/(profile|profile\/.*)?$/, // Updated to match profile routes
  ];

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isLoaded, userId, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Check if the current path is public or a Clerk path
    const isPublicPath = 
      publicPaths.some(path => pathname === path) || 
      pathname.startsWith("/api/") ||
      clerkPatterns.some(pattern => pattern.test(pathname));

    if (!isSignedIn && !isPublicPath) {
      router.push("/sign-in?redirect_url=" + encodeURIComponent(pathname));
    } else {
      setIsAuthorized(true);
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  // Updated condition to check for Clerk paths as well
  if (!isLoaded || (isLoaded && !isSignedIn && 
      !publicPaths.some(path => pathname === path) && 
      !clerkPatterns.some(pattern => pattern.test(pathname)))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Authenticating...</span>
      </div>
    );
  }

  return (
    <>
      {/* Include UserRegistration component to handle database registration */}
      {isSignedIn && <UserRegistration />}
      {children}
    </>
  );
}