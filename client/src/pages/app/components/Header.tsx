import { Button } from "@/components/ui/button";
import { useFullApp } from "@/store/hooks/useFullApp";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggler";
import ProfileDropDown from "./ProfileDropDown";

export default function Header() {
  const { user } = useFullApp();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-[#0a0a0a] dark:border-neutral-800 dark:supports-[backdrop-filter]:bg-[#0a0a0a] transition-colors duration-300">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-primary dark:text-white" />
          <span className="text-xl font-bold text-foreground dark:text-white">
            Starter Kit
          </span>
        </Link>

        {/* Right-side Section */}
        <div className="flex items-center space-x-3">
          {user ? (
            <ProfileDropDown />
          ) : (
            <>
              <Link to="/authenticate">
                <Button
                  variant="ghost"
                  size="sm"
                  className=" dark:text-gray-200 hover:text-white hover:bg-green-500 "
                >
                  Login
                </Button>
              </Link>
              <Link to="/authenticate">
                <Button
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/80"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
