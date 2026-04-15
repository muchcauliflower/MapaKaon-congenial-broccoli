"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const Heading = () => {
  return (
    <div className="w-full max-w-3xl space-y-4 text-[#f7f1e2] px-4">
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight break-words">
        Find restaurants near you with MAPAKaon.
      </h1>
      <h3 className="text-sm sm:text-xl md:text-2xl font-medium leading-relaxed break-words">
        Your ultimate guide to navigating Iloilo's jeepney routes for the best dining experience.
      </h3>
      <Link href="/routing" className="flex justify-center sm:justify-center">
        <Button>
          Get Guides Now!
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
};