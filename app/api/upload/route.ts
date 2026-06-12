import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File upload required" }, { status: 400 });
    }

    const uploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/uploads/${encodeURIComponent(file.name)}`,
    };

    return NextResponse.json({ file: uploadedFile }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

