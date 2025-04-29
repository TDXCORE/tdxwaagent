import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Inbox, MessageSquare, Settings } from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ href, icon, label, isActive }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-white/20 text-white font-medium' 
          : 'text-white/70 hover:bg-white/10'
      }`}
    >
      <div className="w-5 h-5">{icon}</div>
      <span>{label}</span>
    </Link>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { href: '/inbox', icon: <Inbox size={20} />, label: 'Inbox' },
    { href: '/chat-ai', icon: <MessageSquare size={20} />, label: 'Chat AI' },
    { href: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black/10 backdrop-blur-md border-r border-white/10 p-4 flex flex-col">
        <div className="mb-8 px-4 py-2">
          <h1 className="text-white text-xl font-bold">TDX WhatsApp</h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="px-4 py-2 text-white/50 text-sm">
            <p>© 2025 TDX WhatsApp Agent</p>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div 
          className="min-h-screen"
          style={{
            background: 'linear-gradient(90deg, rgba(5, 185, 250, 1) 0%, rgba(1, 210, 243, 1) 51%, rgba(0, 214, 242, 1) 58%, rgba(0, 255, 217, 1) 100%)'
          }}
        >
          <div className="container mx-auto p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}