"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum resultado encontrado.",
  loading = false,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? ""

  function openMenu() {
    if (disabled) return
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setOpen(true)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        containerRef.current?.contains(target) ||
        popupRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setSearch("")
      return
    }

    function closeOnScroll(event: Event) {
      if (popupRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    function closeOnResize() {
      setOpen(false)
    }
    document.addEventListener("scroll", closeOnScroll, true)
    window.addEventListener("resize", closeOnResize)
    return () => {
      document.removeEventListener("scroll", closeOnScroll, true)
      window.removeEventListener("resize", closeOnResize)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground transition-all",
          "focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          className
        )}
        disabled={disabled}
      >
        <span className="whitespace-nowrap">
          {value ? selectedLabel : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              maxWidth: `calc(100vw - ${coords.left}px - 16px)`,
              zIndex: 9999,
            }}
            className="mt-1 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-primary/5"
          >
            <div className="flex items-center border-b border-border px-3">
              <Search className="mr-2 size-4 shrink-0 opacity-50" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-60 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando...
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      "relative flex w-full items-center gap-2 px-3 py-1.5 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      opt.value === value && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        opt.value === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}