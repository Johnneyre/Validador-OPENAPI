export interface ApiInfo {
    openapi: string;
    info: {
      title: string;
      version: string;
    };
    paths: Record<string, PathItemObject>;
  }
  
  export interface PathItemObject {
    [key: string]: any;
  }
  
  export interface ValidationResponse {
    message: string;
    api?: ApiInfo;
    error?: string;
  }