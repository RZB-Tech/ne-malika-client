"use client";

import Link from "next/link";
import type { AppIcon } from "@/components/icons";
import { MoreHorizontal } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useT } from "@/components/providers/i18n-provider";

export interface RowAction {
  label: string;
  icon: AppIcon;
  href?: string;
  onSelect?: () => void;
  withReason?: {
    title: string;
    description?: string;
    onConfirm: (reason: string) => Promise<void>;
  };
  withConfirm?: {
    title: string;
    description?: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
  };
  destructive?: boolean;
}

export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const { t } = useT();
  const normal = actions.filter((a) => !a.destructive);
  const destructive = actions.filter((a) => a.destructive);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("common.actions")}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          {normal.map((action) => (
            <ActionItem
              key={action.label}
              action={action}
              Item={DropdownMenuItem}
            />
          ))}
        </DropdownMenuGroup>
        {normal.length > 0 && destructive.length > 0 && (
          <DropdownMenuSeparator />
        )}
        {destructive.length > 0 && (
          <DropdownMenuGroup>
            {destructive.map((action) => (
              <ActionItem
                key={action.label}
                action={action}
                Item={DropdownMenuItem}
              />
            ))}
          </DropdownMenuGroup>
        )}
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
  const normal = actions.filter((a) => !a.destructive);
  const destructive = actions.filter((a) => a.destructive);
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuGroup>
          {normal.map((action) => (
            <ActionItem
              key={action.label}
              action={action}
              Item={ContextMenuItem}
            />
          ))}
        </ContextMenuGroup>
        {normal.length > 0 && destructive.length > 0 && (
          <ContextMenuSeparator />
        )}
        {destructive.length > 0 && (
          <ContextMenuGroup>
            {destructive.map((action) => (
              <ActionItem
                key={action.label}
                action={action}
                Item={ContextMenuItem}
              />
            ))}
          </ContextMenuGroup>
        )}
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
