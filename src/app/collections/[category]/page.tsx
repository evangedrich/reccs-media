// import { Metadata } from "next";

// export const dynamic = "force-dynamic";
// export async function generateMetadata(
//     { params }: { params: Promise<{ mediaID: string }> }
// ): Promise<Metadata> {
//     const { mediaID } = await params;
//     const entry = await getReccById(mediaID);
//     if (!entry) return {};
//     return {
//         title: getTitle(entry),
//     };
// }