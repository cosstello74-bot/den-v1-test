import { NextResponse } from "next/server";
import fs   from "fs";
import path from "path";

const PAGES_PATH = path.join(process.cwd(), "data", "ael", "generated-pages.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(PAGES_PATH, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ pages: [] });
  }
}
