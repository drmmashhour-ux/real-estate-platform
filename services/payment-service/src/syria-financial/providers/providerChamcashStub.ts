import { SyriaStubPaymentProvider } from "./providerStub.js";

export class SyriaChamCashStubPaymentProvider extends SyriaStubPaymentProvider {
  constructor() {
    super("provider_chamcash_stub");
  }
}
