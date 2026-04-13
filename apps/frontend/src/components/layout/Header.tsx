import { useState, useEffect } from 'react';
import { Menu, LogOut, UserCircle, ChevronDown, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';

// PWA install prompt event type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface HeaderProps {
  onMenuClick: () => void;
}

const PWA_BANNER_KEY = 'pwa_banner_dismissed';

export function Header({ onMenuClick }: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(PWA_BANNER_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem(PWA_BANNER_KEY, '1');
  };

  return (
    <>
      {/* PWA install banner */}
      {showInstallBanner && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-[#006031] px-4 py-2 text-white lg:left-64">
          <p className="text-sm font-medium">Instala HomeMatch CRM en tu dispositivo</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="h-7 bg-white text-[#006031] hover:bg-white/90 text-xs px-3"
              onClick={() => void handleInstall()}
            >
              <Download className="mr-1 h-3 w-3" />
              Instalar
            </Button>
            <button
              onClick={dismissBanner}
              className="rounded p-0.5 hover:bg-white/20 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <header
        className={`fixed inset-x-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm lg:left-64 lg:px-6 ${showInstallBanner ? 'top-9' : 'top-0'}`}
      >
        {/* Hamburger — mobile/tablet only */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          title="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Hidden spacer on desktop */}
        <div className="hidden lg:block" />

        <div className="flex items-center gap-3">
          <NotificationPopover />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors outline-none">
                  <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 leading-none">{user.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-50"
              >
                <DropdownMenuLabel className="flex items-center gap-2 font-normal">
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                    {user.role}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/perfil')}
                  className="cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile logout (no dropdown on small screens) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            title="Cerrar sesión"
            className="sm:hidden"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
    </>
  );
}
