import { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/ui/input";
import { SearchResultsDropdown } from "./SearchResultsDropdown";

/** Global search box with debounced input, Cmd+K shortcut, and results dropdown. */
export function GlobalSearchBox() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search term (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
    setDebouncedTerm("");
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search... (\u2318K)"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value) setIsOpen(true);
          }}
          onFocus={() => {
            if (searchTerm) setIsOpen(true);
          }}
          className="h-8 w-[200px] pl-8 text-sm md:w-[280px]"
          aria-label="Search tasks and projects"
        />
      </div>
      {isOpen && debouncedTerm.trim() && (
        <SearchResultsDropdown
          searchTerm={debouncedTerm}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
