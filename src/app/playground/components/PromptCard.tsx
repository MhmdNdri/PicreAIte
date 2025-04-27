import Link from "next/link";
import Image from "next/image";

interface PromptCardProps {
  name: string;
  type: string;
  imageUrl: string;
}

export function PromptCard({ name, type, imageUrl }: PromptCardProps) {
  return (
    <Link
      href={`/playground/${name}`}
      className="group relative overflow-hidden rounded-lg bg-white/80 dark:bg-[#1A1E33]/80 backdrop-blur-md border border-gray-200/10 dark:border-gray-700/10 shadow-lg dark:shadow-none transition-all hover:shadow-xl dark:hover:shadow-none hover:scale-[1.02]"
    >
      <div className="relative aspect-square w-full">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-semibold line-clamp-1">{name}</h3>
          <p className="text-sm text-white/80 line-clamp-1">{type}</p>
        </div>
      </div>
    </Link>
  );
}
