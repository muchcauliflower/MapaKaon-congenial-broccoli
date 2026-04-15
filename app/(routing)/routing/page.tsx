'use client'
import { useState, useEffect, useRef } from "react"
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza"
import "mapbox-gl/dist/mapbox-gl.css"
import MapView from "@/_components/mapView"

export default function mapsPage() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(true)
  }, [])

  return (
    <div className="h-dvh">
      {/* Disclaimer modal — overlays the map */}
      <Credenza open={isOpen} onOpenChange={setIsOpen}>
        <CredenzaContent className="sm:max-w-200">
          <CredenzaHeader className="sm:min-h-18">
            <CredenzaTitle className="lg:text-2xl md:text-lg sm:text-base">
              MAPAKaon
            </CredenzaTitle>
            <CredenzaDescription className="text-2xl md:text-lg sm:text-base">
              Restaurant locator within Iloilo City.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="lg:text-lg md:text-base sm:text-sm">
            <p>This is a prototype service and is <b>currently in development</b>.</p>
            <p>Calculations and data <b>will be inaccurate</b>.</p>
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <button>Acknowledged</button>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* Map fills the full page behind the modal */}
      <div style={{ width: '100vw', height: '100vh' , position: "relative"}}>
        <MapView />

        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 10,
            padding: "10px",
          }}
        >
          {/* <ModeToggle /> */}
        </div>
      </div>
    </div>
  )
}