/**
 * ProductionGuard — versioned form registry & `validateFormSchema()`.
 * Canonical implementation lives in `./form-schema.ts`; this file is the public entry name.
 */
export {
  validateFormSchema,
  getFormDefinition,
  listRegisteredFormKeys,
  productionGuardFormDefinitionSchema,
  type ProductionGuardFormDefinition,
  type ProductionGuardFormFieldSpec,
} from "./form-schema";
