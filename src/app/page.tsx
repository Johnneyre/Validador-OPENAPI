"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";

// Interfaces
interface ApiInfo {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, PathItemObject>;
}

interface PathItemObject {
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  trace?: OperationObject;
}

interface OperationObject {
  summary?: string;
  description?: string;
  parameters?: ParameterObject[];
  responses: {
    [statusCode: string]: ResponseObject;
  };
}

interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: {
    type: string;
    format?: string;
  };
}

interface ResponseObject {
  description: string;
  content?: {
    [key: string]: {
      schema: {
        type: string;
        properties?: Record<string, unknown>;
      };
    };
  };
}

interface ValidationResponse {
  message: string;
  api?: ApiInfo;
  error?: string;
}

const ErrorDisplay = ({ error }: { error: string }) => {
  const match = error.match(/line (\d+), column (\d+):/);
  const lineNumber = match ? match[1] : null;
  const columnNumber = match ? match[2] : null;
  
  return (
    <div className="space-y-2">
      <div className="font-semibold text-red-800">Error de validación:</div>
      <div className="text-red-700">
        {lineNumber && columnNumber && (
          <div className="mb-2">
            Localización del error: Línea {lineNumber}, Columna {columnNumber}
          </div>
        )}
        <div className="font-mono bg-red-100 p-2 rounded text-sm whitespace-pre-wrap">
          {error}
        </div>
      </div>
    </div>
  );
};

const SuccessDisplay = ({ api }: { api: ApiInfo }) => (
  <div className="space-y-2">
    <div className="font-semibold text-green-800">API válida</div>
    <div className="bg-green-100 p-4 rounded">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-medium text-green-900">Versión OpenAPI:</div>
          <div className="text-green-800">{api.openapi}</div>
        </div>
        <div>
          <div className="font-medium text-green-900">Título:</div>
          <div className="text-green-800">{api.info.title}</div>
        </div>
        <div>
          <div className="font-medium text-green-900">Versión API:</div>
          <div className="text-green-800">{api.info.version}</div>
        </div>
      </div>
    </div>
  </div>
);

export default function Home() {
  const [content, setContent] = useState("");
  const [response, setResponse] = useState<ValidationResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setResponse({ message: "Error", error: errorMessage });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Swagger API Validator
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <Editor
              height="400px"
              defaultLanguage="yaml"
              value={content}
              onChange={(value) => setContent(value || "")}
              theme="light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
              }}
              className="min-h-[400px]"
            />
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Validar API
            </button>
          </div>
        </form>

        {response && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Resultado
            </h2>
            <div className={`rounded-lg p-6 ${
              response.error 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              {response.error ? (
                <ErrorDisplay error={response.error} />
              ) : (
                response.api && <SuccessDisplay api={response.api} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}