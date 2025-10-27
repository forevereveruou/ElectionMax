export class GenericStringStorage {
  constructor(private ns = "fhevm") {}
  async getItem(key: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(`${this.ns}:${key}`);
  }
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`${this.ns}:${key}`, value);
  }
}


