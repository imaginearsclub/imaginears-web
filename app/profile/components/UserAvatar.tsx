"use client";

import { useState } from "react";

interface UserAvatarProps {
  uuid: string | undefined;
  minecraftName: string | null;
  userName: string | null;
}

export function UserAvatar({ uuid, minecraftName, userName }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const fallbackAvatar = (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
      {userName?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );

  if (!uuid || !minecraftName || imageError) {
    return fallbackAvatar;
  }

  return (
    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500 dark:border-blue-400 shadow-lg">
      <img
        src={`https://crafatar.com/avatars/${uuid}?size=128&overlay=true`}
        alt={`${minecraftName}'s Minecraft Avatar`}
        className="w-full h-full"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

