
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Incident
 * 
 */
export type Incident = $Result.DefaultSelection<Prisma.$IncidentPayload>
/**
 * Model Flag
 * 
 */
export type Flag = $Result.DefaultSelection<Prisma.$FlagPayload>
/**
 * Model Suspension
 * 
 */
export type Suspension = $Result.DefaultSelection<Prisma.$SuspensionPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const IncidentType: {
  FRAUD: 'FRAUD',
  HARASSMENT: 'HARASSMENT',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  SCAM: 'SCAM',
  SAFETY_CONCERN: 'SAFETY_CONCERN',
  OTHER: 'OTHER'
};

export type IncidentType = (typeof IncidentType)[keyof typeof IncidentType]


export const IncidentStatus: {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED'
};

export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus]


export const FlagTargetType: {
  ACCOUNT: 'ACCOUNT',
  LISTING: 'LISTING'
};

export type FlagTargetType = (typeof FlagTargetType)[keyof typeof FlagTargetType]


export const FlagStatus: {
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
  DISMISSED: 'DISMISSED'
};

export type FlagStatus = (typeof FlagStatus)[keyof typeof FlagStatus]


export const SuspensionTargetType: {
  ACCOUNT: 'ACCOUNT',
  LISTING: 'LISTING'
};

export type SuspensionTargetType = (typeof SuspensionTargetType)[keyof typeof SuspensionTargetType]


export const SuspensionStatus: {
  ACTIVE: 'ACTIVE',
  LIFTED: 'LIFTED',
  EXPIRED: 'EXPIRED'
};

export type SuspensionStatus = (typeof SuspensionStatus)[keyof typeof SuspensionStatus]

}

export type IncidentType = $Enums.IncidentType

export const IncidentType: typeof $Enums.IncidentType

export type IncidentStatus = $Enums.IncidentStatus

export const IncidentStatus: typeof $Enums.IncidentStatus

export type FlagTargetType = $Enums.FlagTargetType

export const FlagTargetType: typeof $Enums.FlagTargetType

export type FlagStatus = $Enums.FlagStatus

export const FlagStatus: typeof $Enums.FlagStatus

export type SuspensionTargetType = $Enums.SuspensionTargetType

export const SuspensionTargetType: typeof $Enums.SuspensionTargetType

export type SuspensionStatus = $Enums.SuspensionStatus

