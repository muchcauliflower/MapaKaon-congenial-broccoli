const Footer = () => {
    return (
        <div className="w-full bg-[#eeebe7b7] dark:bg-[#1c1b24] py-6">
            <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-8 text-center">
                <p className="text-sm text-black dark:text-gray-400">
                    &copy; {new Date().getFullYear()} MAPAKaon. All rights reserved.
                </p>
            </div>
        </div>
    )
}

export default Footer