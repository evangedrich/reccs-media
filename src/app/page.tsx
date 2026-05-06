import Geoscheme from "./components/geoscheme";
import { preParse } from "./functions/text";

export default function Home() {
	return (
		<div>
			<Geoscheme />
			<div className="p-4 border-b-2 border-solid border-[var(--color-front)]">
				<div className="max-w-[1000px] m-auto">
					<p className="mb-2">{preParse("Reccs is an archive of collections of literary, cinematic, theatrical, and rational compositions from each of the United Nations geoscheme subregions (modified slightly to better conform the subregions, devised for statistical purposes, to their corresponding culturally-affiliated regions). Click around the geoscheme above to explore works by region, or browse the complete collections from the navigation.")}</p>
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
