import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ProfileAvatar({ name, avatarUrl, size = 'md', className = '' }: ProfileAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-16 w-16 text-lg',
    lg: 'h-24 w-24 text-2xl',
    xl: 'h-32 w-32 text-3xl',
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className} border-2 border-primary/20`}>
      <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {initials || <User className="w-1/2 h-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}
