import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Calendar,
  Building2,
  BarChart3,
  UserCog,
  FileText,
  Bell,
  Plug2,
  Settings2,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard, adminOnly: false },
  { to: '/leads',           label: 'Leads',           icon: Users,           adminOnly: false },
  { to: '/pipeline',        label: 'Pipeline',        icon: Kanban,          adminOnly: false },
  { to: '/calendario',      label: 'Calendario',      icon: Calendar,        adminOnly: false },
  { to: '/propiedades',     label: 'Propiedades',     icon: Building2,       adminOnly: false },
  { to: '/reportes',        label: 'Reportes',        icon: BarChart3,       adminOnly: false },
  { to: '/notificaciones',  label: 'Notificaciones',  icon: Bell,            adminOnly: false },
  { to: '/team',            label: 'Equipo',          icon: UserCog,         adminOnly: true  },
  { to: '/plantillas',      label: 'Plantillas',      icon: FileText,        adminOnly: true  },
  { to: '/integraciones',   label: 'Integraciones',   icon: Plug2,           adminOnly: true  },
  { to: '/settings/funnel', label: 'Config. Embudo',  icon: Settings2,       adminOnly: true  },
] as const;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const role = useAuthStore((s) => s.user?.role);

  return (
    <>
      {/* Mobile overlay — sits behind the sidebar, closes it on click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0f172a]',
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-white">CRM Inmobiliario</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.filter((item) => !item.adminOnly || role === 'ADMIN').map(
            ({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </NavLink>
            ),
          )}
        </nav>

        {/* Profile link + footer */}
        <div className="border-t border-white/10 px-3 py-3">
          <NavLink
            to="/perfil"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <UserCircle className="h-4 w-4 flex-shrink-0" />
            Mi perfil
          </NavLink>
          <p className="mt-2 px-3 text-xs text-slate-500">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
