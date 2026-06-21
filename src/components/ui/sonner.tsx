import { Toaster as Sonner } from "sonner"
import { useAppSelector } from "@/app/hooks"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useAppSelector((state) => state.ui.theme)

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-left"
//      offset={88}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-white dark:group-[.toaster]:!bg-black group-[.toaster]:text-neutral-900 dark:group-[.toaster]:text-neutral-50 group-[.toaster]:border-neutral-200 dark:group-[.toaster]:border-neutral-800 shadow-lg group-[.toaster]:rounded-full",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!text-emerald-600 dark:group-[.toaster]:!text-emerald-400 group-[.toaster]:!border-emerald-200 dark:group-[.toaster]:!border-emerald-800/60",
          error:
            "group-[.toaster]:!text-red-600 dark:group-[.toaster]:!text-red-400 group-[.toaster]:!border-red-200 dark:group-[.toaster]:!border-red-800/60",
          warning:
            "group-[.toaster]:!text-amber-600 dark:group-[.toaster]:!text-amber-400 group-[.toaster]:!border-amber-200 dark:group-[.toaster]:!border-amber-800/60",
          info:
            "group-[.toaster]:!text-blue-600 dark:group-[.toaster]:!text-blue-400 group-[.toaster]:!border-blue-200 dark:group-[.toaster]:!border-blue-800/60",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
