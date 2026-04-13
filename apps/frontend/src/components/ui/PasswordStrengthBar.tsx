interface Props {
  password: string;
}

function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: 'Débil', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Regular', color: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Buena', color: 'bg-yellow-400' };
  return { score, label: 'Fuerte', color: 'bg-green-500' };
}

export function PasswordStrengthBar({ password }: Props) {
  const { score, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-1 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? color : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
