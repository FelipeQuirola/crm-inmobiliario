import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
import { useCreateUser } from '@/hooks/useTeam';

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'VENDEDOR']),
});

type FormValues = z.infer<typeof schema>;

interface CreateUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserSheet({ open, onOpenChange }: CreateUserSheetProps) {
  const createUser = useCreateUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', role: 'VENDEDOR' },
  });

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await createUser.mutateAsync(values);
      handleClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        form.setError('email', { message: 'Este email ya está en uso en el tenant' });
      } else if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string | string[] })?.message;
        const text = Array.isArray(msg) ? msg[0] : (msg ?? 'Error al crear usuario');
        form.setError('root', { message: text });
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Agregar vendedor</SheetTitle>
          <SheetDescription>Crea una cuenta para un nuevo miembro del equipo.</SheetDescription>
        </SheetHeader>

        {form.formState.errors.root && (
          <p className="mx-6 text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}

        <Form {...form}>
          <form
            id="create-user-form"
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
                    <Input placeholder="Carlos Ramírez" {...field} />
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
                    <Input placeholder="carlos@empresa.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mínimo 8 caracteres" type="password" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <Button variant="outline" onClick={handleClose} disabled={createUser.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="create-user-form" disabled={createUser.isPending}>
            {createUser.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando…
              </>
            ) : (
              'Crear usuario'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
