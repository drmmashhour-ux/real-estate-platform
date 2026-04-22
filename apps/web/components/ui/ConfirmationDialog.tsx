"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function ConfirmationDialog(props: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "goldPrimary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const variant = props.variant ?? "goldPrimary";
  return (
    <Modal
      open={props.open}
      title={props.title}
      onClose={props.onCancel}
      footer={
        <>
          <Button variant="outline" type="button" onClick={props.onCancel}>
            {props.cancelLabel ?? "Cancel"}
          </Button>
          <Button variant={variant === "danger" ? "danger" : "goldPrimary"} type="button" onClick={props.onConfirm}>
            {props.confirmLabel ?? "Confirm"}
          </Button>
        </>
      }
    >
      {props.description ?
        <div className="text-sm text-zinc-400">{props.description}</div>
      : null}
    </Modal>
  );
}
