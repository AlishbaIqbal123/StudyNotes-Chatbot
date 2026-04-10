import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, User as UserIcon, LayoutDashboard, Settings as SettingsIcon, LogOut, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const NavLinks = ({ mobile = false }) => (
    <>
      <Link href="/dashboard">
        <Button variant={location === "/dashboard" ? "secondary" : "ghost"} size={mobile ? "default" : "sm"} className={`w-full justify-start ${location === "/dashboard" ? "bg-primary/10 text-primary" : ""}`}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/library">
        <Button variant={location === "/library" ? "secondary" : "ghost"} size={mobile ? "default" : "sm"} className={`w-full justify-start ${location === "/library" ? "bg-primary/10 text-primary" : ""}`}>
          <BookOpen className="mr-2 h-4 w-4" />
          Library
        </Button>
      </Link>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex md:flex-1">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-primary to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
                Aura
              </span>
            </Link>
          </div>
          
          <div className="flex flex-1 items-center justify-end space-x-4">
            {user ? (
              <>
                <nav className="hidden md:flex items-center space-x-2">
                  <NavLinks />
                </nav>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all p-0">
                        <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-medium">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64" align="end" forceMount>
                      <div className="flex items-center justify-start gap-3 p-3">
                        <div className="flex flex-col space-y-1">
                          <p className="font-semibold text-sm leading-none">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate w-[180px]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="p-3 cursor-pointer">
                        <Link href="/profile" className="flex items-center">
                          <UserIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-3 cursor-pointer">
                        <Link href="/settings" className="flex items-center">
                          <SettingsIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="p-3 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                        <LogOut className="mr-3 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Mobile Menu */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-6 w-6" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                      <div className="flex flex-col gap-6 py-6">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-primary to-purple-600 p-2 rounded-xl text-white">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <span className="font-bold text-xl tracking-tight">Aura</span>
                        </div>
                        <nav className="flex flex-col space-y-2">
                          <NavLinks mobile />
                        </nav>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <nav className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="rounded-full shadow-md shadow-primary/20">
                    Sign up
                  </Button>
                </Link>
              </nav>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
