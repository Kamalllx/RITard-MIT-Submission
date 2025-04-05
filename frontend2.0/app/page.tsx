"use client";
import Header from "@/components/header"
import Hero from "@/components/hero"
import Features from "@/components/features"
import Stats from "@/components/stats"
import Solutions from "@/components/solutions"
import Testimonials from "@/components/testimonials"
import Security from "@/components/security"
import Faq from "@/components/faq"
import Cta from "@/components/cta"
import Footer from "@/components/footer"
import RevealAnimations from "@/components/reveal-animations"

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function Home() {
  // Use state to track authentication status
  const [isUserSignedIn, setIsUserSignedIn] = useState(false);
  const { isSignedIn } = useAuth();
  
  // Move the auth check to useEffect
  useEffect(() => {
    if (isSignedIn !== undefined) {
      setIsUserSignedIn(isSignedIn);
    }
  }, [isSignedIn]);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-cover bg-center z-0" 
          style={{
            backgroundImage: `url('https://public.readdy.ai/ai/img_res/470badebee881d4ffaad0808f4ff4fab.jpg')`
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/70 z-10"></div>
        
        <div className="container mx-auto px-4 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block bg-blue-500/20 text-blue-300 border border-blue-400/20 px-4 py-1 rounded-full mb-6">
                  Your Financial AI Assistant
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Master Your <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  Finances
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-blue-100 mb-8 max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Personalized financial guidance powered by AI. Get insights, plan your future, and make smarter decisions with FinWise.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link href={isUserSignedIn ? "/dashboard" : "/sign-up"}>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300">
                    {isUserSignedIn ? "Go to Dashboard" : "Get Started Free"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                {!isUserSignedIn && (
                  <Link href="/sign-in">
                    <Button variant="outline" className="border-blue-300 text-blue-100 hover:bg-blue-800/20 px-8 py-6 text-lg rounded-full backdrop-blur-sm">
                      Sign In
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Header />
      <main id="main-content" className="flex-1 relative h-full">
        <Hero />
        <Features />
        <Stats />
        <Solutions />
        <Testimonials />
        <Security />
        <Faq />
        <Cta />
        <Footer />
      </main>
      <RevealAnimations />
    </div>
  );
}
