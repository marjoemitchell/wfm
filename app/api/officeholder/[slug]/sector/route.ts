import { NextResponse } from "next/server";
import { getPoliticianSectorDonors } from "@/lib/queries";

export async function GET(request: Request, ctx: RouteContext<"/api/officeholder/[slug]/sector">) {
  const { slug } = await ctx.params;
  const sector = new URL(request.url).searchParams.get("sector");
  if (!sector) return NextResponse.json({ error: "sector is required" }, { status: 400 });

  const data = await getPoliticianSectorDonors(slug, sector);
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
