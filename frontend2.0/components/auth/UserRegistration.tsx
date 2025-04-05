"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import axios from "axios";

export default function UserRegistration() {
  const { isLoaded, userId, isSignedIn } = useAuth();
  const { user } = useUser();
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only run this effect when the user is signed in and loaded
    if (!isLoaded || !isSignedIn || !user || registered) return;

    const registerUser = async () => {
      try {
        // Get the API URL from environment variables with fallback
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        console.log("Registering user with API URL:", apiUrl);
        
        // Prepare user data
        const userData = {
          id: user.id,
          email_address: user.primaryEmailAddress?.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName
        };
        
        console.log("Sending user data to backend:", userData);
        
        // Send user data to our backend
        const response = await axios.post(`${apiUrl}/api/users/create`, userData);
        
        console.log("User registration response:", response.data);
        
        if (response.data.status === "success") {
          setRegistered(true);
          console.log("User successfully registered in database");
        }
      } catch (err) {
        console.error("Error registering user:", err);
        setError("Failed to register user");
      }
    };

    registerUser();
  }, [isLoaded, isSignedIn, user, registered]);

  // This component doesn't render anything visible
  return null;
}
