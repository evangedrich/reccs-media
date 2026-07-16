import { Suspense } from "react";
import Geoscheme from "./components/geoscheme";
import { preParse } from "./functions/text";
import { getReccsLite } from "./lib/reccs";

/* 
IMPORTANT COMMANDS:
`pnpm run deploy`
`pnpm sync`
`pnpm sync:images --local`
`pnpm run deploy:quick` || `pnpm deploy/quick`
`pnpm update-map` to update paths of dot map trace
`pnpm subset-fonts` to update font subsets to reflect all used characters
*/

export default async function Home() {
	const reccs = await getReccsLite();
	return (
		<div>
			<Suspense>
				<Geoscheme reccs={reccs} />
			</Suspense>
			<div className="p-4 border-b-2 border-solid border-[var(--color-front)]">
				<div className="max-w-[1000px] m-auto">
					<p className="mb-2">{preParse("Reccs is a compilation of collections of literary, cinematic, theatrical, and analytical achievements from each of the United Nations geoscheme subregions (modified slightly to better conform the subregions, devised for statistical purposes, to their corresponding culturally-affiliated regions). Click around the geoscheme above to explore works by region, or browse the complete collections from the navigation bar at the top of the page.")}</p>
				</div>
			</div>
			{/* <div className="w-160 h-160 bg-[#181818] p-15 m-4">
				<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
					<text 
						textAnchor="middle" 
						alignmentBaseline="middle" 
						fontFamily="syncopate" 
						fontWeight="700"
						x="50" y="45"
						fontSize="40"
						fill="white"
					>
						<tspan dx="-1" dy="-4">R</tspan>
						<tspan dx="-3" dy="8">E</tspan>
						<tspan dx="-3" dy="-8">C</tspan>
					</text>
					<text 
						textAnchor="middle" 
						alignmentBaseline="middle" 
						fontFamily="syncopate" 
						fontWeight="700"
						x="50" y="80"
						fontSize="40"
						fill="white"
					>
						<tspan dy="-1">C</tspan>
						<tspan dx="-3" dy="8">S</tspan>
					</text>
				</svg>
			</div> */}
		</div>
	);
}
