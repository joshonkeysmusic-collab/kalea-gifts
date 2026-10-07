import {
  Bath, Bean, BookOpen, Bookmark, Cake, Camera, Candy, ChefHat, Coffee, Cookie, Droplet, Droplets,
  Dumbbell, Feather, Flame, Flower, Flower2, Frame, Gem, Gift, Headphones, Heart, House, Lamp, Leaf,
  Mail, Map, Moon, Mountain, Music, Palette, PenTool, Plane, Ribbon, Scroll, ShoppingBag, Smartphone,
  Smile, Sofa, Sparkles, SprayCan, Sprout, Sun, Sunrise, Sunset, Wine, type LucideIcon,
} from 'lucide-react';

const ICONS = {
  bath: Bath, bean: Bean, book: BookOpen, bookmark: Bookmark, cake: Cake, camera: Camera, candy: Candy,
  chef: ChefHat, coffee: Coffee, cookie: Cookie, cup: Coffee, droplet: Droplet, droplets: Droplets,
  dumbbell: Dumbbell, feather: Feather, flame: Flame, flower: Flower, flower2: Flower2, frame: Frame,
  gem: Gem, gift: Gift, headphones: Headphones, heart: Heart, home: House, lamp: Lamp, leaf: Leaf,
  mail: Mail, map: Map, moon: Moon, mountain: Mountain, music: Music, palette: Palette, pen: PenTool,
  plane: Plane, ribbon: Ribbon, scroll: Scroll, bag: ShoppingBag, phone: Smartphone, smile: Smile,
  sofa: Sofa, sparkles: Sparkles, spray: SprayCan, sprout: Sprout, sun: Sun, sunrise: Sunrise,
  sunset: Sunset, wine: Wine,
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;

export function Icon({ name, size = 24, stroke = 1.5, className }: { name: string; size?: number; stroke?: number; className?: string }) {
  const C = ICONS[name as IconKey] ?? Gift;
  return <C size={size} strokeWidth={stroke} className={className} aria-hidden />;
}
