import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

interface NavigationProps {
  showAuthButton?: boolean;
}

export default function Navigation({ showAuthButton = false }: NavigationProps) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    window.location.href = "/auth";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { href: "/discover", label: "Discover", icon: "fas fa-search" },
    { href: "/learn", label: "Learn", icon: "fas fa-graduation-cap" },
    { href: "/ai-interview", label: "AI Interview", icon: "fas fa-robot" },
  ];

  const authenticatedNavItems = [
    { href: "/", label: "Home", icon: "fas fa-home" },
    ...navItems,
    { href: "/dashboard", label: "Dashboard", icon: "fas fa-chart-line" },
  ];

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      handleLogin();
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="border-b border-border sticky top-0 z-50" style={{ backgroundColor: 'hsl(45 35% 93%)' }} data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3" data-testid="logo">
              <i className="fas fa-globe-americas text-2xl text-primary"></i>
              <span className="text-xl font-bold" style={{ color: 'hsl(30 60% 25%)' }}>LanguaLegacy</span>
            </Link>
          </div>
          
          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8">
              {(isAuthenticated ? authenticatedNavItems : navItems).map((item) => (
                <Link key={item.href} to={item.href}>
                  <span 
                    className={`nav-link cursor-pointer font-medium px-3 py-2 rounded-md transition-all duration-300 ${
                      isActive(item.href) ? 'active bg-primary/10' : 'hover:bg-primary/5'
                    }`}
                    style={{ 
                      color: isActive(item.href) ? 'hsl(30 60% 25%)' : 'hsl(30 60% 35%)',
                    }}
                    onClick={(e) => handleNavClick(item.href, e)}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* User Menu / Auth Button */}
          <div className="flex items-center justify-end space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu-trigger">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                      <AvatarFallback>
                        {user?.firstName?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {(user?.firstName || user?.username) && (
                        <p className="font-medium" data-testid="user-name">
                          {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}
                        </p>
                      )}
                      {user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground" data-testid="user-email">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link to="/dashboard">
                    <DropdownMenuItem data-testid="menu-dashboard">
                      <i className="fas fa-chart-line mr-2"></i>
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : showAuthButton ? (
              <Button 
                onClick={handleLogin} 
                data-testid="button-login"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Login
              </Button>
            ) : null}
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="mobile-menu-trigger">
                    <i className="fas fa-bars text-xl"></i>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    {(isAuthenticated ? authenticatedNavItems : navItems).map((item) => (
                      <Link key={item.href} to={item.href}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={(e) => {
                            setMobileMenuOpen(false);
                            handleNavClick(item.href, e);
                          }}
                          data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                        >
                          <i className={`${item.icon} mr-3`}></i>
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    {isAuthenticated && (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-destructive"
                        onClick={handleLogout}
                        data-testid="mobile-logout"
                      >
                        <i className="fas fa-sign-out-alt mr-3"></i>
                        Logout
                      </Button>
                    )}
                    {!isAuthenticated && (
                      <Button 
                        variant="default" 
                        className="w-full justify-start"
                        onClick={handleLogin}
                        data-testid="mobile-login"
                      >
                        <i className="fas fa-sign-in-alt mr-3"></i>
                        Sign In / Sign Up
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
