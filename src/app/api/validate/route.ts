import { NextResponse } from "next/server";
import SwaggerParser from "@apidevtools/swagger-parser";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    const filePath = path.join(process.cwd(), "temp-swagger.yaml");

    // Guarda el contenido en un archivo temporal
    fs.writeFileSync(filePath, content, "utf8");

    // Valida el archivo
    const api = await SwaggerParser.validate(filePath);
    fs.unlinkSync(filePath);

    return NextResponse.json({ message: "API is valid", api });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "API validation failed", error: errorMessage },
      { status: 400 }
    );
  }
}