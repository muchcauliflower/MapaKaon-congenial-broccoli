"use client"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useScrollTop } from "@/hooks/use-scroll-top"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"
import { ModeToggle } from "./modeToggle"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"

const Navbar = () => {
  const scrolled = useScrollTop()
  const pathname = usePathname()
  const isLanding = pathname === "/"

  // Navbar is transparent only on landing and only when not scrolled
  const isTransparent = isLanding && !scrolled

  return (
    <Collapsible className="fixed top-0 z-50 w-full pt-4 sm:pt-5">

      {/* Background layer — sits behind content, never affects trigger */}
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-200",
          isTransparent
            ? "bg-transparent"
            : "bg-[#eeebe7] dark:bg-[#08030f] border-b border-[#08030f]/10 dark:border-[#f7f1e2]/10 shadow-sm"
        )}
      />

      {/* Navbar Row */}
      <div className="relative mx-auto flex h-full w-full max-w-screen-2xl flex-row items-center justify-between px-4 sm:px-6 md:px-8">
        <Link href="/">
          <div className={cn(
            "flex py-2 text-2xl font-semibold transition-colors duration-200",
            isTransparent ? "text-[#f7f1e2]" : "text-[#08030f] dark:text-[#f7f1e2]"
          )}>
            MAPAKaon
          </div>
        </Link>
        <div className="flex gap-2 items-center">
          <Show when="signed-out">
            <div className="flex gap-5">
              <SignInButton>
                <button className="hover:bg-orange-400 text-white rounded-2xl font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="hover:bg-orange-400 text-white rounded-2xl font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <CollapsibleTrigger asChild>
            <Button
              variant="landingMenu"
              size="landingMenuButton"
              className={cn(
                "flex items-center justify-center gap-1 bg-transparent transition-colors duration-200",
                isTransparent
                  ? "text-[#f7f1e2]"
                  : "text-[#08030f] dark:text-[#f7f1e2]"
              )}
            >
              <Menu
                className={cn(
                  "!h-6 !w-6 transition-colors duration-200 group-data-[state=open]:rotate-180",
                  isTransparent
                    ? "text-[#f7f1e2]"
                    : "text-[#08030f] dark:text-[#f7f1e2]"
                )}
              />
              Menu
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <div className={cn(
        "relative mt-2 h-[1px]",
        isTransparent ? "bg-white/10" : "bg-[#08030f]/10 dark:bg-[#f7f1e2]/10"
      )} />

      {/* Dropdown */}
      <CollapsibleContent className="relative w-full py-4 text-[1.15rem] text-[#f7f1e2]">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col items-end gap-1 px-4 text-right sm:px-6 md:px-8">
          <div className="rounded-2xl bg-white/90 p-2 text-[#08030f] md:bg-transparent md:p-0 dark:bg-gray-900/90 dark:text-[#f7f1e2] md:dark:bg-transparent">
            {["Get Directions", "API/Docs"].map((item) => (
              <a
                href={
                  item === "Get Directions"
                    ? "/routing"
                    : item === "API/Docs"
                      ? "/docs"
                      : `/${item.toLowerCase().replace(/\s+/g, "-")}`
                }
                key={item}
                className="flex w-50 cursor-pointer flex-col rounded px-4 py-2 transition-colors text-white hover:bg-orange-400 dark:hover:bg-orange-400"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default Navbar