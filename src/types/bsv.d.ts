declare module "bsv" {
  export const crypto: any;
  export class Transaction {
    constructor(): void;
    from(utxos: any[]): this;
    to(address: string, amount: number): this;
    sign(privateKey: any): this;
    serialize(): string;
  }
  export class PrivateKey {
    constructor(key?: string);
    toWIF(): string;
  }
  export class PublicKey {
    constructor(key?: string);
  }
  export class Address {
    constructor(address: string);
  }
}
