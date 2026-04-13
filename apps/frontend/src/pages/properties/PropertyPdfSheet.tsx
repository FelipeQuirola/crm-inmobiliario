import { useState } from 'react';
import { FileDown, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useActiveUsers } from '@/hooks/useTeam';
import { useAuthStore } from '@/store/auth.store';
import { propertiesService } from '@/services/properties.service';

const NONE = 'none';

interface PropertyPdfSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  propertyId: string;
  propertyTitle: string;
}

export function PropertyPdfSheet({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
}: PropertyPdfSheetProps) {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN';

  // Accessible to both ADMIN and VENDEDOR — uses the /users/active endpoint
  const { data: activeUsers = [] } = useActiveUsers();

  // VENDEDOR is always pre-selected as themselves; ADMIN starts at "none"
  const [agentId, setAgentId] = useState<string>(isAdmin ? NONE : (currentUser?.id ?? NONE));
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const selectedAgent = agentId !== NONE ? agentId : undefined;
      const blob = await propertiesService.downloadPdf(propertyId, selectedAgent);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ficha-${propertyTitle.replace(/\s+/g, '-')}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Ficha técnica descargada');
      onOpenChange(false);
    } catch {
      toast.error('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-[#006031]" />
            Generar ficha técnica
          </SheetTitle>
          <SheetDescription>
            Descarga la ficha profesional en PDF para compartir con clientes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Property name preview */}
          <div className="rounded-xl border bg-gradient-to-br from-[#006031]/5 to-[#23103B]/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Propiedad
            </p>
            <p className="mt-0.5 font-semibold text-gray-900">{propertyTitle}</p>
          </div>

          {/* Agent section */}
          <div className="space-y-2">
            <Label htmlFor="agent-select">
              Asesor en la ficha{' '}
              {isAdmin && (
                <span className="font-normal text-muted-foreground">(opcional)</span>
              )}
            </Label>

            {isAdmin ? (
              /* ADMIN: full selector */
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger id="agent-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>
                    Sin asesor — solo datos de HomeMatch
                  </SelectItem>
                  {activeUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.role === 'ADMIN' ? 'Admin' : 'Vendedor'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              /* VENDEDOR: read-only badge with their own name */
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006031]/10">
                  <User className="h-3.5 w-3.5 text-[#006031]" />
                </div>
                <span className="text-sm font-medium text-gray-900">{currentUser?.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">Tú</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? 'El nombre y correo del asesor aparecerán en la ficha.'
                : 'Tu información aparecerá como asesor en la ficha.'}
            </p>
          </div>

          {/* What's included */}
          <div className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-gray-700">La ficha incluye:</p>
            <ul className="space-y-0.5 pl-3">
              <li>· Foto principal y galería</li>
              <li>· Precio, área y características</li>
              <li>· Descripción completa</li>
              <li>· Mapa de ubicación</li>
              <li>· Código QR con enlace al sitio web</li>
              <li>· Datos del asesor seleccionado</li>
            </ul>
          </div>

          {/* Download button */}
          <Button
            className="w-full bg-[#006031] hover:bg-[#004d26] text-white"
            onClick={() => void handleDownload()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando PDF…
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Generar y descargar PDF
              </>
            )}
          </Button>
          {loading && (
            <p className="text-center text-xs text-muted-foreground">
              Este proceso puede tomar 10–20 segundos. Por favor espera.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
