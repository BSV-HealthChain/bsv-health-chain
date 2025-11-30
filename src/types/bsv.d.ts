declare module "bsv" {
  export const crypto: any;

  export class Transaction {
    constructor();
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
    static fromPublicKey(pub: PublicKey): Address;
    static fromString(address: string): Address;
  }
}
