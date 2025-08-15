// ModelService is no longer needed as we use FastAPI
// This file is kept for backward compatibility but is deprecated

export class ModelService {
  private static instance: ModelService;

  private constructor() {}

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  async initialize(): Promise<void> {
    console.log('ModelService is deprecated - using FastAPI instead');
  }

  isModelReady(): boolean {
    return false; // Always false since we don't use local models
  }

  getModelInfo() {
    return null;
  }

  async dispose(): Promise<void> {
    // Nothing to dispose
  }
}

export const modelService = ModelService.getInstance();