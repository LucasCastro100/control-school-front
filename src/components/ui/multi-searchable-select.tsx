"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  value: string
  label: string
}

interface MultiSearchableSelectProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function MultiSearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum resultado encontrado.",
  loading = false,
  disabled = false,
  className,
}: MultiSearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabels = value
    .map((v) => options.find((opt) => opt.value === v)?.label)
    .filter(Boolean)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
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
    }
  }, [open])

  function handleToggle(optValue: string) {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  function handleRemove(optValue: string) {
    onChange(value.filter((v) => v !== optValue))
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-1 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all",
          "focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          value.length === 0 && "text-muted-foreground",
          className
        )}
        disabled={disabled}
      >
        <div className="flex flex-wrap gap-1">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(value[i])
                  }}
                  className="rounded-full hover:bg-primary/20 p-0.5"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 min-w-max rounded-xl border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-primary/5">
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
          <div className="max-h-60 overflow-auto p-1">
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
              filtered.map((opt) => {
                const isSelected = value.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggle(opt.value)}
                    className={cn(
                      "relative flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="whitespace-nowrap">{opt.label}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
