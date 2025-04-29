
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const [open, setOpen] = useState(false);
  
  const navItems = [
    { title: "Home", href: "/" },
    { title: "Play", href: "/game" },
    { title: "About", href: "/about" },
  ];

  return (
    <div className="w-full">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border/10">
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold elegant-text-primary">PONG</span>
          <span className="text-2xl font-bold elegant-text-secondary"> ARCADE</span>
        </Link>
        
        <NavigationMenu>
          <NavigationMenuList className="gap-2">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.title}>
                <Link to={item.href}>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-border/10">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold elegant-text-primary">PONG</span>
          <span className="text-xl font-bold elegant-text-secondary"> ARCADE</span>
        </Link>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                <span className="elegant-text-primary">PONG</span>
                <span className="elegant-text-secondary"> ARCADE</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link 
                  key={item.title} 
                  to={item.href} 
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
