"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth, useUser, SignOutButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isUserSignedIn, setIsUserSignedIn] = useState(false)
  // Use any type for now to avoid TypeScript errors
  const [userData, setUserData] = useState<any>(null)
  
  const { isSignedIn } = useAuth()
  const { user } = useUser()

  // Handle authentication state safely
  useEffect(() => {
    if (isSignedIn !== undefined) {
      setIsUserSignedIn(isSignedIn)
    }
  }, [isSignedIn])
  
  // Handle user data safely
  useEffect(() => {
    if (user) {
      setUserData(user)
    }
  }, [user])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  const headerVariants = {
    initial: { y: -100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
      },
    },
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md" : "bg-transparent"
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            FinWise
          </Link>
          
          <div className="flex items-center space-x-4">
            {isUserSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <LayoutDashboard size={16} />
                    <span className="hidden md:inline">Dashboard</span>
                  </Button>
                </Link>
                
                {/* User Profile Button */}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 rounded-full border-2 border-blue-500",
                    }
                  }}
                />
                
                {/* Sign Out Button */}
                <SignOutButton>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut size={16} />
                    <span className="hidden md:inline">Sign Out</span>
                  </Button>
                </SignOutButton>
              </>
            ) : (
              <Link href="/sign-up">
                <Button variant="default" size="sm">Sign up</Button>
              </Link>
            )}
            
            <button
              className="md:hidden"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white dark:bg-gray-900 shadow-lg"
        >
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/" onClick={closeMenu} className="py-2 hover:text-blue-600">
                Home
              </Link>
              <Link href="/about" onClick={closeMenu} className="py-2 hover:text-blue-600">
                About
              </Link>
              <Link href="/pricing" onClick={closeMenu} className="py-2 hover:text-blue-600">
                Pricing
              </Link>
              <Link href="/contact" onClick={closeMenu} className="py-2 hover:text-blue-600">
                Contact
              </Link>
            </nav>
          </div>
        </motion.div>
      )}
    </header>
  )
}
