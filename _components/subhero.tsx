import HeroCard from "@/_components/heroCard"
import { Brain, Map, MapPin, Salad, Waypoints } from "lucide-react"
import { AnimatedComponent } from "@/_components/animated"

const SubHeroes = () => {
  return (
    <>
      {/* Section 1: Text + Animated visual */}
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col lg:flex-row items-center justify-between px-4 sm:px-8 py-10 gap-6">
        <div className="w-full rounded-3xl p-6 sm:p-10">
          <div className="flex h-full w-full flex-col items-center justify-center text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-6xl font-bold">
              Don't know where to eat?
            </h1>
            <p className="pt-3 text-base sm:text-xl lg:text-2xl">
              Let MAPAKaon be your guide to finding the best restaurants near you. Providing steps to get there!
            </p>
          </div>
        </div>
        <div className="w-full min-h-[16rem] lg:h-[30rem] rounded-3xl bg-gradient-to-r from-[#7acff0] to-[#4e86c2] dark:from-[#110131] dark:to-[#3c0e49] p-10 flex items-center justify-center">
          <AnimatedComponent />
        </div>
      </div>

      {/* Section 2: Services grid */}
      <div className="mx-auto flex w-full max-w-screen-2xl lg:px-4 sm:px-8 lg:pb-10">
        <div className="w-full lg:rounded-3xl md:rounded-2xl sm:rounded-xl bg-[#eeebe7b7] dark:bg-[#1c1b24] p-6 sm:p-10">
          <h1 className="border-b pb-6 sm:pb-10 text-xl sm:text-2xl lg:text-4xl font-bold">
            MAPAKaon gives you:
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <HeroCard
              title="Directions"
              subtitle="Get directions to your desired restaurant, including the nearest jeepney stops and routes to take. No more getting lost in the city!"
              icon={MapPin}
            />
            <HeroCard
              title="Detailed Step-by-Step Guide"
              subtitle="Our system provides a detailed step-by-step guide to help you navigate the city and reach your destination with ease. No more confusion or uncertainty about which jeepney to take or where to get off!"
              icon={Map}
            />
            <HeroCard
              title="Up to Date Information" 
              subtitle="Stay updated with the latest information about your desired restaurant, including opening hours, menus, and reviews."
              icon={Salad}
            />
            {/* POI card isnt really necessary */}
            {/* <HeroCard
              title="Places of Interest (POIs)"
              subtitle="Discover nearby points of interest (POIs) such as landmarks, shops, and other attractions along your route. Explore the city while you travel to your restaurant destination!"
              icon={Waypoints}
            /> */}
            <HeroCard
              title="Optimized for Jeepney Routing"
              subtitle="MAPAKaon's unique is tailored for jeepney routing and travelling in the city. Making sure you get the best and most efficient routes to your desired restaurant destination!"
              icon={Brain}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SubHeroes;