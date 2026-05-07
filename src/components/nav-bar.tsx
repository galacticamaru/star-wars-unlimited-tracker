'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Catalog' },
  { href: '/collection', label: 'Collection' },
  { href: '/decks', label: 'Decks' },
];

export function NavBar() {
  const pathname = usePathname();

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
      </nav>
    </div>
  );
}
