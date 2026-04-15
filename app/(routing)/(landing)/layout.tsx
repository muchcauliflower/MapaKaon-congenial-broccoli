import Navbar from "@/_components/navBar"
import type { Metadata } from "next"

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}