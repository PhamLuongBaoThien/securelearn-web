import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS } from "./constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:opacity-80 transition-opacity hover:bg-transparent px-0 h-auto focus-visible:ring-0"
      >
        {current.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] bg-background border border-border rounded-lg shadow-lg overflow-hidden py-1">
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="ghost"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  "w-full justify-start px-4 py-2.5 text-sm font-normal rounded-none hover:bg-secondary text-left transition-colors",
                  opt.value === value ? "font-semibold text-primary" : "text-foreground"
                )}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
