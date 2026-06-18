import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const buttonVariants: (props?: ({
    variant?: "solid" | "soft" | "outline" | "ghost" | "danger" | null | undefined;
    size?: "lg" | "md" | "sm" | "xs" | null | undefined;
    iconOnly?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    iconOnly?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

declare const inputVariants: (props?: ({
    variant?: "default" | "labeled" | null | undefined;
    size?: "lg" | "md" | "sm" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
type InputBaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">;
type TextareaBaseProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">;
interface InputProps extends InputBaseProps, VariantProps<typeof inputVariants> {
    label?: string;
    helperText?: string;
    error?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    rightIconAriaLabel?: string;
    onRightIconClick?: () => void;
    as?: "input" | "textarea";
    textareaProps?: TextareaBaseProps;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement | HTMLTextAreaElement>>;

declare const toggleVariants: (props?: ({
    variant?: "default" | "subtle" | null | undefined;
    size?: "lg" | "md" | "sm" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">, VariantProps<typeof toggleVariants> {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    label?: string;
    description?: string;
    labelPosition?: "left" | "right";
}
declare const Toggle: React.ForwardRefExoticComponent<ToggleProps & React.RefAttributes<HTMLButtonElement>>;

declare const selectVariants: (props?: ({
    size?: "lg" | "md" | "sm" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">, VariantProps<typeof selectVariants> {
    variant?: "default" | "labeled";
    label?: string;
    helperText?: string;
    error?: boolean;
    placeholder?: string;
}
declare const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLSelectElement>>;

type TabVariant = "underline" | "pill";
type TabSize = "lg" | "md" | "sm";
declare const tabItemVariants: (props?: ({
    variant?: "underline" | "pill" | null | undefined;
    size?: "lg" | "md" | "sm" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: TabVariant;
    size?: TabSize;
    fullWidth?: boolean;
}
declare const Tabs: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;
interface TabItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
    active?: boolean;
    leftIcon?: React.ReactNode;
    badge?: number;
}
declare const TabItem: React.ForwardRefExoticComponent<TabItemProps & React.RefAttributes<HTMLButtonElement>>;

declare const chipVariants: (props?: ({
    variant?: "solid" | "outlined" | null | undefined;
    size?: "md" | "sm" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof chipVariants> {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    removable?: boolean;
    onRemove?: (e: React.MouseEvent) => void;
}
declare const Chip: React.ForwardRefExoticComponent<ChipProps & React.RefAttributes<HTMLButtonElement>>;

declare const badgeVariants: (props?: ({
    variant?: "solid" | "soft" | "outline" | null | undefined;
    tone?: "error" | "neutral" | "brand" | "success" | "warning" | null | undefined;
    size?: "md" | "sm" | "xs" | null | undefined;
    dot?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
    dot?: boolean;
    leftIcon?: React.ReactNode;
}
declare const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLSpanElement>>;

declare const dividerVariants: (props?: ({
    orientation?: "horizontal" | "vertical" | null | undefined;
    variant?: "default" | "subtle" | "strong" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface DividerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "aria-orientation">, VariantProps<typeof dividerVariants> {
    inset?: string;
}
declare const Divider: React.ForwardRefExoticComponent<DividerProps & React.RefAttributes<HTMLDivElement>>;
interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}
declare const SectionHeader: React.ForwardRefExoticComponent<SectionHeaderProps & React.RefAttributes<HTMLDivElement>>;

type ListSize = "lg" | "md" | "sm";
declare const listItemVariants: (props?: ({
    size?: "lg" | "md" | "sm" | null | undefined;
    selected?: boolean | null | undefined;
    disabled?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ListProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: ListSize;
    divided?: boolean;
}
interface ListItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size" | "disabled">, VariantProps<typeof listItemVariants> {
    title?: string;
    subtitle?: string;
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
}
declare const List: React.ForwardRefExoticComponent<ListProps & React.RefAttributes<HTMLDivElement>>;
declare const ListItem: React.ForwardRefExoticComponent<ListItemProps & React.RefAttributes<HTMLButtonElement>>;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    fit?: "fill" | "hug";
}
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
}
declare const CardHeader: React.ForwardRefExoticComponent<CardHeaderProps & React.RefAttributes<HTMLDivElement>>;
declare const CardBody: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardImage: React.ForwardRefExoticComponent<React.ImgHTMLAttributes<HTMLImageElement> & React.RefAttributes<HTMLImageElement>>;

interface AppBarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** main: 로고 + 알림 레이아웃 / sub: 뒤로가기 + 타이틀 + 알림 레이아웃 */
    depth?: "main" | "sub";
    title?: string;
    left?: React.ReactNode;
    right?: React.ReactNode;
    sticky?: boolean;
}
declare const AppBar: React.ForwardRefExoticComponent<AppBarProps & React.RefAttributes<HTMLDivElement>>;

declare const bottomNavVariants: (props?: ({
    variant?: "default" | "elevated" | null | undefined;
    fixed?: boolean | null | undefined;
    size?: "lg" | "md" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BottomNavProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bottomNavVariants> {
}
declare const BottomNav: React.ForwardRefExoticComponent<BottomNavProps & React.RefAttributes<HTMLDivElement>>;
declare const bottomNavItemVariants: (props?: ({
    active?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface BottomNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof bottomNavItemVariants> {
    icon?: React.ReactNode;
    badge?: number;
    label?: string;
}
declare const BottomNavItem: React.ForwardRefExoticComponent<BottomNavItemProps & React.RefAttributes<HTMLButtonElement>>;

interface BottomNavWithSearchProps extends React.HTMLAttributes<HTMLDivElement> {
    items: BottomNavItemProps[];
    searchPlaceholder?: string;
    fixed?: boolean;
    defaultSearchOpen?: boolean;
    onSearchFocus?: () => void;
    onSearchBlur?: () => void;
    onSearchChange?: (value: string) => void;
    onSearchSubmit?: (value: string) => void;
    onSearchClose?: () => void;
}
declare const BottomNavWithSearch: React.ForwardRefExoticComponent<BottomNavWithSearchProps & React.RefAttributes<HTMLDivElement>>;

declare const sheetVariants: (props?: class_variance_authority_types.ClassProp | undefined) => string;
type SurfaceLevel$1 = "L2" | "L3" | "L4";
interface BottomSheetProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof sheetVariants> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    surface?: SurfaceLevel$1;
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    maxHeight?: string;
    showClose?: boolean;
    showHandle?: boolean;
    contentClassName?: string;
}
declare const BottomSheet: React.ForwardRefExoticComponent<BottomSheetProps & React.RefAttributes<HTMLDivElement>>;

declare const modalVariants: (props?: class_variance_authority_types.ClassProp | undefined) => string;
type SurfaceLevel = "L3" | "L4";
interface FullModalProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof modalVariants> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    surface?: SurfaceLevel;
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    showClose?: boolean;
}
declare const FullModal: React.ForwardRefExoticComponent<FullModalProps & React.RefAttributes<HTMLDivElement>>;

export { AppBar, type AppBarProps, Badge, type BadgeProps, BottomNav, BottomNavItem, type BottomNavItemProps, type BottomNavProps, BottomNavWithSearch, type BottomNavWithSearchProps, BottomSheet, type BottomSheetProps, Button, type ButtonProps, Card, CardBody, CardFooter, CardHeader, type CardHeaderProps, CardImage, type CardProps, Chip, type ChipProps, Divider, type DividerProps, FullModal, type FullModalProps, Input, type InputProps, List, ListItem, type ListItemProps, type ListProps, SectionHeader, type SectionHeaderProps, Select, type SelectProps, TabItem, type TabItemProps, Tabs, type TabsProps, Toggle, type ToggleProps, badgeVariants, bottomNavItemVariants, bottomNavVariants, buttonVariants, chipVariants, dividerVariants, inputVariants, listItemVariants, selectVariants, tabItemVariants, toggleVariants };
