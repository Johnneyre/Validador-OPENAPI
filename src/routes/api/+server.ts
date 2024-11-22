import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import SwaggerParser from '@apidevtools/swagger-parser';
import YAML from 'js-yaml';

export async function POST({ request }: RequestEvent) {
  try {
    const { content } = await request.json();
    
    // Parsear el YAML primero para obtener el objeto JavaScript
    const parsedYaml = YAML.load(content);
    
    // Validar con SwaggerParser
    const api = await SwaggerParser.validate(parsedYaml);
    
    return json({ message: 'API is valid', api });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return json(
      { message: 'API validation failed', error: errorMessage },
      { status: 400 }
    );
  }
}
