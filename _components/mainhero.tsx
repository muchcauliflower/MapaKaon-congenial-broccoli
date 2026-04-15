import { Heading } from "@/_components/heading"

const MainHero = () => {
    return (
            <div className="relative flex min-h-[60vh] w-full flex-col items-center justify-center gap-y-4 px-4 text-center sm:min-h-[75vh] sm:gap-y-6 sm:px-6 lg:min-h-[82.75vh]">

                {/* Light mode bg */}
                <img
                    src="/mapakaon-hero-bg.png"
                    alt="mapakaon-hero-bg"
                    className="absolute inset-0 h-full w-full object-cover object-center block dark:hidden"
                />
                {/* Dark mode bg */}
                <img
                    src="/mapakaon-hero-bg.png"
                    alt="mapakaon-hero-bg"
                    className="absolute inset-0 h-full w-full object-cover object-center hidden dark:block"
                />

                <div className="absolute inset-0 bg-black/70 sm:bg-black/70 dark:bg-black/70" />
                <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-y-4 sm:gap-y-5">
                    <Heading />
                </div>
            </div>
    );
};

export default MainHero