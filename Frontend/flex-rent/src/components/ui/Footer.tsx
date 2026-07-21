import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

const GithubIcon = ({ size = 24, ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.4a5.8 5.8 0 0 0-1.5-4 5.3 5.3 0 0 0-.1-4s-1.1-.3-3.5 1.3a11.5 11.5 0 0 0-6 0C5.3 5.3 4.2 5.6 4.2 5.6a5.3 5.3 0 0 0-.1 4A5.8 5.8 0 0 0 2.6 13.4c0 3.4 3 5.4 6 5.4a4.8 4.8 0 0 0-1 3.2v4" /></svg>
);

const TwitterIcon = ({ size = 24, ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
);

const InstagramIcon = ({ size = 24, ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-surface px-6 pt-16 pb-8 overflow-hidden mt-auto">
      {/* Background glow for aesthetic */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[800px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-surface transition-transform group-hover:scale-105 group-hover:rotate-3 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                <Zap size={20} className="fill-surface" />
              </div>
              <span className="font-display text-2xl font-bold tracking-tight text-text">
                flexrent
              </span>
            </Link>
            <p className="max-w-sm text-chalk text-sm leading-relaxed">
              The premier marketplace to rent tools, vehicles, and equipment from trusted local providers. 
              Borrow what you need, earn from what you don't.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" aria-label="Twitter" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-chalk transition-all hover:border-accent/50 hover:text-accent hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <TwitterIcon size={18} />
              </a>
              <a href="#" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-chalk transition-all hover:border-accent/50 hover:text-accent hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <InstagramIcon size={18} />
              </a>
              <a href="#" aria-label="Github" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-chalk transition-all hover:border-accent/50 hover:text-accent hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <GithubIcon size={18} />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-display font-semibold text-text text-lg">Platform</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/browse" className="text-chalk text-sm transition-colors hover:text-accent">Browse Rentals</Link></li>
              <li><Link href="/vendor-signup" className="text-chalk text-sm transition-colors hover:text-accent">List Equipment</Link></li>
              <li><Link href="/pricing" className="text-chalk text-sm transition-colors hover:text-accent">Pricing</Link></li>
              <li><Link href="/locations" className="text-chalk text-sm transition-colors hover:text-accent">Locations</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-display font-semibold text-text text-lg">Company</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/about" className="text-chalk text-sm transition-colors hover:text-accent">About Us</Link></li>
              <li><Link href="/careers" className="text-chalk text-sm transition-colors hover:text-accent">Careers</Link></li>
              <li><Link href="/blog" className="text-chalk text-sm transition-colors hover:text-accent">Blog</Link></li>
              <li><Link href="/contact" className="text-chalk text-sm transition-colors hover:text-accent">Contact</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-display font-semibold text-text text-lg">Stay Updated</h3>
            <p className="text-chalk text-sm">Join our newsletter for the latest deals and updates.</p>
            <div className="mt-2 flex items-center rounded-lg border border-border bg-surface-raised p-1 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-chalk/60"
              />
              <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-surface transition-transform hover:scale-105">
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>

        <div className="flex flex-col md:flex-row items-center justify-between border-t border-border pt-8 gap-4">
          <p className="font-mono text-xs text-chalk">
            © {new Date().getFullYear()} flexrent. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="font-mono text-xs text-chalk transition-colors hover:text-text">Privacy Policy</Link>
            <Link href="/terms" className="font-mono text-xs text-chalk transition-colors hover:text-text">Terms of Service</Link>
            <Link href="/cookies" className="font-mono text-xs text-chalk transition-colors hover:text-text">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