export const SuspensionStatus: typeof $Enums.SuspensionStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Incidents
 * const incidents = await prisma.incident.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Incidents
   * const incidents = await prisma.incident.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.incident`: Exposes CRUD operations for the **Incident** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Incidents
    * const incidents = await prisma.incident.findMany()
    * ```
    */
  get incident(): Prisma.IncidentDelegate<ExtArgs>;

  /**
   * `prisma.flag`: Exposes CRUD operations for the **Flag** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Flags
    * const flags = await prisma.flag.findMany()
    * ```
    */
  get flag(): Prisma.FlagDelegate<ExtArgs>;

  /**
   * `prisma.suspension`: Exposes CRUD operations for the **Suspension** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Suspensions
    * const suspensions = await prisma.suspension.findMany()
    * ```
    */
  get suspension(): Prisma.SuspensionDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Incident: 'Incident',
    Flag: 'Flag',
    Suspension: 'Suspension'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "incident" | "flag" | "suspension"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Incident: {
        payload: Prisma.$IncidentPayload<ExtArgs>
        fields: Prisma.IncidentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IncidentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IncidentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload>
          }
          findFirst: {
            args: Prisma.IncidentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IncidentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload>
          }
          findMany: {
            args: Prisma.IncidentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload>[]
          }
          create: {
            args: Prisma.IncidentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload>
          }
          createMany: {
            args: Prisma.IncidentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IncidentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload>[]
          }
          delete: {
            args: Prisma.IncidentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload>
          }
          update: {
            args: Prisma.IncidentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload>
          }
          deleteMany: {
            args: Prisma.IncidentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IncidentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.IncidentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IncidentPayload>
          }
          aggregate: {
            args: Prisma.IncidentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIncident>
          }
          groupBy: {
            args: Prisma.IncidentGroupByArgs<ExtArgs>
            result: $Utils.Optional<IncidentGroupByOutputType>[]
          }
          count: {
            args: Prisma.IncidentCountArgs<ExtArgs>
            result: $Utils.Optional<IncidentCountAggregateOutputType> | number
          }
        }
      }
      Flag: {
        payload: Prisma.$FlagPayload<ExtArgs>
        fields: Prisma.FlagFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FlagFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FlagFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload>
          }
          findFirst: {
            args: Prisma.FlagFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FlagFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload>
          }
          findMany: {
            args: Prisma.FlagFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload>[]
          }
          create: {
            args: Prisma.FlagCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload>
          }
          createMany: {
            args: Prisma.FlagCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FlagCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload>[]
          }
          delete: {
            args: Prisma.FlagDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload>
          }
          update: {
            args: Prisma.FlagUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload>
          }
          deleteMany: {
            args: Prisma.FlagDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FlagUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FlagUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlagPayload>
          }
          aggregate: {
            args: Prisma.FlagAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFlag>
          }
          groupBy: {
            args: Prisma.FlagGroupByArgs<ExtArgs>
            result: $Utils.Optional<FlagGroupByOutputType>[]
          }
          count: {
            args: Prisma.FlagCountArgs<ExtArgs>
            result: $Utils.Optional<FlagCountAggregateOutputType> | number
          }
        }
      }
      Suspension: {
        payload: Prisma.$SuspensionPayload<ExtArgs>
        fields: Prisma.SuspensionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SuspensionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SuspensionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload>
          }
          findFirst: {
            args: Prisma.SuspensionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SuspensionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload>
          }
          findMany: {
            args: Prisma.SuspensionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload>[]
          }
          create: {
            args: Prisma.SuspensionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload>
          }
          createMany: {
            args: Prisma.SuspensionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SuspensionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload>[]
          }
          delete: {
            args: Prisma.SuspensionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload>
          }
          update: {
            args: Prisma.SuspensionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload>
          }
          deleteMany: {
            args: Prisma.SuspensionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SuspensionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SuspensionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SuspensionPayload>
          }
          aggregate: {
            args: Prisma.SuspensionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSuspension>
          }
          groupBy: {
            args: Prisma.SuspensionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SuspensionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SuspensionCountArgs<ExtArgs>
            result: $Utils.Optional<SuspensionCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Incident
   */

  export type AggregateIncident = {
    _count: IncidentCountAggregateOutputType | null
    _avg: IncidentAvgAggregateOutputType | null
    _sum: IncidentSumAggregateOutputType | null
    _min: IncidentMinAggregateOutputType | null
    _max: IncidentMaxAggregateOutputType | null
  }

  export type IncidentAvgAggregateOutputType = {
    priority: number | null
  }

  export type IncidentSumAggregateOutputType = {
    priority: number | null
  }

  export type IncidentMinAggregateOutputType = {
    id: string | null
    reporterId: string | null
    reportedUserId: string | null
    reportedListingId: string | null
    type: $Enums.IncidentType | null
    description: string | null
    status: $Enums.IncidentStatus | null
    priority: number | null
    createdAt: Date | null
    resolvedAt: Date | null
    resolvedById: string | null
    resolutionNotes: string | null
  }

  export type IncidentMaxAggregateOutputType = {
    id: string | null
    reporterId: string | null
    reportedUserId: string | null
    reportedListingId: string | null
    type: $Enums.IncidentType | null
    description: string | null
    status: $Enums.IncidentStatus | null
    priority: number | null
    createdAt: Date | null
    resolvedAt: Date | null
    resolvedById: string | null
    resolutionNotes: string | null
  }

  export type IncidentCountAggregateOutputType = {
    id: number
    reporterId: number
    reportedUserId: number
    reportedListingId: number
    type: number
    description: number
    status: number
    priority: number
    createdAt: number
    resolvedAt: number
    resolvedById: number
    resolutionNotes: number
    _all: number
  }


  export type IncidentAvgAggregateInputType = {
    priority?: true
  }

  export type IncidentSumAggregateInputType = {
    priority?: true
  }

  export type IncidentMinAggregateInputType = {
    id?: true
    reporterId?: true
    reportedUserId?: true
    reportedListingId?: true
    type?: true
    description?: true
    status?: true
    priority?: true
    createdAt?: true
    resolvedAt?: true
    resolvedById?: true
    resolutionNotes?: true
  }

  export type IncidentMaxAggregateInputType = {
    id?: true
    reporterId?: true
    reportedUserId?: true
    reportedListingId?: true
    type?: true
    description?: true
    status?: true
    priority?: true
    createdAt?: true
    resolvedAt?: true
    resolvedById?: true
    resolutionNotes?: true
  }

  export type IncidentCountAggregateInputType = {
    id?: true
    reporterId?: true
    reportedUserId?: true
    reportedListingId?: true
    type?: true
    description?: true
    status?: true
    priority?: true
    createdAt?: true
    resolvedAt?: true
    resolvedById?: true
    resolutionNotes?: true
    _all?: true
  }

  export type IncidentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Incident to aggregate.
     */
    where?: IncidentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Incidents to fetch.
     */
    orderBy?: IncidentOrderByWithRelationInput | IncidentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IncidentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Incidents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Incidents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Incidents
    **/
    _count?: true | IncidentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: IncidentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: IncidentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IncidentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IncidentMaxAggregateInputType
  }

  export type GetIncidentAggregateType<T extends IncidentAggregateArgs> = {
        [P in keyof T & keyof AggregateIncident]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIncident[P]>
      : GetScalarType<T[P], AggregateIncident[P]>
  }




  export type IncidentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IncidentWhereInput
    orderBy?: IncidentOrderByWithAggregationInput | IncidentOrderByWithAggregationInput[]
    by: IncidentScalarFieldEnum[] | IncidentScalarFieldEnum
    having?: IncidentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IncidentCountAggregateInputType | true
    _avg?: IncidentAvgAggregateInputType
    _sum?: IncidentSumAggregateInputType
    _min?: IncidentMinAggregateInputType
    _max?: IncidentMaxAggregateInputType
  }

  export type IncidentGroupByOutputType = {
    id: string
    reporterId: string
    reportedUserId: string | null
    reportedListingId: string | null
    type: $Enums.IncidentType
    description: string
    status: $Enums.IncidentStatus
    priority: number
    createdAt: Date
    resolvedAt: Date | null
    resolvedById: string | null
    resolutionNotes: string | null
    _count: IncidentCountAggregateOutputType | null
    _avg: IncidentAvgAggregateOutputType | null
    _sum: IncidentSumAggregateOutputType | null
    _min: IncidentMinAggregateOutputType | null
    _max: IncidentMaxAggregateOutputType | null
  }

  type GetIncidentGroupByPayload<T extends IncidentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IncidentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IncidentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IncidentGroupByOutputType[P]>
            : GetScalarType<T[P], IncidentGroupByOutputType[P]>
        }
      >
    >


  export type IncidentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    reporterId?: boolean
    reportedUserId?: boolean
    reportedListingId?: boolean
    type?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    createdAt?: boolean
    resolvedAt?: boolean
    resolvedById?: boolean
    resolutionNotes?: boolean
  }, ExtArgs["result"]["incident"]>

  export type IncidentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    reporterId?: boolean
    reportedUserId?: boolean
    reportedListingId?: boolean
    type?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    createdAt?: boolean
    resolvedAt?: boolean
    resolvedById?: boolean
    resolutionNotes?: boolean
  }, ExtArgs["result"]["incident"]>

  export type IncidentSelectScalar = {
    id?: boolean
    reporterId?: boolean
    reportedUserId?: boolean
    reportedListingId?: boolean
    type?: boolean
    description?: boolean
    status?: boolean
    priority?: boolean
    createdAt?: boolean
    resolvedAt?: boolean
    resolvedById?: boolean
    resolutionNotes?: boolean
  }


  export type $IncidentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Incident"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      reporterId: string
      reportedUserId: string | null
      reportedListingId: string | null
      type: $Enums.IncidentType
      description: string
      status: $Enums.IncidentStatus
      priority: number
      createdAt: Date
      resolvedAt: Date | null
      resolvedById: string | null
      resolutionNotes: string | null
    }, ExtArgs["result"]["incident"]>
    composites: {}
  }

  type IncidentGetPayload<S extends boolean | null | undefined | IncidentDefaultArgs> = $Result.GetResult<Prisma.$IncidentPayload, S>

  type IncidentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<IncidentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: IncidentCountAggregateInputType | true
    }

  export interface IncidentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Incident'], meta: { name: 'Incident' } }
    /**
     * Find zero or one Incident that matches the filter.
     * @param {IncidentFindUniqueArgs} args - Arguments to find a Incident
     * @example
     * // Get one Incident
     * const incident = await prisma.incident.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IncidentFindUniqueArgs>(args: SelectSubset<T, IncidentFindUniqueArgs<ExtArgs>>): Prisma__IncidentClient<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Incident that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {IncidentFindUniqueOrThrowArgs} args - Arguments to find a Incident
     * @example
     * // Get one Incident
     * const incident = await prisma.incident.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IncidentFindUniqueOrThrowArgs>(args: SelectSubset<T, IncidentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IncidentClient<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Incident that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncidentFindFirstArgs} args - Arguments to find a Incident
     * @example
     * // Get one Incident
     * const incident = await prisma.incident.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IncidentFindFirstArgs>(args?: SelectSubset<T, IncidentFindFirstArgs<ExtArgs>>): Prisma__IncidentClient<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Incident that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncidentFindFirstOrThrowArgs} args - Arguments to find a Incident
     * @example
     * // Get one Incident
     * const incident = await prisma.incident.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IncidentFindFirstOrThrowArgs>(args?: SelectSubset<T, IncidentFindFirstOrThrowArgs<ExtArgs>>): Prisma__IncidentClient<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Incidents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncidentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Incidents
     * const incidents = await prisma.incident.findMany()
     * 
     * // Get first 10 Incidents
     * const incidents = await prisma.incident.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const incidentWithIdOnly = await prisma.incident.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IncidentFindManyArgs>(args?: SelectSubset<T, IncidentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Incident.
     * @param {IncidentCreateArgs} args - Arguments to create a Incident.
     * @example
     * // Create one Incident
     * const Incident = await prisma.incident.create({
     *   data: {
     *     // ... data to create a Incident
     *   }
     * })
     * 
     */
    create<T extends IncidentCreateArgs>(args: SelectSubset<T, IncidentCreateArgs<ExtArgs>>): Prisma__IncidentClient<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Incidents.
     * @param {IncidentCreateManyArgs} args - Arguments to create many Incidents.
     * @example
     * // Create many Incidents
     * const incident = await prisma.incident.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IncidentCreateManyArgs>(args?: SelectSubset<T, IncidentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Incidents and returns the data saved in the database.
     * @param {IncidentCreateManyAndReturnArgs} args - Arguments to create many Incidents.
     * @example
     * // Create many Incidents
     * const incident = await prisma.incident.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Incidents and only return the `id`
     * const incidentWithIdOnly = await prisma.incident.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IncidentCreateManyAndReturnArgs>(args?: SelectSubset<T, IncidentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Incident.
     * @param {IncidentDeleteArgs} args - Arguments to delete one Incident.
     * @example
     * // Delete one Incident
     * const Incident = await prisma.incident.delete({
     *   where: {
     *     // ... filter to delete one Incident
     *   }
     * })
     * 
     */
    delete<T extends IncidentDeleteArgs>(args: SelectSubset<T, IncidentDeleteArgs<ExtArgs>>): Prisma__IncidentClient<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Incident.
     * @param {IncidentUpdateArgs} args - Arguments to update one Incident.
     * @example
     * // Update one Incident
     * const incident = await prisma.incident.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IncidentUpdateArgs>(args: SelectSubset<T, IncidentUpdateArgs<ExtArgs>>): Prisma__IncidentClient<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Incidents.
     * @param {IncidentDeleteManyArgs} args - Arguments to filter Incidents to delete.
     * @example
     * // Delete a few Incidents
     * const { count } = await prisma.incident.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IncidentDeleteManyArgs>(args?: SelectSubset<T, IncidentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Incidents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncidentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Incidents
     * const incident = await prisma.incident.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IncidentUpdateManyArgs>(args: SelectSubset<T, IncidentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Incident.
     * @param {IncidentUpsertArgs} args - Arguments to update or create a Incident.
     * @example
     * // Update or create a Incident
     * const incident = await prisma.incident.upsert({
     *   create: {
     *     // ... data to create a Incident
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Incident we want to update
     *   }
     * })
     */
    upsert<T extends IncidentUpsertArgs>(args: SelectSubset<T, IncidentUpsertArgs<ExtArgs>>): Prisma__IncidentClient<$Result.GetResult<Prisma.$IncidentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Incidents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncidentCountArgs} args - Arguments to filter Incidents to count.
     * @example
     * // Count the number of Incidents
     * const count = await prisma.incident.count({
     *   where: {
     *     // ... the filter for the Incidents we want to count
     *   }
     * })
    **/
    count<T extends IncidentCountArgs>(
      args?: Subset<T, IncidentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IncidentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Incident.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncidentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IncidentAggregateArgs>(args: Subset<T, IncidentAggregateArgs>): Prisma.PrismaPromise<GetIncidentAggregateType<T>>

    /**
     * Group by Incident.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncidentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IncidentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IncidentGroupByArgs['orderBy'] }
        : { orderBy?: IncidentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IncidentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIncidentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Incident model
   */
  readonly fields: IncidentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Incident.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IncidentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Incident model
   */ 
  interface IncidentFieldRefs {
    readonly id: FieldRef<"Incident", 'String'>
    readonly reporterId: FieldRef<"Incident", 'String'>
    readonly reportedUserId: FieldRef<"Incident", 'String'>
    readonly reportedListingId: FieldRef<"Incident", 'String'>
    readonly type: FieldRef<"Incident", 'IncidentType'>
    readonly description: FieldRef<"Incident", 'String'>
    readonly status: FieldRef<"Incident", 'IncidentStatus'>
    readonly priority: FieldRef<"Incident", 'Int'>
    readonly createdAt: FieldRef<"Incident", 'DateTime'>
    readonly resolvedAt: FieldRef<"Incident", 'DateTime'>
    readonly resolvedById: FieldRef<"Incident", 'String'>
    readonly resolutionNotes: FieldRef<"Incident", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Incident findUnique
   */
  export type IncidentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
    /**
     * Filter, which Incident to fetch.
     */
    where: IncidentWhereUniqueInput
  }

  /**
   * Incident findUniqueOrThrow
   */
  export type IncidentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
    /**
     * Filter, which Incident to fetch.
     */
    where: IncidentWhereUniqueInput
  }

  /**
   * Incident findFirst
   */
  export type IncidentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
    /**
     * Filter, which Incident to fetch.
     */
    where?: IncidentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Incidents to fetch.
     */
    orderBy?: IncidentOrderByWithRelationInput | IncidentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Incidents.
     */
    cursor?: IncidentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Incidents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Incidents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Incidents.
     */
    distinct?: IncidentScalarFieldEnum | IncidentScalarFieldEnum[]
  }

  /**
   * Incident findFirstOrThrow
   */
  export type IncidentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
    /**
     * Filter, which Incident to fetch.
     */
    where?: IncidentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Incidents to fetch.
     */
    orderBy?: IncidentOrderByWithRelationInput | IncidentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Incidents.
     */
    cursor?: IncidentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Incidents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Incidents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Incidents.
     */
    distinct?: IncidentScalarFieldEnum | IncidentScalarFieldEnum[]
  }

  /**
   * Incident findMany
   */
  export type IncidentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
    /**
     * Filter, which Incidents to fetch.
     */
    where?: IncidentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Incidents to fetch.
     */
    orderBy?: IncidentOrderByWithRelationInput | IncidentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Incidents.
     */
    cursor?: IncidentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Incidents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Incidents.
     */
    skip?: number
    distinct?: IncidentScalarFieldEnum | IncidentScalarFieldEnum[]
  }

  /**
   * Incident create
   */
  export type IncidentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
    /**
     * The data needed to create a Incident.
     */
    data: XOR<IncidentCreateInput, IncidentUncheckedCreateInput>
  }

  /**
   * Incident createMany
   */
  export type IncidentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Incidents.
     */
    data: IncidentCreateManyInput | IncidentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Incident createManyAndReturn
   */
  export type IncidentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Incidents.
     */
    data: IncidentCreateManyInput | IncidentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Incident update
   */
  export type IncidentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
    /**
     * The data needed to update a Incident.
     */
    data: XOR<IncidentUpdateInput, IncidentUncheckedUpdateInput>
    /**
     * Choose, which Incident to update.
     */
    where: IncidentWhereUniqueInput
  }

  /**
   * Incident updateMany
   */
  export type IncidentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Incidents.
     */
    data: XOR<IncidentUpdateManyMutationInput, IncidentUncheckedUpdateManyInput>
    /**
     * Filter which Incidents to update
     */
    where?: IncidentWhereInput
  }

  /**
   * Incident upsert
   */
  export type IncidentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
    /**
     * The filter to search for the Incident to update in case it exists.
     */
    where: IncidentWhereUniqueInput
    /**
     * In case the Incident found by the `where` argument doesn't exist, create a new Incident with this data.
     */
    create: XOR<IncidentCreateInput, IncidentUncheckedCreateInput>
    /**
     * In case the Incident was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IncidentUpdateInput, IncidentUncheckedUpdateInput>
  }

  /**
   * Incident delete
   */
  export type IncidentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
    /**
     * Filter which Incident to delete.
     */
    where: IncidentWhereUniqueInput
  }

  /**
   * Incident deleteMany
   */
  export type IncidentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Incidents to delete
     */
    where?: IncidentWhereInput
  }

  /**
   * Incident without action
   */
  export type IncidentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Incident
     */
    select?: IncidentSelect<ExtArgs> | null
  }


  /**
   * Model Flag
   */

  export type AggregateFlag = {
    _count: FlagCountAggregateOutputType | null
    _min: FlagMinAggregateOutputType | null
    _max: FlagMaxAggregateOutputType | null
  }

  export type FlagMinAggregateOutputType = {
    id: string | null
    flaggerId: string | null
    targetType: $Enums.FlagTargetType | null
    targetId: string | null
    reason: string | null
    status: $Enums.FlagStatus | null
    createdAt: Date | null
    reviewedAt: Date | null
    reviewedById: string | null
  }

  export type FlagMaxAggregateOutputType = {
    id: string | null
    flaggerId: string | null
    targetType: $Enums.FlagTargetType | null
    targetId: string | null
    reason: string | null
    status: $Enums.FlagStatus | null
    createdAt: Date | null
    reviewedAt: Date | null
    reviewedById: string | null
  }

  export type FlagCountAggregateOutputType = {
    id: number
    flaggerId: number
    targetType: number
    targetId: number
    reason: number
    status: number
    createdAt: number
    reviewedAt: number
    reviewedById: number
    _all: number
  }


  export type FlagMinAggregateInputType = {
    id?: true
    flaggerId?: true
    targetType?: true
    targetId?: true
    reason?: true
    status?: true
    createdAt?: true
    reviewedAt?: true
    reviewedById?: true
  }

  export type FlagMaxAggregateInputType = {
    id?: true
    flaggerId?: true
    targetType?: true
    targetId?: true
    reason?: true
    status?: true
    createdAt?: true
    reviewedAt?: true
    reviewedById?: true
  }

  export type FlagCountAggregateInputType = {
    id?: true
    flaggerId?: true
    targetType?: true
    targetId?: true
    reason?: true
    status?: true
    createdAt?: true
    reviewedAt?: true
    reviewedById?: true
    _all?: true
  }

  export type FlagAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Flag to aggregate.
     */
    where?: FlagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Flags to fetch.
     */
    orderBy?: FlagOrderByWithRelationInput | FlagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FlagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Flags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Flags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Flags
    **/
    _count?: true | FlagCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FlagMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FlagMaxAggregateInputType
  }

  export type GetFlagAggregateType<T extends FlagAggregateArgs> = {
        [P in keyof T & keyof AggregateFlag]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFlag[P]>
      : GetScalarType<T[P], AggregateFlag[P]>
  }




  export type FlagGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FlagWhereInput
    orderBy?: FlagOrderByWithAggregationInput | FlagOrderByWithAggregationInput[]
    by: FlagScalarFieldEnum[] | FlagScalarFieldEnum
    having?: FlagScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FlagCountAggregateInputType | true
    _min?: FlagMinAggregateInputType
    _max?: FlagMaxAggregateInputType
  }

  export type FlagGroupByOutputType = {
    id: string
    flaggerId: string
    targetType: $Enums.FlagTargetType
    targetId: string
    reason: string
    status: $Enums.FlagStatus
    createdAt: Date
    reviewedAt: Date | null
    reviewedById: string | null
    _count: FlagCountAggregateOutputType | null
    _min: FlagMinAggregateOutputType | null
    _max: FlagMaxAggregateOutputType | null
  }

  type GetFlagGroupByPayload<T extends FlagGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FlagGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FlagGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FlagGroupByOutputType[P]>
            : GetScalarType<T[P], FlagGroupByOutputType[P]>
        }
      >
    >


  export type FlagSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    flaggerId?: boolean
    targetType?: boolean
    targetId?: boolean
    reason?: boolean
    status?: boolean
    createdAt?: boolean
    reviewedAt?: boolean
    reviewedById?: boolean
  }, ExtArgs["result"]["flag"]>

  export type FlagSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    flaggerId?: boolean
    targetType?: boolean
    targetId?: boolean
    reason?: boolean
    status?: boolean
    createdAt?: boolean
    reviewedAt?: boolean
    reviewedById?: boolean
  }, ExtArgs["result"]["flag"]>

  export type FlagSelectScalar = {
    id?: boolean
    flaggerId?: boolean
    targetType?: boolean
    targetId?: boolean
    reason?: boolean
    status?: boolean
    createdAt?: boolean
    reviewedAt?: boolean
    reviewedById?: boolean
  }


  export type $FlagPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Flag"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      flaggerId: string
      targetType: $Enums.FlagTargetType
      targetId: string
      reason: string
      status: $Enums.FlagStatus
      createdAt: Date
      reviewedAt: Date | null
      reviewedById: string | null
    }, ExtArgs["result"]["flag"]>
    composites: {}
  }

  type FlagGetPayload<S extends boolean | null | undefined | FlagDefaultArgs> = $Result.GetResult<Prisma.$FlagPayload, S>

  type FlagCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<FlagFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: FlagCountAggregateInputType | true
    }

  export interface FlagDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Flag'], meta: { name: 'Flag' } }
    /**
     * Find zero or one Flag that matches the filter.
     * @param {FlagFindUniqueArgs} args - Arguments to find a Flag
     * @example
     * // Get one Flag
     * const flag = await prisma.flag.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FlagFindUniqueArgs>(args: SelectSubset<T, FlagFindUniqueArgs<ExtArgs>>): Prisma__FlagClient<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Flag that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {FlagFindUniqueOrThrowArgs} args - Arguments to find a Flag
     * @example
     * // Get one Flag
     * const flag = await prisma.flag.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FlagFindUniqueOrThrowArgs>(args: SelectSubset<T, FlagFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FlagClient<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Flag that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlagFindFirstArgs} args - Arguments to find a Flag
     * @example
     * // Get one Flag
     * const flag = await prisma.flag.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FlagFindFirstArgs>(args?: SelectSubset<T, FlagFindFirstArgs<ExtArgs>>): Prisma__FlagClient<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Flag that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlagFindFirstOrThrowArgs} args - Arguments to find a Flag
     * @example
     * // Get one Flag
     * const flag = await prisma.flag.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FlagFindFirstOrThrowArgs>(args?: SelectSubset<T, FlagFindFirstOrThrowArgs<ExtArgs>>): Prisma__FlagClient<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Flags that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlagFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Flags
     * const flags = await prisma.flag.findMany()
     * 
     * // Get first 10 Flags
     * const flags = await prisma.flag.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const flagWithIdOnly = await prisma.flag.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FlagFindManyArgs>(args?: SelectSubset<T, FlagFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Flag.
     * @param {FlagCreateArgs} args - Arguments to create a Flag.
     * @example
     * // Create one Flag
     * const Flag = await prisma.flag.create({
     *   data: {
     *     // ... data to create a Flag
     *   }
     * })
     * 
     */
    create<T extends FlagCreateArgs>(args: SelectSubset<T, FlagCreateArgs<ExtArgs>>): Prisma__FlagClient<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Flags.
     * @param {FlagCreateManyArgs} args - Arguments to create many Flags.
     * @example
     * // Create many Flags
     * const flag = await prisma.flag.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FlagCreateManyArgs>(args?: SelectSubset<T, FlagCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Flags and returns the data saved in the database.
     * @param {FlagCreateManyAndReturnArgs} args - Arguments to create many Flags.
     * @example
     * // Create many Flags
     * const flag = await prisma.flag.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Flags and only return the `id`
     * const flagWithIdOnly = await prisma.flag.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FlagCreateManyAndReturnArgs>(args?: SelectSubset<T, FlagCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Flag.
     * @param {FlagDeleteArgs} args - Arguments to delete one Flag.
     * @example
     * // Delete one Flag
     * const Flag = await prisma.flag.delete({
     *   where: {
     *     // ... filter to delete one Flag
     *   }
     * })
     * 
     */
    delete<T extends FlagDeleteArgs>(args: SelectSubset<T, FlagDeleteArgs<ExtArgs>>): Prisma__FlagClient<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Flag.
     * @param {FlagUpdateArgs} args - Arguments to update one Flag.
     * @example
     * // Update one Flag
     * const flag = await prisma.flag.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FlagUpdateArgs>(args: SelectSubset<T, FlagUpdateArgs<ExtArgs>>): Prisma__FlagClient<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Flags.
     * @param {FlagDeleteManyArgs} args - Arguments to filter Flags to delete.
     * @example
     * // Delete a few Flags
     * const { count } = await prisma.flag.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FlagDeleteManyArgs>(args?: SelectSubset<T, FlagDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Flags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlagUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Flags
     * const flag = await prisma.flag.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FlagUpdateManyArgs>(args: SelectSubset<T, FlagUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Flag.
     * @param {FlagUpsertArgs} args - Arguments to update or create a Flag.
     * @example
     * // Update or create a Flag
     * const flag = await prisma.flag.upsert({
     *   create: {
     *     // ... data to create a Flag
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Flag we want to update
     *   }
     * })
     */
    upsert<T extends FlagUpsertArgs>(args: SelectSubset<T, FlagUpsertArgs<ExtArgs>>): Prisma__FlagClient<$Result.GetResult<Prisma.$FlagPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Flags.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlagCountArgs} args - Arguments to filter Flags to count.
     * @example
     * // Count the number of Flags
     * const count = await prisma.flag.count({
     *   where: {
     *     // ... the filter for the Flags we want to count
     *   }
     * })
    **/
    count<T extends FlagCountArgs>(
      args?: Subset<T, FlagCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FlagCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Flag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlagAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FlagAggregateArgs>(args: Subset<T, FlagAggregateArgs>): Prisma.PrismaPromise<GetFlagAggregateType<T>>

    /**
     * Group by Flag.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlagGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FlagGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FlagGroupByArgs['orderBy'] }
        : { orderBy?: FlagGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FlagGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFlagGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Flag model
   */
  readonly fields: FlagFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Flag.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FlagClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Flag model
   */ 
  interface FlagFieldRefs {
    readonly id: FieldRef<"Flag", 'String'>
    readonly flaggerId: FieldRef<"Flag", 'String'>
    readonly targetType: FieldRef<"Flag", 'FlagTargetType'>
    readonly targetId: FieldRef<"Flag", 'String'>
    readonly reason: FieldRef<"Flag", 'String'>
    readonly status: FieldRef<"Flag", 'FlagStatus'>
    readonly createdAt: FieldRef<"Flag", 'DateTime'>
    readonly reviewedAt: FieldRef<"Flag", 'DateTime'>
    readonly reviewedById: FieldRef<"Flag", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Flag findUnique
   */
  export type FlagFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
    /**
     * Filter, which Flag to fetch.
     */
    where: FlagWhereUniqueInput
  }

  /**
   * Flag findUniqueOrThrow
   */
  export type FlagFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
    /**
     * Filter, which Flag to fetch.
     */
    where: FlagWhereUniqueInput
  }

  /**
   * Flag findFirst
   */
  export type FlagFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
    /**
     * Filter, which Flag to fetch.
     */
    where?: FlagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Flags to fetch.
     */
    orderBy?: FlagOrderByWithRelationInput | FlagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Flags.
     */
    cursor?: FlagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Flags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Flags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Flags.
     */
    distinct?: FlagScalarFieldEnum | FlagScalarFieldEnum[]
  }

  /**
   * Flag findFirstOrThrow
   */
  export type FlagFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
    /**
     * Filter, which Flag to fetch.
     */
    where?: FlagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Flags to fetch.
     */
    orderBy?: FlagOrderByWithRelationInput | FlagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Flags.
     */
    cursor?: FlagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Flags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Flags.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Flags.
     */
    distinct?: FlagScalarFieldEnum | FlagScalarFieldEnum[]
  }

  /**
   * Flag findMany
   */
  export type FlagFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
    /**
     * Filter, which Flags to fetch.
     */
    where?: FlagWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Flags to fetch.
     */
    orderBy?: FlagOrderByWithRelationInput | FlagOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Flags.
     */
    cursor?: FlagWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Flags from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Flags.
     */
    skip?: number
    distinct?: FlagScalarFieldEnum | FlagScalarFieldEnum[]
  }

  /**
   * Flag create
   */
  export type FlagCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
    /**
     * The data needed to create a Flag.
     */
    data: XOR<FlagCreateInput, FlagUncheckedCreateInput>
  }

  /**
   * Flag createMany
   */
  export type FlagCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Flags.
     */
    data: FlagCreateManyInput | FlagCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Flag createManyAndReturn
   */
  export type FlagCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Flags.
     */
    data: FlagCreateManyInput | FlagCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Flag update
   */
  export type FlagUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
    /**
     * The data needed to update a Flag.
     */
    data: XOR<FlagUpdateInput, FlagUncheckedUpdateInput>
    /**
     * Choose, which Flag to update.
     */
    where: FlagWhereUniqueInput
  }

  /**
   * Flag updateMany
   */
  export type FlagUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Flags.
     */
    data: XOR<FlagUpdateManyMutationInput, FlagUncheckedUpdateManyInput>
    /**
     * Filter which Flags to update
     */
    where?: FlagWhereInput
  }

  /**
   * Flag upsert
   */
  export type FlagUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
    /**
     * The filter to search for the Flag to update in case it exists.
     */
    where: FlagWhereUniqueInput
    /**
     * In case the Flag found by the `where` argument doesn't exist, create a new Flag with this data.
     */
    create: XOR<FlagCreateInput, FlagUncheckedCreateInput>
    /**
     * In case the Flag was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FlagUpdateInput, FlagUncheckedUpdateInput>
  }

  /**
   * Flag delete
   */
  export type FlagDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
    /**
     * Filter which Flag to delete.
     */
    where: FlagWhereUniqueInput
  }

  /**
   * Flag deleteMany
   */
  export type FlagDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Flags to delete
     */
    where?: FlagWhereInput
  }

  /**
   * Flag without action
   */
  export type FlagDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Flag
     */
    select?: FlagSelect<ExtArgs> | null
  }


  /**
   * Model Suspension
   */

  export type AggregateSuspension = {
    _count: SuspensionCountAggregateOutputType | null
    _min: SuspensionMinAggregateOutputType | null
    _max: SuspensionMaxAggregateOutputType | null
  }

  export type SuspensionMinAggregateOutputType = {
    id: string | null
    targetType: $Enums.SuspensionTargetType | null
    targetId: string | null
    reason: string | null
    status: $Enums.SuspensionStatus | null
    suspendedAt: Date | null
    expiresAt: Date | null
    suspendedById: string | null
    liftedAt: Date | null
    liftedById: string | null
  }

  export type SuspensionMaxAggregateOutputType = {
    id: string | null
    targetType: $Enums.SuspensionTargetType | null
    targetId: string | null
    reason: string | null
    status: $Enums.SuspensionStatus | null
    suspendedAt: Date | null
    expiresAt: Date | null
    suspendedById: string | null
    liftedAt: Date | null
    liftedById: string | null
  }

  export type SuspensionCountAggregateOutputType = {
    id: number
    targetType: number
    targetId: number
    reason: number
    status: number
    suspendedAt: number
    expiresAt: number
    suspendedById: number
    liftedAt: number
    liftedById: number
    _all: number
  }


  export type SuspensionMinAggregateInputType = {
    id?: true
    targetType?: true
    targetId?: true
    reason?: true
    status?: true
    suspendedAt?: true
    expiresAt?: true
    suspendedById?: true
    liftedAt?: true
    liftedById?: true
  }

  export type SuspensionMaxAggregateInputType = {
    id?: true
    targetType?: true
    targetId?: true
    reason?: true
    status?: true
    suspendedAt?: true
    expiresAt?: true
    suspendedById?: true
    liftedAt?: true
    liftedById?: true
  }

  export type SuspensionCountAggregateInputType = {
    id?: true
    targetType?: true
    targetId?: true
    reason?: true
    status?: true
    suspendedAt?: true
    expiresAt?: true
    suspendedById?: true
    liftedAt?: true
    liftedById?: true
    _all?: true
  }

  export type SuspensionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Suspension to aggregate.
     */
    where?: SuspensionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suspensions to fetch.
     */
    orderBy?: SuspensionOrderByWithRelationInput | SuspensionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SuspensionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suspensions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suspensions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Suspensions
    **/
    _count?: true | SuspensionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SuspensionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SuspensionMaxAggregateInputType
  }

  export type GetSuspensionAggregateType<T extends SuspensionAggregateArgs> = {
        [P in keyof T & keyof AggregateSuspension]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSuspension[P]>
      : GetScalarType<T[P], AggregateSuspension[P]>
  }




  export type SuspensionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SuspensionWhereInput
    orderBy?: SuspensionOrderByWithAggregationInput | SuspensionOrderByWithAggregationInput[]
    by: SuspensionScalarFieldEnum[] | SuspensionScalarFieldEnum
    having?: SuspensionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SuspensionCountAggregateInputType | true
    _min?: SuspensionMinAggregateInputType
    _max?: SuspensionMaxAggregateInputType
  }

  export type SuspensionGroupByOutputType = {
    id: string
    targetType: $Enums.SuspensionTargetType
    targetId: string
    reason: string
    status: $Enums.SuspensionStatus
    suspendedAt: Date
    expiresAt: Date | null
    suspendedById: string | null
    liftedAt: Date | null
    liftedById: string | null
    _count: SuspensionCountAggregateOutputType | null
    _min: SuspensionMinAggregateOutputType | null
    _max: SuspensionMaxAggregateOutputType | null
  }

  type GetSuspensionGroupByPayload<T extends SuspensionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SuspensionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SuspensionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SuspensionGroupByOutputType[P]>
            : GetScalarType<T[P], SuspensionGroupByOutputType[P]>
        }
      >
    >


  export type SuspensionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    targetType?: boolean
    targetId?: boolean
    reason?: boolean
    status?: boolean
    suspendedAt?: boolean
    expiresAt?: boolean
    suspendedById?: boolean
    liftedAt?: boolean
    liftedById?: boolean
  }, ExtArgs["result"]["suspension"]>

  export type SuspensionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    targetType?: boolean
    targetId?: boolean
    reason?: boolean
    status?: boolean
    suspendedAt?: boolean
    expiresAt?: boolean
    suspendedById?: boolean
    liftedAt?: boolean
    liftedById?: boolean
  }, ExtArgs["result"]["suspension"]>

  export type SuspensionSelectScalar = {
    id?: boolean
    targetType?: boolean
    targetId?: boolean
    reason?: boolean
    status?: boolean
    suspendedAt?: boolean
    expiresAt?: boolean
    suspendedById?: boolean
    liftedAt?: boolean
    liftedById?: boolean
  }


  export type $SuspensionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Suspension"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      targetType: $Enums.SuspensionTargetType
      targetId: string
      reason: string
      status: $Enums.SuspensionStatus
      suspendedAt: Date
      expiresAt: Date | null
      suspendedById: string | null
      liftedAt: Date | null
      liftedById: string | null
    }, ExtArgs["result"]["suspension"]>
    composites: {}
  }

  type SuspensionGetPayload<S extends boolean | null | undefined | SuspensionDefaultArgs> = $Result.GetResult<Prisma.$SuspensionPayload, S>

  type SuspensionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SuspensionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SuspensionCountAggregateInputType | true
    }

  export interface SuspensionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Suspension'], meta: { name: 'Suspension' } }
    /**
     * Find zero or one Suspension that matches the filter.
     * @param {SuspensionFindUniqueArgs} args - Arguments to find a Suspension
     * @example
     * // Get one Suspension
     * const suspension = await prisma.suspension.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SuspensionFindUniqueArgs>(args: SelectSubset<T, SuspensionFindUniqueArgs<ExtArgs>>): Prisma__SuspensionClient<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Suspension that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SuspensionFindUniqueOrThrowArgs} args - Arguments to find a Suspension
     * @example
     * // Get one Suspension
     * const suspension = await prisma.suspension.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SuspensionFindUniqueOrThrowArgs>(args: SelectSubset<T, SuspensionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SuspensionClient<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Suspension that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuspensionFindFirstArgs} args - Arguments to find a Suspension
     * @example
     * // Get one Suspension
     * const suspension = await prisma.suspension.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SuspensionFindFirstArgs>(args?: SelectSubset<T, SuspensionFindFirstArgs<ExtArgs>>): Prisma__SuspensionClient<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Suspension that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuspensionFindFirstOrThrowArgs} args - Arguments to find a Suspension
     * @example
     * // Get one Suspension
     * const suspension = await prisma.suspension.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SuspensionFindFirstOrThrowArgs>(args?: SelectSubset<T, SuspensionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SuspensionClient<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Suspensions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuspensionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Suspensions
     * const suspensions = await prisma.suspension.findMany()
     * 
     * // Get first 10 Suspensions
     * const suspensions = await prisma.suspension.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const suspensionWithIdOnly = await prisma.suspension.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SuspensionFindManyArgs>(args?: SelectSubset<T, SuspensionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Suspension.
     * @param {SuspensionCreateArgs} args - Arguments to create a Suspension.
     * @example
     * // Create one Suspension
     * const Suspension = await prisma.suspension.create({
     *   data: {
     *     // ... data to create a Suspension
     *   }
     * })
     * 
     */
    create<T extends SuspensionCreateArgs>(args: SelectSubset<T, SuspensionCreateArgs<ExtArgs>>): Prisma__SuspensionClient<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Suspensions.
     * @param {SuspensionCreateManyArgs} args - Arguments to create many Suspensions.
     * @example
     * // Create many Suspensions
     * const suspension = await prisma.suspension.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SuspensionCreateManyArgs>(args?: SelectSubset<T, SuspensionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Suspensions and returns the data saved in the database.
     * @param {SuspensionCreateManyAndReturnArgs} args - Arguments to create many Suspensions.
     * @example
     * // Create many Suspensions
     * const suspension = await prisma.suspension.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Suspensions and only return the `id`
     * const suspensionWithIdOnly = await prisma.suspension.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SuspensionCreateManyAndReturnArgs>(args?: SelectSubset<T, SuspensionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Suspension.
     * @param {SuspensionDeleteArgs} args - Arguments to delete one Suspension.
     * @example
     * // Delete one Suspension
     * const Suspension = await prisma.suspension.delete({
     *   where: {
     *     // ... filter to delete one Suspension
     *   }
     * })
     * 
     */
    delete<T extends SuspensionDeleteArgs>(args: SelectSubset<T, SuspensionDeleteArgs<ExtArgs>>): Prisma__SuspensionClient<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Suspension.
     * @param {SuspensionUpdateArgs} args - Arguments to update one Suspension.
     * @example
     * // Update one Suspension
     * const suspension = await prisma.suspension.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SuspensionUpdateArgs>(args: SelectSubset<T, SuspensionUpdateArgs<ExtArgs>>): Prisma__SuspensionClient<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Suspensions.
     * @param {SuspensionDeleteManyArgs} args - Arguments to filter Suspensions to delete.
     * @example
     * // Delete a few Suspensions
     * const { count } = await prisma.suspension.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SuspensionDeleteManyArgs>(args?: SelectSubset<T, SuspensionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Suspensions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuspensionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Suspensions
     * const suspension = await prisma.suspension.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SuspensionUpdateManyArgs>(args: SelectSubset<T, SuspensionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Suspension.
     * @param {SuspensionUpsertArgs} args - Arguments to update or create a Suspension.
     * @example
     * // Update or create a Suspension
     * const suspension = await prisma.suspension.upsert({
     *   create: {
     *     // ... data to create a Suspension
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Suspension we want to update
     *   }
     * })
     */
    upsert<T extends SuspensionUpsertArgs>(args: SelectSubset<T, SuspensionUpsertArgs<ExtArgs>>): Prisma__SuspensionClient<$Result.GetResult<Prisma.$SuspensionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Suspensions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuspensionCountArgs} args - Arguments to filter Suspensions to count.
     * @example
     * // Count the number of Suspensions
     * const count = await prisma.suspension.count({
     *   where: {
     *     // ... the filter for the Suspensions we want to count
     *   }
     * })
    **/
    count<T extends SuspensionCountArgs>(
      args?: Subset<T, SuspensionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SuspensionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Suspension.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuspensionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SuspensionAggregateArgs>(args: Subset<T, SuspensionAggregateArgs>): Prisma.PrismaPromise<GetSuspensionAggregateType<T>>

    /**
     * Group by Suspension.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SuspensionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SuspensionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SuspensionGroupByArgs['orderBy'] }
        : { orderBy?: SuspensionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SuspensionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSuspensionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Suspension model
   */
  readonly fields: SuspensionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Suspension.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SuspensionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Suspension model
   */ 
  interface SuspensionFieldRefs {
    readonly id: FieldRef<"Suspension", 'String'>
    readonly targetType: FieldRef<"Suspension", 'SuspensionTargetType'>
    readonly targetId: FieldRef<"Suspension", 'String'>
    readonly reason: FieldRef<"Suspension", 'String'>
    readonly status: FieldRef<"Suspension", 'SuspensionStatus'>
    readonly suspendedAt: FieldRef<"Suspension", 'DateTime'>
    readonly expiresAt: FieldRef<"Suspension", 'DateTime'>
    readonly suspendedById: FieldRef<"Suspension", 'String'>
    readonly liftedAt: FieldRef<"Suspension", 'DateTime'>
    readonly liftedById: FieldRef<"Suspension", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Suspension findUnique
   */
  export type SuspensionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
    /**
     * Filter, which Suspension to fetch.
     */
    where: SuspensionWhereUniqueInput
  }

  /**
   * Suspension findUniqueOrThrow
   */
  export type SuspensionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
    /**
     * Filter, which Suspension to fetch.
     */
    where: SuspensionWhereUniqueInput
  }

  /**
   * Suspension findFirst
   */
  export type SuspensionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
    /**
     * Filter, which Suspension to fetch.
     */
    where?: SuspensionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suspensions to fetch.
     */
    orderBy?: SuspensionOrderByWithRelationInput | SuspensionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Suspensions.
     */
    cursor?: SuspensionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suspensions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suspensions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Suspensions.
     */
    distinct?: SuspensionScalarFieldEnum | SuspensionScalarFieldEnum[]
  }

  /**
   * Suspension findFirstOrThrow
   */
  export type SuspensionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
    /**
     * Filter, which Suspension to fetch.
     */
    where?: SuspensionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suspensions to fetch.
     */
    orderBy?: SuspensionOrderByWithRelationInput | SuspensionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Suspensions.
     */
    cursor?: SuspensionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suspensions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suspensions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Suspensions.
     */
    distinct?: SuspensionScalarFieldEnum | SuspensionScalarFieldEnum[]
  }

  /**
   * Suspension findMany
   */
  export type SuspensionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
    /**
     * Filter, which Suspensions to fetch.
     */
    where?: SuspensionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Suspensions to fetch.
     */
    orderBy?: SuspensionOrderByWithRelationInput | SuspensionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Suspensions.
     */
    cursor?: SuspensionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Suspensions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Suspensions.
     */
    skip?: number
    distinct?: SuspensionScalarFieldEnum | SuspensionScalarFieldEnum[]
  }

  /**
   * Suspension create
   */
  export type SuspensionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
    /**
     * The data needed to create a Suspension.
     */
    data: XOR<SuspensionCreateInput, SuspensionUncheckedCreateInput>
  }

  /**
   * Suspension createMany
   */
  export type SuspensionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Suspensions.
     */
    data: SuspensionCreateManyInput | SuspensionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Suspension createManyAndReturn
   */
  export type SuspensionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Suspensions.
     */
    data: SuspensionCreateManyInput | SuspensionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Suspension update
   */
  export type SuspensionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
    /**
     * The data needed to update a Suspension.
     */
    data: XOR<SuspensionUpdateInput, SuspensionUncheckedUpdateInput>
    /**
     * Choose, which Suspension to update.
     */
    where: SuspensionWhereUniqueInput
  }

  /**
   * Suspension updateMany
   */
  export type SuspensionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Suspensions.
     */
    data: XOR<SuspensionUpdateManyMutationInput, SuspensionUncheckedUpdateManyInput>
    /**
     * Filter which Suspensions to update
     */
    where?: SuspensionWhereInput
  }

  /**
   * Suspension upsert
   */
  export type SuspensionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
    /**
     * The filter to search for the Suspension to update in case it exists.
     */
    where: SuspensionWhereUniqueInput
    /**
     * In case the Suspension found by the `where` argument doesn't exist, create a new Suspension with this data.
     */
    create: XOR<SuspensionCreateInput, SuspensionUncheckedCreateInput>
    /**
     * In case the Suspension was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SuspensionUpdateInput, SuspensionUncheckedUpdateInput>
  }

  /**
   * Suspension delete
   */
  export type SuspensionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
    /**
     * Filter which Suspension to delete.
     */
    where: SuspensionWhereUniqueInput
  }

  /**
   * Suspension deleteMany
   */
  export type SuspensionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Suspensions to delete
     */
    where?: SuspensionWhereInput
  }

  /**
   * Suspension without action
   */
  export type SuspensionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Suspension
     */
    select?: SuspensionSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const IncidentScalarFieldEnum: {
    id: 'id',
    reporterId: 'reporterId',
    reportedUserId: 'reportedUserId',
    reportedListingId: 'reportedListingId',
    type: 'type',
    description: 'description',
    status: 'status',
    priority: 'priority',
    createdAt: 'createdAt',
    resolvedAt: 'resolvedAt',
    resolvedById: 'resolvedById',
    resolutionNotes: 'resolutionNotes'
  };

  export type IncidentScalarFieldEnum = (typeof IncidentScalarFieldEnum)[keyof typeof IncidentScalarFieldEnum]


  export const FlagScalarFieldEnum: {
    id: 'id',
    flaggerId: 'flaggerId',
    targetType: 'targetType',
    targetId: 'targetId',
    reason: 'reason',
    status: 'status',
    createdAt: 'createdAt',
    reviewedAt: 'reviewedAt',
    reviewedById: 'reviewedById'
  };

  export type FlagScalarFieldEnum = (typeof FlagScalarFieldEnum)[keyof typeof FlagScalarFieldEnum]


  export const SuspensionScalarFieldEnum: {
    id: 'id',
    targetType: 'targetType',
    targetId: 'targetId',
    reason: 'reason',
    status: 'status',
    suspendedAt: 'suspendedAt',
    expiresAt: 'expiresAt',
    suspendedById: 'suspendedById',
    liftedAt: 'liftedAt',
    liftedById: 'liftedById'
  };

  export type SuspensionScalarFieldEnum = (typeof SuspensionScalarFieldEnum)[keyof typeof SuspensionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'IncidentType'
   */
  export type EnumIncidentTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IncidentType'>
    


  /**
   * Reference to a field of type 'IncidentType[]'
   */
  export type ListEnumIncidentTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IncidentType[]'>
    


  /**
   * Reference to a field of type 'IncidentStatus'
   */
  export type EnumIncidentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IncidentStatus'>
    


  /**
   * Reference to a field of type 'IncidentStatus[]'
   */
  export type ListEnumIncidentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IncidentStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'FlagTargetType'
   */
  export type EnumFlagTargetTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FlagTargetType'>
    


  /**
   * Reference to a field of type 'FlagTargetType[]'
   */
  export type ListEnumFlagTargetTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FlagTargetType[]'>
    


  /**
   * Reference to a field of type 'FlagStatus'
   */
  export type EnumFlagStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FlagStatus'>
    


  /**
   * Reference to a field of type 'FlagStatus[]'
   */
  export type ListEnumFlagStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FlagStatus[]'>
    


  /**
   * Reference to a field of type 'SuspensionTargetType'
   */
  export type EnumSuspensionTargetTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuspensionTargetType'>
    


  /**
   * Reference to a field of type 'SuspensionTargetType[]'
   */
  export type ListEnumSuspensionTargetTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuspensionTargetType[]'>
    


  /**
   * Reference to a field of type 'SuspensionStatus'
   */
  export type EnumSuspensionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuspensionStatus'>
    


  /**
   * Reference to a field of type 'SuspensionStatus[]'
   */
  export type ListEnumSuspensionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SuspensionStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type IncidentWhereInput = {
    AND?: IncidentWhereInput | IncidentWhereInput[]
    OR?: IncidentWhereInput[]
    NOT?: IncidentWhereInput | IncidentWhereInput[]
    id?: StringFilter<"Incident"> | string
    reporterId?: StringFilter<"Incident"> | string
    reportedUserId?: StringNullableFilter<"Incident"> | string | null
    reportedListingId?: StringNullableFilter<"Incident"> | string | null
    type?: EnumIncidentTypeFilter<"Incident"> | $Enums.IncidentType
    description?: StringFilter<"Incident"> | string
    status?: EnumIncidentStatusFilter<"Incident"> | $Enums.IncidentStatus
    priority?: IntFilter<"Incident"> | number
    createdAt?: DateTimeFilter<"Incident"> | Date | string
    resolvedAt?: DateTimeNullableFilter<"Incident"> | Date | string | null
    resolvedById?: StringNullableFilter<"Incident"> | string | null
    resolutionNotes?: StringNullableFilter<"Incident"> | string | null
  }

  export type IncidentOrderByWithRelationInput = {
    id?: SortOrder
    reporterId?: SortOrder
    reportedUserId?: SortOrderInput | SortOrder
    reportedListingId?: SortOrderInput | SortOrder
    type?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    resolvedById?: SortOrderInput | SortOrder
    resolutionNotes?: SortOrderInput | SortOrder
  }

  export type IncidentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: IncidentWhereInput | IncidentWhereInput[]
    OR?: IncidentWhereInput[]
    NOT?: IncidentWhereInput | IncidentWhereInput[]
    reporterId?: StringFilter<"Incident"> | string
    reportedUserId?: StringNullableFilter<"Incident"> | string | null
    reportedListingId?: StringNullableFilter<"Incident"> | string | null
    type?: EnumIncidentTypeFilter<"Incident"> | $Enums.IncidentType
    description?: StringFilter<"Incident"> | string
    status?: EnumIncidentStatusFilter<"Incident"> | $Enums.IncidentStatus
    priority?: IntFilter<"Incident"> | number
    createdAt?: DateTimeFilter<"Incident"> | Date | string
    resolvedAt?: DateTimeNullableFilter<"Incident"> | Date | string | null
    resolvedById?: StringNullableFilter<"Incident"> | string | null
    resolutionNotes?: StringNullableFilter<"Incident"> | string | null
  }, "id">

  export type IncidentOrderByWithAggregationInput = {
    id?: SortOrder
    reporterId?: SortOrder
    reportedUserId?: SortOrderInput | SortOrder
    reportedListingId?: SortOrderInput | SortOrder
    type?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    resolvedById?: SortOrderInput | SortOrder
    resolutionNotes?: SortOrderInput | SortOrder
    _count?: IncidentCountOrderByAggregateInput
    _avg?: IncidentAvgOrderByAggregateInput
    _max?: IncidentMaxOrderByAggregateInput
    _min?: IncidentMinOrderByAggregateInput
    _sum?: IncidentSumOrderByAggregateInput
  }

  export type IncidentScalarWhereWithAggregatesInput = {
    AND?: IncidentScalarWhereWithAggregatesInput | IncidentScalarWhereWithAggregatesInput[]
    OR?: IncidentScalarWhereWithAggregatesInput[]
    NOT?: IncidentScalarWhereWithAggregatesInput | IncidentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Incident"> | string
    reporterId?: StringWithAggregatesFilter<"Incident"> | string
    reportedUserId?: StringNullableWithAggregatesFilter<"Incident"> | string | null
    reportedListingId?: StringNullableWithAggregatesFilter<"Incident"> | string | null
    type?: EnumIncidentTypeWithAggregatesFilter<"Incident"> | $Enums.IncidentType
    description?: StringWithAggregatesFilter<"Incident"> | string
    status?: EnumIncidentStatusWithAggregatesFilter<"Incident"> | $Enums.IncidentStatus
    priority?: IntWithAggregatesFilter<"Incident"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Incident"> | Date | string
    resolvedAt?: DateTimeNullableWithAggregatesFilter<"Incident"> | Date | string | null
    resolvedById?: StringNullableWithAggregatesFilter<"Incident"> | string | null
    resolutionNotes?: StringNullableWithAggregatesFilter<"Incident"> | string | null
  }

  export type FlagWhereInput = {
    AND?: FlagWhereInput | FlagWhereInput[]
    OR?: FlagWhereInput[]
    NOT?: FlagWhereInput | FlagWhereInput[]
    id?: StringFilter<"Flag"> | string
    flaggerId?: StringFilter<"Flag"> | string
    targetType?: EnumFlagTargetTypeFilter<"Flag"> | $Enums.FlagTargetType
    targetId?: StringFilter<"Flag"> | string
    reason?: StringFilter<"Flag"> | string
    status?: EnumFlagStatusFilter<"Flag"> | $Enums.FlagStatus
    createdAt?: DateTimeFilter<"Flag"> | Date | string
    reviewedAt?: DateTimeNullableFilter<"Flag"> | Date | string | null
    reviewedById?: StringNullableFilter<"Flag"> | string | null
  }

  export type FlagOrderByWithRelationInput = {
    id?: SortOrder
    flaggerId?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    reviewedById?: SortOrderInput | SortOrder
  }

  export type FlagWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: FlagWhereInput | FlagWhereInput[]
    OR?: FlagWhereInput[]
    NOT?: FlagWhereInput | FlagWhereInput[]
    flaggerId?: StringFilter<"Flag"> | string
    targetType?: EnumFlagTargetTypeFilter<"Flag"> | $Enums.FlagTargetType
    targetId?: StringFilter<"Flag"> | string
    reason?: StringFilter<"Flag"> | string
    status?: EnumFlagStatusFilter<"Flag"> | $Enums.FlagStatus
    createdAt?: DateTimeFilter<"Flag"> | Date | string
    reviewedAt?: DateTimeNullableFilter<"Flag"> | Date | string | null
    reviewedById?: StringNullableFilter<"Flag"> | string | null
  }, "id">

  export type FlagOrderByWithAggregationInput = {
    id?: SortOrder
    flaggerId?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    reviewedById?: SortOrderInput | SortOrder
    _count?: FlagCountOrderByAggregateInput
    _max?: FlagMaxOrderByAggregateInput
    _min?: FlagMinOrderByAggregateInput
  }

  export type FlagScalarWhereWithAggregatesInput = {
    AND?: FlagScalarWhereWithAggregatesInput | FlagScalarWhereWithAggregatesInput[]
    OR?: FlagScalarWhereWithAggregatesInput[]
    NOT?: FlagScalarWhereWithAggregatesInput | FlagScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Flag"> | string
    flaggerId?: StringWithAggregatesFilter<"Flag"> | string
    targetType?: EnumFlagTargetTypeWithAggregatesFilter<"Flag"> | $Enums.FlagTargetType
    targetId?: StringWithAggregatesFilter<"Flag"> | string
    reason?: StringWithAggregatesFilter<"Flag"> | string
    status?: EnumFlagStatusWithAggregatesFilter<"Flag"> | $Enums.FlagStatus
    createdAt?: DateTimeWithAggregatesFilter<"Flag"> | Date | string
    reviewedAt?: DateTimeNullableWithAggregatesFilter<"Flag"> | Date | string | null
    reviewedById?: StringNullableWithAggregatesFilter<"Flag"> | string | null
  }

  export type SuspensionWhereInput = {
    AND?: SuspensionWhereInput | SuspensionWhereInput[]
    OR?: SuspensionWhereInput[]
    NOT?: SuspensionWhereInput | SuspensionWhereInput[]
    id?: StringFilter<"Suspension"> | string
    targetType?: EnumSuspensionTargetTypeFilter<"Suspension"> | $Enums.SuspensionTargetType
    targetId?: StringFilter<"Suspension"> | string
    reason?: StringFilter<"Suspension"> | string
    status?: EnumSuspensionStatusFilter<"Suspension"> | $Enums.SuspensionStatus
    suspendedAt?: DateTimeFilter<"Suspension"> | Date | string
    expiresAt?: DateTimeNullableFilter<"Suspension"> | Date | string | null
    suspendedById?: StringNullableFilter<"Suspension"> | string | null
    liftedAt?: DateTimeNullableFilter<"Suspension"> | Date | string | null
    liftedById?: StringNullableFilter<"Suspension"> | string | null
  }

  export type SuspensionOrderByWithRelationInput = {
    id?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrderInput | SortOrder
    suspendedById?: SortOrderInput | SortOrder
    liftedAt?: SortOrderInput | SortOrder
    liftedById?: SortOrderInput | SortOrder
  }

  export type SuspensionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SuspensionWhereInput | SuspensionWhereInput[]
    OR?: SuspensionWhereInput[]
    NOT?: SuspensionWhereInput | SuspensionWhereInput[]
    targetType?: EnumSuspensionTargetTypeFilter<"Suspension"> | $Enums.SuspensionTargetType
    targetId?: StringFilter<"Suspension"> | string
    reason?: StringFilter<"Suspension"> | string
    status?: EnumSuspensionStatusFilter<"Suspension"> | $Enums.SuspensionStatus
    suspendedAt?: DateTimeFilter<"Suspension"> | Date | string
    expiresAt?: DateTimeNullableFilter<"Suspension"> | Date | string | null
    suspendedById?: StringNullableFilter<"Suspension"> | string | null
    liftedAt?: DateTimeNullableFilter<"Suspension"> | Date | string | null
    liftedById?: StringNullableFilter<"Suspension"> | string | null
  }, "id">

  export type SuspensionOrderByWithAggregationInput = {
    id?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrderInput | SortOrder
    suspendedById?: SortOrderInput | SortOrder
    liftedAt?: SortOrderInput | SortOrder
    liftedById?: SortOrderInput | SortOrder
    _count?: SuspensionCountOrderByAggregateInput
    _max?: SuspensionMaxOrderByAggregateInput
    _min?: SuspensionMinOrderByAggregateInput
  }

  export type SuspensionScalarWhereWithAggregatesInput = {
    AND?: SuspensionScalarWhereWithAggregatesInput | SuspensionScalarWhereWithAggregatesInput[]
    OR?: SuspensionScalarWhereWithAggregatesInput[]
    NOT?: SuspensionScalarWhereWithAggregatesInput | SuspensionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Suspension"> | string
    targetType?: EnumSuspensionTargetTypeWithAggregatesFilter<"Suspension"> | $Enums.SuspensionTargetType
    targetId?: StringWithAggregatesFilter<"Suspension"> | string
    reason?: StringWithAggregatesFilter<"Suspension"> | string
    status?: EnumSuspensionStatusWithAggregatesFilter<"Suspension"> | $Enums.SuspensionStatus
    suspendedAt?: DateTimeWithAggregatesFilter<"Suspension"> | Date | string
    expiresAt?: DateTimeNullableWithAggregatesFilter<"Suspension"> | Date | string | null
    suspendedById?: StringNullableWithAggregatesFilter<"Suspension"> | string | null
    liftedAt?: DateTimeNullableWithAggregatesFilter<"Suspension"> | Date | string | null
    liftedById?: StringNullableWithAggregatesFilter<"Suspension"> | string | null
  }

  export type IncidentCreateInput = {
    id?: string
    reporterId: string
    reportedUserId?: string | null
    reportedListingId?: string | null
    type: $Enums.IncidentType
    description: string
    status?: $Enums.IncidentStatus
    priority?: number
    createdAt?: Date | string
    resolvedAt?: Date | string | null
    resolvedById?: string | null
    resolutionNotes?: string | null
  }

  export type IncidentUncheckedCreateInput = {
    id?: string
    reporterId: string
    reportedUserId?: string | null
    reportedListingId?: string | null
    type: $Enums.IncidentType
    description: string
    status?: $Enums.IncidentStatus
    priority?: number
    createdAt?: Date | string
    resolvedAt?: Date | string | null
    resolvedById?: string | null
    resolutionNotes?: string | null
  }

  export type IncidentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    reporterId?: StringFieldUpdateOperationsInput | string
    reportedUserId?: NullableStringFieldUpdateOperationsInput | string | null
    reportedListingId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumIncidentTypeFieldUpdateOperationsInput | $Enums.IncidentType
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumIncidentStatusFieldUpdateOperationsInput | $Enums.IncidentStatus
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedById?: NullableStringFieldUpdateOperationsInput | string | null
    resolutionNotes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type IncidentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    reporterId?: StringFieldUpdateOperationsInput | string
    reportedUserId?: NullableStringFieldUpdateOperationsInput | string | null
    reportedListingId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumIncidentTypeFieldUpdateOperationsInput | $Enums.IncidentType
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumIncidentStatusFieldUpdateOperationsInput | $Enums.IncidentStatus
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedById?: NullableStringFieldUpdateOperationsInput | string | null
    resolutionNotes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type IncidentCreateManyInput = {
    id?: string
    reporterId: string
    reportedUserId?: string | null
    reportedListingId?: string | null
    type: $Enums.IncidentType
    description: string
    status?: $Enums.IncidentStatus
    priority?: number
    createdAt?: Date | string
    resolvedAt?: Date | string | null
    resolvedById?: string | null
    resolutionNotes?: string | null
  }

  export type IncidentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    reporterId?: StringFieldUpdateOperationsInput | string
    reportedUserId?: NullableStringFieldUpdateOperationsInput | string | null
    reportedListingId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumIncidentTypeFieldUpdateOperationsInput | $Enums.IncidentType
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumIncidentStatusFieldUpdateOperationsInput | $Enums.IncidentStatus
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedById?: NullableStringFieldUpdateOperationsInput | string | null
    resolutionNotes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type IncidentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    reporterId?: StringFieldUpdateOperationsInput | string
    reportedUserId?: NullableStringFieldUpdateOperationsInput | string | null
    reportedListingId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumIncidentTypeFieldUpdateOperationsInput | $Enums.IncidentType
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumIncidentStatusFieldUpdateOperationsInput | $Enums.IncidentStatus
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedById?: NullableStringFieldUpdateOperationsInput | string | null
    resolutionNotes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FlagCreateInput = {
    id?: string
    flaggerId: string
    targetType: $Enums.FlagTargetType
    targetId: string
    reason: string
    status?: $Enums.FlagStatus
    createdAt?: Date | string
    reviewedAt?: Date | string | null
    reviewedById?: string | null
  }

  export type FlagUncheckedCreateInput = {
    id?: string
    flaggerId: string
    targetType: $Enums.FlagTargetType
    targetId: string
    reason: string
    status?: $Enums.FlagStatus
    createdAt?: Date | string
    reviewedAt?: Date | string | null
    reviewedById?: string | null
  }

  export type FlagUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    flaggerId?: StringFieldUpdateOperationsInput | string
    targetType?: EnumFlagTargetTypeFieldUpdateOperationsInput | $Enums.FlagTargetType
    targetId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumFlagStatusFieldUpdateOperationsInput | $Enums.FlagStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedById?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FlagUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    flaggerId?: StringFieldUpdateOperationsInput | string
    targetType?: EnumFlagTargetTypeFieldUpdateOperationsInput | $Enums.FlagTargetType
    targetId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumFlagStatusFieldUpdateOperationsInput | $Enums.FlagStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedById?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FlagCreateManyInput = {
    id?: string
    flaggerId: string
    targetType: $Enums.FlagTargetType
    targetId: string
    reason: string
    status?: $Enums.FlagStatus
    createdAt?: Date | string
    reviewedAt?: Date | string | null
    reviewedById?: string | null
  }

  export type FlagUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    flaggerId?: StringFieldUpdateOperationsInput | string
    targetType?: EnumFlagTargetTypeFieldUpdateOperationsInput | $Enums.FlagTargetType
    targetId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumFlagStatusFieldUpdateOperationsInput | $Enums.FlagStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedById?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FlagUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    flaggerId?: StringFieldUpdateOperationsInput | string
    targetType?: EnumFlagTargetTypeFieldUpdateOperationsInput | $Enums.FlagTargetType
    targetId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumFlagStatusFieldUpdateOperationsInput | $Enums.FlagStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedById?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SuspensionCreateInput = {
    id?: string
    targetType: $Enums.SuspensionTargetType
    targetId: string
    reason: string
    status?: $Enums.SuspensionStatus
    suspendedAt?: Date | string
    expiresAt?: Date | string | null
    suspendedById?: string | null
    liftedAt?: Date | string | null
    liftedById?: string | null
  }

  export type SuspensionUncheckedCreateInput = {
    id?: string
    targetType: $Enums.SuspensionTargetType
    targetId: string
    reason: string
    status?: $Enums.SuspensionStatus
    suspendedAt?: Date | string
    expiresAt?: Date | string | null
    suspendedById?: string | null
    liftedAt?: Date | string | null
    liftedById?: string | null
  }

  export type SuspensionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetType?: EnumSuspensionTargetTypeFieldUpdateOperationsInput | $Enums.SuspensionTargetType
    targetId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumSuspensionStatusFieldUpdateOperationsInput | $Enums.SuspensionStatus
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspendedById?: NullableStringFieldUpdateOperationsInput | string | null
    liftedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    liftedById?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SuspensionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetType?: EnumSuspensionTargetTypeFieldUpdateOperationsInput | $Enums.SuspensionTargetType
    targetId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumSuspensionStatusFieldUpdateOperationsInput | $Enums.SuspensionStatus
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspendedById?: NullableStringFieldUpdateOperationsInput | string | null
    liftedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    liftedById?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SuspensionCreateManyInput = {
    id?: string
    targetType: $Enums.SuspensionTargetType
    targetId: string
    reason: string
    status?: $Enums.SuspensionStatus
    suspendedAt?: Date | string
    expiresAt?: Date | string | null
    suspendedById?: string | null
    liftedAt?: Date | string | null
    liftedById?: string | null
  }

  export type SuspensionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetType?: EnumSuspensionTargetTypeFieldUpdateOperationsInput | $Enums.SuspensionTargetType
    targetId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumSuspensionStatusFieldUpdateOperationsInput | $Enums.SuspensionStatus
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspendedById?: NullableStringFieldUpdateOperationsInput | string | null
    liftedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    liftedById?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SuspensionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetType?: EnumSuspensionTargetTypeFieldUpdateOperationsInput | $Enums.SuspensionTargetType
    targetId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: EnumSuspensionStatusFieldUpdateOperationsInput | $Enums.SuspensionStatus
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspendedById?: NullableStringFieldUpdateOperationsInput | string | null
    liftedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    liftedById?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumIncidentTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.IncidentType | EnumIncidentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.IncidentType[] | ListEnumIncidentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.IncidentType[] | ListEnumIncidentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumIncidentTypeFilter<$PrismaModel> | $Enums.IncidentType
  }

  export type EnumIncidentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.IncidentStatus | EnumIncidentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IncidentStatus[] | ListEnumIncidentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IncidentStatus[] | ListEnumIncidentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIncidentStatusFilter<$PrismaModel> | $Enums.IncidentStatus
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type IncidentCountOrderByAggregateInput = {
    id?: SortOrder
    reporterId?: SortOrder
    reportedUserId?: SortOrder
    reportedListingId?: SortOrder
    type?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    resolvedAt?: SortOrder
    resolvedById?: SortOrder
    resolutionNotes?: SortOrder
  }

  export type IncidentAvgOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type IncidentMaxOrderByAggregateInput = {
    id?: SortOrder
    reporterId?: SortOrder
    reportedUserId?: SortOrder
    reportedListingId?: SortOrder
    type?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    resolvedAt?: SortOrder
    resolvedById?: SortOrder
    resolutionNotes?: SortOrder
  }

  export type IncidentMinOrderByAggregateInput = {
    id?: SortOrder
    reporterId?: SortOrder
    reportedUserId?: SortOrder
    reportedListingId?: SortOrder
    type?: SortOrder
    description?: SortOrder
    status?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    resolvedAt?: SortOrder
    resolvedById?: SortOrder
    resolutionNotes?: SortOrder
  }

  export type IncidentSumOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumIncidentTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IncidentType | EnumIncidentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.IncidentType[] | ListEnumIncidentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.IncidentType[] | ListEnumIncidentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumIncidentTypeWithAggregatesFilter<$PrismaModel> | $Enums.IncidentType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIncidentTypeFilter<$PrismaModel>
    _max?: NestedEnumIncidentTypeFilter<$PrismaModel>
  }

  export type EnumIncidentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IncidentStatus | EnumIncidentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IncidentStatus[] | ListEnumIncidentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IncidentStatus[] | ListEnumIncidentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIncidentStatusWithAggregatesFilter<$PrismaModel> | $Enums.IncidentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIncidentStatusFilter<$PrismaModel>
    _max?: NestedEnumIncidentStatusFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumFlagTargetTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.FlagTargetType | EnumFlagTargetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FlagTargetType[] | ListEnumFlagTargetTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.FlagTargetType[] | ListEnumFlagTargetTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumFlagTargetTypeFilter<$PrismaModel> | $Enums.FlagTargetType
  }

  export type EnumFlagStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FlagStatus | EnumFlagStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FlagStatus[] | ListEnumFlagStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FlagStatus[] | ListEnumFlagStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFlagStatusFilter<$PrismaModel> | $Enums.FlagStatus
  }

  export type FlagCountOrderByAggregateInput = {
    id?: SortOrder
    flaggerId?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrder
    reviewedById?: SortOrder
  }

  export type FlagMaxOrderByAggregateInput = {
    id?: SortOrder
    flaggerId?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrder
    reviewedById?: SortOrder
  }

  export type FlagMinOrderByAggregateInput = {
    id?: SortOrder
    flaggerId?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    reviewedAt?: SortOrder
    reviewedById?: SortOrder
  }

  export type EnumFlagTargetTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FlagTargetType | EnumFlagTargetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FlagTargetType[] | ListEnumFlagTargetTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.FlagTargetType[] | ListEnumFlagTargetTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumFlagTargetTypeWithAggregatesFilter<$PrismaModel> | $Enums.FlagTargetType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFlagTargetTypeFilter<$PrismaModel>
    _max?: NestedEnumFlagTargetTypeFilter<$PrismaModel>
  }

  export type EnumFlagStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FlagStatus | EnumFlagStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FlagStatus[] | ListEnumFlagStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FlagStatus[] | ListEnumFlagStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFlagStatusWithAggregatesFilter<$PrismaModel> | $Enums.FlagStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFlagStatusFilter<$PrismaModel>
    _max?: NestedEnumFlagStatusFilter<$PrismaModel>
  }

  export type EnumSuspensionTargetTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SuspensionTargetType | EnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SuspensionTargetType[] | ListEnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuspensionTargetType[] | ListEnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSuspensionTargetTypeFilter<$PrismaModel> | $Enums.SuspensionTargetType
  }

  export type EnumSuspensionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SuspensionStatus | EnumSuspensionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SuspensionStatus[] | ListEnumSuspensionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuspensionStatus[] | ListEnumSuspensionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSuspensionStatusFilter<$PrismaModel> | $Enums.SuspensionStatus
  }

  export type SuspensionCountOrderByAggregateInput = {
    id?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrder
    suspendedById?: SortOrder
    liftedAt?: SortOrder
    liftedById?: SortOrder
  }

  export type SuspensionMaxOrderByAggregateInput = {
    id?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrder
    suspendedById?: SortOrder
    liftedAt?: SortOrder
    liftedById?: SortOrder
  }

  export type SuspensionMinOrderByAggregateInput = {
    id?: SortOrder
    targetType?: SortOrder
    targetId?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrder
    suspendedById?: SortOrder
    liftedAt?: SortOrder
    liftedById?: SortOrder
  }

  export type EnumSuspensionTargetTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SuspensionTargetType | EnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SuspensionTargetType[] | ListEnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuspensionTargetType[] | ListEnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSuspensionTargetTypeWithAggregatesFilter<$PrismaModel> | $Enums.SuspensionTargetType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSuspensionTargetTypeFilter<$PrismaModel>
    _max?: NestedEnumSuspensionTargetTypeFilter<$PrismaModel>
  }

  export type EnumSuspensionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SuspensionStatus | EnumSuspensionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SuspensionStatus[] | ListEnumSuspensionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuspensionStatus[] | ListEnumSuspensionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSuspensionStatusWithAggregatesFilter<$PrismaModel> | $Enums.SuspensionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSuspensionStatusFilter<$PrismaModel>
    _max?: NestedEnumSuspensionStatusFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumIncidentTypeFieldUpdateOperationsInput = {
    set?: $Enums.IncidentType
  }

  export type EnumIncidentStatusFieldUpdateOperationsInput = {
    set?: $Enums.IncidentStatus
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type EnumFlagTargetTypeFieldUpdateOperationsInput = {
    set?: $Enums.FlagTargetType
  }

  export type EnumFlagStatusFieldUpdateOperationsInput = {
    set?: $Enums.FlagStatus
  }

  export type EnumSuspensionTargetTypeFieldUpdateOperationsInput = {
    set?: $Enums.SuspensionTargetType
  }

  export type EnumSuspensionStatusFieldUpdateOperationsInput = {
    set?: $Enums.SuspensionStatus
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumIncidentTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.IncidentType | EnumIncidentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.IncidentType[] | ListEnumIncidentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.IncidentType[] | ListEnumIncidentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumIncidentTypeFilter<$PrismaModel> | $Enums.IncidentType
  }

  export type NestedEnumIncidentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.IncidentStatus | EnumIncidentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IncidentStatus[] | ListEnumIncidentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IncidentStatus[] | ListEnumIncidentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIncidentStatusFilter<$PrismaModel> | $Enums.IncidentStatus
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumIncidentTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IncidentType | EnumIncidentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.IncidentType[] | ListEnumIncidentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.IncidentType[] | ListEnumIncidentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumIncidentTypeWithAggregatesFilter<$PrismaModel> | $Enums.IncidentType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIncidentTypeFilter<$PrismaModel>
    _max?: NestedEnumIncidentTypeFilter<$PrismaModel>
  }

  export type NestedEnumIncidentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IncidentStatus | EnumIncidentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IncidentStatus[] | ListEnumIncidentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IncidentStatus[] | ListEnumIncidentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIncidentStatusWithAggregatesFilter<$PrismaModel> | $Enums.IncidentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIncidentStatusFilter<$PrismaModel>
    _max?: NestedEnumIncidentStatusFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumFlagTargetTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.FlagTargetType | EnumFlagTargetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FlagTargetType[] | ListEnumFlagTargetTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.FlagTargetType[] | ListEnumFlagTargetTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumFlagTargetTypeFilter<$PrismaModel> | $Enums.FlagTargetType
  }

  export type NestedEnumFlagStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FlagStatus | EnumFlagStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FlagStatus[] | ListEnumFlagStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FlagStatus[] | ListEnumFlagStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFlagStatusFilter<$PrismaModel> | $Enums.FlagStatus
  }

  export type NestedEnumFlagTargetTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FlagTargetType | EnumFlagTargetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FlagTargetType[] | ListEnumFlagTargetTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.FlagTargetType[] | ListEnumFlagTargetTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumFlagTargetTypeWithAggregatesFilter<$PrismaModel> | $Enums.FlagTargetType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFlagTargetTypeFilter<$PrismaModel>
    _max?: NestedEnumFlagTargetTypeFilter<$PrismaModel>
  }

  export type NestedEnumFlagStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FlagStatus | EnumFlagStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FlagStatus[] | ListEnumFlagStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FlagStatus[] | ListEnumFlagStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFlagStatusWithAggregatesFilter<$PrismaModel> | $Enums.FlagStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFlagStatusFilter<$PrismaModel>
    _max?: NestedEnumFlagStatusFilter<$PrismaModel>
  }

  export type NestedEnumSuspensionTargetTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SuspensionTargetType | EnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SuspensionTargetType[] | ListEnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuspensionTargetType[] | ListEnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSuspensionTargetTypeFilter<$PrismaModel> | $Enums.SuspensionTargetType
  }

  export type NestedEnumSuspensionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SuspensionStatus | EnumSuspensionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SuspensionStatus[] | ListEnumSuspensionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuspensionStatus[] | ListEnumSuspensionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSuspensionStatusFilter<$PrismaModel> | $Enums.SuspensionStatus
  }

  export type NestedEnumSuspensionTargetTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SuspensionTargetType | EnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SuspensionTargetType[] | ListEnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuspensionTargetType[] | ListEnumSuspensionTargetTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSuspensionTargetTypeWithAggregatesFilter<$PrismaModel> | $Enums.SuspensionTargetType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSuspensionTargetTypeFilter<$PrismaModel>
    _max?: NestedEnumSuspensionTargetTypeFilter<$PrismaModel>
  }

  export type NestedEnumSuspensionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SuspensionStatus | EnumSuspensionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SuspensionStatus[] | ListEnumSuspensionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SuspensionStatus[] | ListEnumSuspensionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSuspensionStatusWithAggregatesFilter<$PrismaModel> | $Enums.SuspensionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSuspensionStatusFilter<$PrismaModel>
    _max?: NestedEnumSuspensionStatusFilter<$PrismaModel>
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use IncidentDefaultArgs instead
     */
    export type IncidentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = IncidentDefaultArgs<ExtArgs>
    /**
     * @deprecated Use FlagDefaultArgs instead
     */
    export type FlagArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = FlagDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SuspensionDefaultArgs instead
     */
    export type SuspensionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SuspensionDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}