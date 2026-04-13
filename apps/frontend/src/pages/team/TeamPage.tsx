import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TeamMemberCard } from './TeamMemberCard';
import { CreateUserSheet } from './CreateUserSheet';
import { EditUserSheet } from './EditUserSheet';
import { useTeamMembers } from '@/hooks/useTeam';
import { useAuthStore } from '@/store/auth.store';
import type { TenantUser } from '@/types';

function TeamSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function TeamPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: members, isLoading } = useTeamMembers();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TenantUser | null>(null);

  // Guard: VENDEDOR is redirected
  if (user?.role !== 'ADMIN') {
    toast.error('Sin permisos para acceder a esta sección');
    void navigate('/dashboard');
    return null;
  }

  const activeCount = members?.filter((m) => m.isActive).length ?? 0;
  const totalCount = members?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
          <p className="text-sm text-gray-500">
            {activeCount} activos · {totalCount} total
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar vendedor
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <TeamSkeleton />
      ) : members?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay usuarios en el equipo.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members?.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              currentUserId={user.id}
              onEdit={(m) => setEditTarget(m)}
            />
          ))}
        </div>
      )}

      <CreateUserSheet open={createOpen} onOpenChange={setCreateOpen} />

      <EditUserSheet
        member={editTarget}
        currentUserId={user.id}
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
      />
    </div>
  );
}
