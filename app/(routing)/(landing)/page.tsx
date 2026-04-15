"use client"

import Footer from "@/_components/footer"
import MainHero from "@/_components/mainhero"
import SubHeroes from "@/_components/subhero"


const LandingPage = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <MainHero />
      <SubHeroes />
      <Footer />
    </div>
  )
}

export default LandingPage