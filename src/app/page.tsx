import Map from "@/app/components/map";
import { subregions } from "@/app/lib/subregions";

export default function Home() {
	return (
		<div>
			<div className="border-b-2 border-solid border-[var(--color-front)] flex">
				<div className="w-[70%] p-4 border-r-2 border-solid border-[var(--color-front)]">
					<Map />
				</div>
				<div className="w-[30%] p-4 overflow-scroll">
					<h2>Africa</h2>
					<ul>
						{subregions.filter(itm => itm.id.startsWith("AF")).map(subr => (
							<li key={`li-${subr.id}`}>- {subr.name}</li>
						))}
					</ul>
					<h2>Americas</h2>
					<ul>
						{subregions.filter(itm => itm.id.startsWith("AM")).map(subr => (
							<li key={`li-${subr.id}`}>- {subr.name}</li>
						))}
					</ul>
					<h2>Eurasia</h2>
					<h2>Oceania</h2>
					
				</div>
			</div>
			<div className="h-40 border-b-2 border-solid border-[var(--color-front)]"></div>
		</div>
	);
}
