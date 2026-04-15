"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle({ small = false }: { small?: boolean }) {
  const { setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={small
            ? "relative flex justify-center h-6 w-6"
            : "relative flex justify-center h-10 w-10 md:h-10 md:w-10 lg:h-15 lg:w-15"
          }
        >
          <Sun className={small ? "size-3 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" : "size-5 md:size-6 lg:size-7 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"} />
          <Moon className={small ? "absolute size-3 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" : "absolute size-5 md:size-6 lg:size-10 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}