import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button, type ButtonProps } from "./button";

interface ConfirmDialogProps {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  /** Controlled mode: truyền open + onOpenChange để điều khiển từ bên ngoài */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger mode: truyền triggerButton hoặc triggerText */
  triggerButton?: React.ReactNode; // trigger là nút bấm để mở dialog
  triggerText?: string; // triggerText là chữ trên nút bấm để mở dialog
  triggerButtonVariant?: ButtonProps["variant"]; // triggerButtonVariant là kiểu nút bấm để mở dialog
  /** Hiển thị nút xác nhận kiểu nguy hiểm (đỏ) */
  isDestructive?: boolean; // isDestructive là true thì nút xác nhận sẽ có màu đỏ
  variant?: "default" | "destructive"; // variant là kiểu dialog
}

export function ConfirmDialog({
  title = "Bạn có chắc chắn muốn thực hiện hành động này?",
  description = "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm, // onConfirm là hàm được gọi khi nhấn nút xác nhận
  open, // open là trạng thái mở/đóng của dialog
  onOpenChange, // onOpenChange là hàm thay đổi trạng thái mở/đóng của dialog
  triggerButton, // trigger là nút bấm để mở dialog
  triggerText = "Mở", // triggerText là chữ trên nút bấm để mở dialog
  triggerButtonVariant = "default", // triggerButtonVariant là kiểu nút bấm để mở dialog
  isDestructive = false,
  variant,
}: ConfirmDialogProps) {
  const isControlled = open !== undefined;
  const destructive = variant === "destructive" || isDestructive;

  return (
    <AlertDialog open={isControlled ? open : undefined} onOpenChange={isControlled ? onOpenChange : undefined}>
      {/* Chỉ render Trigger khi không dùng controlled mode */} 
      {!isControlled && (
        <AlertDialogTrigger asChild>
          {triggerButton ? (
            triggerButton
          ) : (
            <Button variant={triggerButtonVariant}>{triggerText}</Button>
          )}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
