import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User, Lock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PasswordStrengthBar } from '@/components/ui/PasswordStrengthBar';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useProfile, useUpdateProfile, useChangeOwnPassword, useUploadAvatar } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/auth.store';

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  email: z.string().email('Email inválido').max(200),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requerido'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Requerido'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type Tab = 'info' | 'password';

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storeUser = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangeOwnPassword();
  const uploadAvatar = useUploadAvatar();
  const displayName = profile?.name ?? storeUser?.name ?? '?';
  const displayAvatarUrl = profile?.avatarUrl ?? storeUser?.avatarUrl;

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile ? { name: profile.name, email: profile.email } : undefined,
  });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const newPasswordValue = watchPassword('newPassword') ?? '';


  const onProfileSubmit = (data: ProfileForm) => {
    setProfileSuccess(false);
    updateProfile.mutate(data, {
      onSuccess: () => {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      },
    });
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    setPasswordSuccess(false);
    changePassword.mutate(data, {
      onSuccess: () => {
        setPasswordSuccess(true);
        resetPassword();
        setTimeout(() => setPasswordSuccess(false), 3000);
      },
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      {/* Avatar card */}
      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <div className="relative">
            <UserAvatar
              name={displayName}
              avatarUrl={displayAvatarUrl}
              size="xl"
              className="ring-4 ring-blue-100"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-50"
              title="Cambiar foto"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1">
            <p className="text-xl font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">{profile?.email ?? storeUser?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={profile?.role === 'ADMIN' ? 'default' : 'secondary'}>
                {profile?.role ?? storeUser?.role}
              </Badge>
              {profile?.tenant && (
                <span className="text-xs text-muted-foreground">{profile.tenant.name}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
        <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={User}>
          Información
        </TabButton>
        <TabButton active={activeTab === 'password'} onClick={() => setActiveTab('password')} icon={Lock}>
          Contraseña
        </TabButton>
      </div>

      {/* Info tab */}
      {activeTab === 'info' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Datos personales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" {...regProfile('name')} />
                {profileErrors.name && (
                  <p className="text-xs text-destructive">{profileErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" {...regProfile('email')} />
                {profileErrors.email && (
                  <p className="text-xs text-destructive">{profileErrors.email.message}</p>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                {profileSuccess && (
                  <p className="flex items-center gap-1 text-sm text-green-600">
                    <ShieldCheck className="h-4 w-4" />
                    Perfil actualizado
                  </p>
                )}
                {updateProfile.isError && (
                  <p className="text-sm text-destructive">
                    {(updateProfile.error as Error)?.message ?? 'Error al guardar'}
                  </p>
                )}
                {!profileSuccess && !updateProfile.isError && <span />}
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password tab */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" />
              Cambiar contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <Input id="currentPassword" type="password" {...regPassword('currentPassword')} />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input id="newPassword" type="password" {...regPassword('newPassword')} />
                <PasswordStrengthBar password={newPasswordValue} />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input id="confirmPassword" type="password" {...regPassword('confirmPassword')} />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                {passwordSuccess && (
                  <p className="flex items-center gap-1 text-sm text-green-600">
                    <ShieldCheck className="h-4 w-4" />
                    Contraseña actualizada
                  </p>
                )}
                {changePassword.isError && (
                  <p className="text-sm text-destructive">
                    {(changePassword.error as Error)?.message ?? 'Error al cambiar contraseña'}
                  </p>
                )}
                {!passwordSuccess && !changePassword.isError && <span />}
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? 'Actualizando...' : 'Cambiar contraseña'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}

function TabButton({ active, onClick, icon: Icon, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}
