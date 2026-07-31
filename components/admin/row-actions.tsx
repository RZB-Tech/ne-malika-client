"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

/**
 * Одно описание действий строки на два способа вызова: три точки справа
 * и правая кнопка мыши по строке. Иначе каждый пункт пришлось бы держать
 * в двух местах и следить, чтобы они не разъехались.
 */
export interface RowAction {
  label: string;
  icon: LucideIcon;
  /** Переход — пункт становится ссылкой. */
  href?: string;
  onSelect?: () => void;
  /** Действие с обязательной причиной: пункт открывает диалог ввода. */
  withReason?: {
    title: string;
    description?: string;
    onConfirm: (reason: string) => Promise<void>;
  };
  /** Необратимое действие: пункт открывает окно подтверждения. */
  withConfirm?: {
    title: string;
    description?: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
  };
  destructive?: boolean;
}

export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Действия">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      {/* Фиксированная ширина: иначе длинные пункты переносятся на две строки. */}
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          {actions.map((action) => (
            <ActionItem
              key={action.label}
              action={action}
              Item={DropdownMenuItem}
            />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RowContextMenu({
  actions,
  children,
}: {
  actions: RowAction[];
  children: React.ReactNode;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuGroup>
          {actions.map((action) => (
            <ActionItem
              key={action.label}
              action={action}
              Item={ContextMenuItem}
            />
          ))}
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

type MenuItem = typeof DropdownMenuItem | typeof ContextMenuItem;

function ActionItem({ action, Item }: { action: RowAction; Item: MenuItem }) {
  const variant = action.destructive ? "destructive" : undefined;

  if (action.href) {
    return (
      <Item variant={variant} asChild>
        <Link href={action.href}>
          <action.icon className="size-4" />
          {action.label}
        </Link>
      </Item>
    );
  }

  if (action.withReason) {
    return (
      <AbolishDialog
        title={action.withReason.title}
        description={action.withReason.description}
        onConfirm={action.withReason.onConfirm}
      >
        {/* preventDefault: без него меню закроется раньше, чем откроется диалог. */}
        <Item variant={variant} onSelect={(e: Event) => e.preventDefault()}>
          <action.icon className="size-4" />
          {action.label}
        </Item>
      </AbolishDialog>
    );
  }

  if (action.withConfirm) {
    return (
      <ConfirmDialog
        title={action.withConfirm.title}
        description={action.withConfirm.description}
        confirmLabel={action.withConfirm.confirmLabel}
        destructive={action.destructive}
        onConfirm={action.withConfirm.onConfirm}
      >
        <Item variant={variant} onSelect={(e: Event) => e.preventDefault()}>
          <action.icon className="size-4" />
          {action.label}
        </Item>
      </ConfirmDialog>
    );
  }

  return (
    <Item variant={variant} onSelect={action.onSelect}>
      <action.icon className="size-4" />
      {action.label}
    </Item>
  );
}
