import Geoscheme from "./components/geoscheme";
import { preParse } from "./functions/text";

export default function Home() {
	return (
		<div>
			<Geoscheme />
			<div className="min-h-40 p-4 border-b-2 border-solid border-[var(--color-front)]">
				<div className="max-w-[1000px] m-auto">
					<p className="mb-2">{preParse("Reccs is an archive of collections of literary, cinematic, and theatrical works from each of the United Nations geoscheme subregions (modified slightly to better conform the subregions, devised for statistical purposes, to their corresponding culturally-affiliated regions). Click around the geoscheme to explore works by region, or navigate above for the complete collections.")}</p>
					<p>{preParse("These selections are limited to works that have been translated into English, a considerable bottleneck (like the act of translation—and writing, for that matter—itself) in capturing the full extent of human literary output, but at the same time a noteworthy asset in allowing some degree of access to a plurality of worldviews for the extensive native and non-native English-speaking populations of the world (at present the most prevalent of all speech communities). For every selection, I include a brief description of the work or genre, sources for further reading, and other relevant media, such as text excerpts, playlists, or related videos.")}</p>
				</div>
			</div>
		</div>
	);
}
