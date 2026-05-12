import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 bg-gradient-to-b from-background via-background to-muted">
      <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground max-w-3xl leading-tight">
        Star Wars Unlimited Card Database and Deck Builder
      </h1>
      <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl">
        Track your collection, build your decks, and begin trading with up to date market prices
      </p>
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <Link href="/collection" className={cn(buttonVariants({ size: 'lg' }))}>
          Import Collection
        </Link>
        <Link href="/decks" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
          Build a Deck
        </Link>
        <Link href="/binder/manage" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
          Trade
        </Link>
      </div>
    </section>
  );
}
