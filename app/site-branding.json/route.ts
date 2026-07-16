import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_WEBSITE_TITLE, faviconUrl } from "@/lib/site-branding"

export async function GET() {
  try {
    const setting = await prisma.schoolSetting.findUnique({
      where: { id: "default" },
      select: { websiteTitle: true, faviconUpdatedAt: true },
    })
    return NextResponse.json({
      websiteTitle: setting?.websiteTitle || DEFAULT_WEBSITE_TITLE,
      faviconUrl: faviconUrl(setting?.faviconUpdatedAt),
    }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({
      websiteTitle: DEFAULT_WEBSITE_TITLE,
      faviconUrl: "/favicon.ico",
    }, { headers: { "Cache-Control": "no-store" } })
  }
}
