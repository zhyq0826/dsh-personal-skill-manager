declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ButtonHTMLAttributes, ComponentType, InputHTMLAttributes, ReactElement, ReactNode } from 'react';

  export const Button: ComponentType<ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'outline' | 'ghost' | 'toolbar'; size?: 'sm' | 'md';
  }>;
  export const Input: ComponentType<InputHTMLAttributes<HTMLInputElement>>;
  export const SegmentedTabs: ComponentType<{
    items: { id: string; value: string; panelId: string; label: ReactNode }[]; value: string;
    label: string; onChange: (value: string) => void;
  }>;
  export const Tag: ComponentType<{ children: ReactNode; tone?: 'outline' | 'neutral' | 'success' | 'warning' | 'danger' }>;
  type ToggleProps = { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean; className?: string };
  export const Switch: ComponentType<ToggleProps>;
  export const Checkbox: ComponentType<ToggleProps>;
  export const Tooltip: ComponentType<{
    children: ReactElement; label: string; side?: 'bottom' | 'top' | 'right'; portal?: boolean; openOnClick?: boolean; maxWidth?: number; disabled?: boolean;
  }>;
  export const Menu: ComponentType<{
    anchor: ReactNode; items: { id: string; label: ReactNode; icon?: ReactNode }[]; open: boolean; selectedId?: string;
    onClose: () => void; onSelect: (id: string) => void; portal?: boolean; compact?: boolean;
  }>;
}
