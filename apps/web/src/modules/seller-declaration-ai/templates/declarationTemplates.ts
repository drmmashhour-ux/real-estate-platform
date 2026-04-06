import { getSellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";

export function getDeclarationTemplate() {
  return {
    id: "seller_declaration_v1",
    name: "Seller Declaration",
    sections: getSellerDeclarationSections(),
  };
}
