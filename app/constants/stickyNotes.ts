export type StickyNoteColor = 'yellow' | 'pink' | 'orange' | 'green' | 'purple';

export interface StickyNote {
  id: string;
  text: string;
  color: StickyNoteColor;
  createdAt: string;
}

export const STICKY_NOTE_COLORS: Record<
  StickyNoteColor,
  { label: string; bg: string; text: string; border: string }
> = {
  yellow: {
    label: 'Yellow',
    bg: 'bg-[#FEF08A]',
    text: 'text-[#713F12]',
    border: 'border-[#FACC15]',
  },
  pink: {
    label: 'Pink',
    bg: 'bg-[#FBCFE8]',
    text: 'text-[#831843]',
    border: 'border-[#F472B6]',
  },
  orange: {
    label: 'Orange',
    bg: 'bg-[#FED7AA]',
    text: 'text-[#7C2D12]',
    border: 'border-[#FB923C]',
  },
  green: {
    label: 'Green',
    bg: 'bg-[#D9F99D]',
    text: 'text-[#3F6212]',
    border: 'border-[#84CC16]',
  },
  purple: {
    label: 'Purple',
    bg: 'bg-[#E9D5FF]',
    text: 'text-[#581C87]',
    border: 'border-[#C084FC]',
  },
};

