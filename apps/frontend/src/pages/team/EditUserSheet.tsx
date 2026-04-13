import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, Loader2 } from 'lucide-react';
import axios from 'axios';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUpdateUser, useChangePassword } from '@/hooks/useTeam';
import type { TenantUser } from '@/types';

// ─── Edit schema ──────────────────────────────────────────────────────────────

const editSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'VENDEDOR']),
  isActive: z.boolean(),
});

const pwSchema = z.object({
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string().min(8),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});

type EditValues = z.infer<typeof editSchema>;
type PwValues = z.infer<typeof pwSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface EditUserSheetProps {
  member: TenantUser | null;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserSheet({
  member,
  currentUserId,
  open,
  onOpenChange,
}: EditUserSheetProps) {
  const updateUser = useUpdateUser();
  const changePassword = useChangePassword();
  const [showPassword, setShowPassword] = useState(false);
  const isSelf = member?.id === currentUserId;

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'VENDEDOR',
      isActive: true,
    },
  });

  const pwForm = useForm<PwValues>({
    resolver: zodResolver(pwSchema),
    defaultValues: { newPassword: '', confirm: '' },
  });

  // Sync form when member changes
  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email,
        role: member.role,
        isActive: member.isActive,
      });
    }
  }, [member, form]);

  const handleClose = () => {
    setShowPassword(false);
    pwForm.reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: EditValues) => {
    if (!member) return;
    try {
      await updateUser.mutateAsync({ id: member.id, data: values });
      handleClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        form.setError('email', { message: 'Este email ya está en uso' });
      } else if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string | string[] })?.message;
        const text = Array.isArray(msg) ? msg[0] : (msg ?? 'Error al actualizar');
        form.setError('root', { message: text });
      }
    }
  };

  const onPasswordSubmit = async (values: PwValues) => {
    if (!member) return;
    try {
      await changePassword.mutateAsync({ id: member.id, newPassword: values.newPassword });
      setShowPassword(false);
      pwForm.reset();
    } catch {
      // error toast handled in hook
    }
  };

  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar usuario</SheetTitle>
          <SheetDescription>Modifica los datos de {member.name}.</SheetDescription>
        </SheetHeader>

        {form.formState.errors.root && (
          <p className="mx-6 text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}

        <Form {...form}>
          <form
            id="edit-user-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 space-y-4 px-6 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSelf}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf && (
                    <p className="text-xs text-muted-foreground">No puedes cambiar tu propio rol</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'true')}
                    value={String(field.value)}
                    disabled={isSelf}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf && (
                    <p className="text-xs text-muted-foreground">No puedes desactivarte a ti mismo</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Change password toggle ─────────────────────────── */}
            <div className="border-t pt-4">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setShowPassword((v) => !v)}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showPassword ? 'rotate-180' : ''}`}
                />
                Cambiar contraseña
              </button>

              {showPassword && (
                <Form {...pwForm}>
                  <form
                    id="pw-form"
                    onSubmit={pwForm.handleSubmit(onPasswordSubmit)}
                    className="mt-3 space-y-3"
                  >
                    <FormField
                      control={pwForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nueva contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pwForm.control}
                      name="confirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      form="pw-form"
                      size="sm"
                      variant="outline"
                      disabled={changePassword.isPending}
                    >
                      {changePassword.isPending ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Guardar contraseña
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </form>
        </Form>

        <SheetFooter>
          <Button variant="outline" onClick={handleClose} disabled={updateUser.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="edit-user-form" disabled={updateUser.isPending}>
            {updateUser.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
