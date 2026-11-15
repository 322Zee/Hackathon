export class ServiceLocator {
  private static services: Map<string, any> = new Map();

  public static register<T>(serviceName: string, instance: T): void {
    if (this.services.has(serviceName)) {
      console.warn(`[ServiceLocator] Service "${serviceName}" is being overwritten.`);
    }
    this.services.set(serviceName, instance);
  }

  public static get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`[ServiceLocator] Service "${serviceName}" is not registered.`);
    }
    return service as T;
  }

  public static has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  public static reset(): void {
    this.services.clear();
  }

  public static clear(): void {
    this.reset();
  }
}
