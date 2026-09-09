import { NextResponse } from "next/server";
import { getDonorBySlug } from "@/lib/queries";

export async function GET(_request: Request, ctx: RouteContext<"/api/donor/[slug]">) {
  const { slug } = await ctx.params;
  const data = await getDonorBySlug(slug);
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
