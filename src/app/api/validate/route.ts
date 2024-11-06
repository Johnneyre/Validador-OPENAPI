import { NextResponse } from "next/server";
import SwaggerParser from "@apidevtools/swagger-parser";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    
    // Usar el directorio temporal del sistema
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `swagger-${Date.now()}.yaml`);

    try {
      // Guarda el contenido en un archivo temporal
      fs.writeFileSync(filePath, content, "utf8");

      // Valida el archivo
      const api = await SwaggerParser.validate(filePath);

      // Limpia el archivo temporal
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }

      return NextResponse.json({ message: "API is valid", api });
    } catch (error) {
      // Intenta limpiar el archivo temporal incluso si hay error
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }

      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "API validation failed", error: errorMessage },
      { status: 400 }
    );
  }
}