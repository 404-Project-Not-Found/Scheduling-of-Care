declare module 'mongodb-memory-server' {
  export type MongoMemoryServerCreateOptions = {
    instance?: {
      dbName?: string;
      port?: number;
      ip?: string;
      storageEngine?: string;
    };
    binary?: {
      version?: string;
      skipMD5?: boolean;
    };
    autoStart?: boolean;
  };

  export class MongoMemoryServer {
    static create(
      options?: MongoMemoryServerCreateOptions
    ): Promise<MongoMemoryServer>;

    getUri(): string;

    stop(): Promise<boolean>;
  }
}
