"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export type DropdownOption = {
  value: string;
  label: string;
  description?: string;
  hint?: string;
  disabled?: boolean;
};

type Props = {
  value: string | null;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  disabled,
  id,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const listId = React.useId();
  const optionIdPrefix = React.useId();

  const selected = options.find((o) => o.value === value) ?? null;

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const idx = options.findIndex(
      (o) => o.value === value && !o.disabled,
    );
    setActiveIndex(idx >= 0 ? idx : options.findIndex((o) => !o.disabled));
  }, [open, options, value]);

  React.useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLLIElement>(
      `[data-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const commit = (idx: number) => {
    const opt = options[idx];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => {
        for (let i = prev + 1; i < options.length; i++) {
          if (!options[i].disabled) return i;
        }
        return prev;
      });
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => {
        for (let i = prev - 1; i >= 0; i--) {
          if (!options[i].disabled) return i;
        }
        return prev;
      });
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      for (let i = 0; i < options.length; i++) {
        if (!options[i].disabled) {
          setActiveIndex(i);
          break;
        }
      }
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          setActiveIndex(i);
          break;
        }
      }
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(activeIndex);
    }
  };

  return (
    <div
      ref={rootRef}
      className={"gf-dropdown" + (className ? ` ${className}` : "")}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="gf-input gf-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
      >
        <span
          className="gf-dropdown__value"
          data-placeholder={selected ? undefined : "true"}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={"gf-dropdown__chevron" + (open ? " is-open" : "")}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="gf-dropdown__panel"
          aria-activedescendant={
            activeIndex >= 0 ? `${optionIdPrefix}-${activeIndex}` : undefined
          }
          tabIndex={-1}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value}
                id={`${optionIdPrefix}-${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                data-index={i}
                className={
                  "gf-dropdown__option" +
                  (isSelected ? " is-selected" : "") +
                  (isActive ? " is-active" : "") +
                  (opt.disabled ? " is-disabled" : "")
                }
                onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(i);
                }}
              >
                <span className="gf-dropdown__option-label">{opt.label}</span>
                {opt.hint ? (
                  <span className="gf-dropdown__option-hint">{opt.hint}</span>
                ) : null}
                {opt.description ? (
                  <span className="gf-dropdown__option-desc">{opt.description}</span>
                ) : null}
              </li>
            );
          })}
          {options.length === 0 ? (
            <li className="gf-dropdown__empty">No options</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
