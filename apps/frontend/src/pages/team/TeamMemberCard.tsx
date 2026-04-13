import { Pencil, UserX, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDeactivateUser } from '@/hooks/useTeam';
import type { TenantUser } from '@/types';

// ─── Component ────────────────────────────────────────────────────────────────

interface TeamMemberCardProps {
  member: TenantUser;
  currentUserId: string;
  onEdit: (member: TenantUser) => void;
}

export function TeamMemberCard({ member, currentUserId, onEdit }: TeamMemberCardProps) {
  const deactivate = useDeactivateUser();
  const isSelf = member.id === currentUserId;
  const activeLeads = member._count?.assignedLeads ?? 0;

  return (
    <Card className={`transition-opacity ${!member.isActive ? 'opacity-60' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <UserAvatar name={member.name} avatarUrl={member.avatarUrl} size="md" />

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{member.name}</p>
            <p className="truncate text-sm text-gray-500">{member.email}</p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Role badge */}
              <Badge
                variant="outline"
                className={
                  member.role === 'ADMIN'
                    ? 'border-violet-200 bg-violet-50 text-violet-700'
                    : 'border-blue-200 bg-blue-50 text-blue-700'
                }
              >
                {member.role === 'ADMIN' ? 'Admin' : 'Vendedor'}
              </Badge>

              {/* Status badge */}
              <Badge
                variant="outline"
                className={
                  member.isActive
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-gray-100 text-gray-500'
                }
              >
                {member.isActive ? 'Activo' : 'Inactivo'}
              </Badge>

              {/* Lead count */}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {activeLeads} leads
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(member)}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {member.isActive && !isSelf && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Desactivar"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Desactivar a {member.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El usuario no podrá iniciar sesión. Sus leads activos quedarán sin
                      asignar. Esta acción puede revertirse editando el usuario.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => deactivate.mutate(member.id)}
                    >
                      Desactivar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
