import { NextResponse } from "next/server";

import {
  getPublicMonthlyAvailability,
  resolvePublicAvailabilityYearMonth,
} from "@/lib/data/public-availability";

function corsHeaders(): HeadersInit {
  const origin = process.env.PUBLIC_AVAILABILITY_CORS_ORIGIN ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = resolvePublicAvailabilityYearMonth(
    searchParams.get("year"),
    searchParams.get("month"),
  );

  if (!parsed) {
    return NextResponse.json(
      { error: "year または month の指定が不正です（month は 1〜12）" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const data = await getPublicMonthlyAvailability(parsed.year, parsed.month);
  if (!data) {
    return NextResponse.json(
      { error: "空き状況の取得に失敗しました" },
      { status: 503, headers: corsHeaders() },
    );
  }

  return NextResponse.json(data, {
    headers: {
      ...corsHeaders(),
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
