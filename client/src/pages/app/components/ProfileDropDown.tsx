import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authApi } from "@/lib/axios";
import { useFullApp } from "@/store/hooks/useFullApp";
import { User2 } from "lucide-react";
import { Link } from "react-router-dom";

function ProfileDropDown() {
  const logout = async () => {
    await authApi.post("/logout");
    window.location.reload();
  };
  const { user } = useFullApp();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <User2 />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 dark:bg-gray-950  dark:text-white"
        align="start"
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          {user && user.role === "admin" && (
            <Link className="cursor-pointer" to={"/admin-dashboard"}>
              <DropdownMenuItem className="cursor-pointer">
                Admin Dashboard
              </DropdownMenuItem>
            </Link>
          )}
          <Link className="cursor-pointer" to={"/about-us"}>
            <DropdownMenuItem className="cursor-pointer">
              How It Works
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileDropDown;
