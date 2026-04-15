"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Home } from "lucide-react"
import { ModeToggle } from "./modeToggle"
import Link from "next/link"
import MenuList from "./menuList"

export function SidebarDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 h-10 w-10 rounded-xl border border-border bg-background/80 shadow-sm backdrop-blur-sm"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed top-3 left-1/2 z-50 flex w-80 -translate-x-1/2 flex-col rounded-2xl border bg-background/95 shadow-xl backdrop-blur-md sm:top-4 sm:left-4 sm:w-96 sm:translate-x-0 lg:w-[26rem] max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-32px)]">
            
            {/* Header - Fixed at top */}
            <div className="flex items-center justify-between p-4 pb-2 sm:p-5 sm:pb-3 lg:p-6 lg:pb-4">
              <div className="flex items-center gap-3">
                <Link href="/" passHref>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3">
                    <Home className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                </Link>
                <h1 className="text-sm font-semibold sm:text-base lg:text-lg">Menu</h1>
              </div>

              <div className="flex items-center gap-1.5">
                <ModeToggle small />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6 custom-scrollbar">
              <MenuList onRouteSet={() => setOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  )
}