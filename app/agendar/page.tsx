"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { BookingSection } from "@/components/booking-section"
import { PixelIcon } from "@/components/pixel-icon"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"

export default function AgendarPage() {
  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-20 pb-0">
      <MobileNav />

      {/* Full Booking Calendar Component */}
      <BookingSection />

      <Footer />
    </main>
  )
}
