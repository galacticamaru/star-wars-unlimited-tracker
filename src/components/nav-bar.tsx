'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

const NAV_LINKS = [
  { href: '/', label: 'Catalog' },
  { href: '/collection', label: 'Collection' },
  { href: '/decks', label: 'Decks' },
];

export function NavBar() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div
      className={cn(
        'sticky top-0 z-50 h-14 flex items-center',
        'px-4 md:px-8',
        'bg-background/80 backdrop-blur-sm border-b border-border',
      )}
    >
      <span className="font-heading font-semibold text-base text-foreground mr-auto">
        SWU Tracker
      </span>
      <nav className="flex items-center gap-2">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'h-11 flex items-center px-4 text-sm transition-colors duration-150',
              isActive(href)
                ? 'text-foreground font-semibold border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </Link>
        ))}

        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border">
          {isPending ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  {session.user.image ? (
                    <img src={session.user.image} alt={session.user.name} className="h-full w-full rounded-full" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2 border-b border-border">
                  <p className="text-sm font-medium leading-none">{session.user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuItem 
                  onClick={() => authClient.signOut()} 
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
