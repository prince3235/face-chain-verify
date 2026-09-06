import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const res = await fetch(`${BACKEND_URL}/detect-face`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend face detection failed" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach backend face service" },
      { status: 502 }
    );
  }
}
