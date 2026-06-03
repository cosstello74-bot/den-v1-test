import { NextResponse } from "next/server";
import fs   from "fs";
import path from "path";

const CATS_PATH = path.join(process.cwd(), "data", "ael", "generated-categories.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(CATS_PATH, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ categories: [] });
  }
}
