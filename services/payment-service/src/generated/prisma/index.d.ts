
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
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model ShortTermListing
 * 
 */
export type ShortTermListing = $Result.DefaultSelection<Prisma.$ShortTermListingPayload>
/**
 * Model Booking
 * 
 */
export type Booking = $Result.DefaultSelection<Prisma.$BookingPayload>
/**
 * Model Payment
 * 
 */
export type Payment = $Result.DefaultSelection<Prisma.$PaymentPayload>
/**
 * Model PaymentIntent
 * 
 */
export type PaymentIntent = $Result.DefaultSelection<Prisma.$PaymentIntentPayload>
/**
 * Model Transaction
 * 
 */
export type Transaction = $Result.DefaultSelection<Prisma.$TransactionPayload>
/**
 * Model Payout
 * 
 */
export type Payout = $Result.DefaultSelection<Prisma.$PayoutPayload>
/**
 * Model PayoutPayment
 * 
 */
export type PayoutPayment = $Result.DefaultSelection<Prisma.$PayoutPaymentPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const PlatformRole: {
  USER: 'USER',
  LICENSED_PROFESSIONAL: 'LICENSED_PROFESSIONAL',
  OWNER_HOST: 'OWNER_HOST',
  INVESTOR: 'INVESTOR'
};

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole]


export const VerificationStatus: {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus]


export const BookingStatus: {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
};

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]


export const PaymentStatus: {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]


export const IntentStatus: {
  CREATED: 'CREATED',
  HELD: 'HELD',
  CAPTURED: 'CAPTURED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

export type IntentStatus = (typeof IntentStatus)[keyof typeof IntentStatus]


export const TransactionType: {
  INTENT_CREATED: 'INTENT_CREATED',
  INTENT_HELD: 'INTENT_HELD',
  CAPTURED: 'CAPTURED',
  REFUNDED: 'REFUNDED',
  PAYOUT_PREPARED: 'PAYOUT_PREPARED',
  PAYOUT_SENT: 'PAYOUT_SENT'
};

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]


export const PayoutStatus: {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus]

}

export type PlatformRole = $Enums.PlatformRole

export const PlatformRole: typeof $Enums.PlatformRole

export type VerificationStatus = $Enums.VerificationStatus

export const VerificationStatus: typeof $Enums.VerificationStatus

export type BookingStatus = $Enums.BookingStatus

export const BookingStatus: typeof $Enums.BookingStatus

export type PaymentStatus = $Enums.PaymentStatus

export const PaymentStatus: typeof $Enums.PaymentStatus

export type IntentStatus = $Enums.IntentStatus

export const IntentStatus: typeof $Enums.IntentStatus

export type TransactionType = $Enums.TransactionType

export const TransactionType: typeof $Enums.TransactionType

export type PayoutStatus = $Enums.PayoutStatus

export const PayoutStatus: typeof $Enums.PayoutStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
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
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
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
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.shortTermListing`: Exposes CRUD operations for the **ShortTermListing** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ShortTermListings
    * const shortTermListings = await prisma.shortTermListing.findMany()
    * ```
    */
  get shortTermListing(): Prisma.ShortTermListingDelegate<ExtArgs>;

  /**
   * `prisma.booking`: Exposes CRUD operations for the **Booking** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Bookings
    * const bookings = await prisma.booking.findMany()
    * ```
    */
  get booking(): Prisma.BookingDelegate<ExtArgs>;

  /**
   * `prisma.payment`: Exposes CRUD operations for the **Payment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Payments
    * const payments = await prisma.payment.findMany()
    * ```
    */
  get payment(): Prisma.PaymentDelegate<ExtArgs>;

  /**
   * `prisma.paymentIntent`: Exposes CRUD operations for the **PaymentIntent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PaymentIntents
    * const paymentIntents = await prisma.paymentIntent.findMany()
    * ```
    */
  get paymentIntent(): Prisma.PaymentIntentDelegate<ExtArgs>;

  /**
   * `prisma.transaction`: Exposes CRUD operations for the **Transaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Transactions
    * const transactions = await prisma.transaction.findMany()
    * ```
    */
  get transaction(): Prisma.TransactionDelegate<ExtArgs>;

  /**
   * `prisma.payout`: Exposes CRUD operations for the **Payout** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Payouts
    * const payouts = await prisma.payout.findMany()
    * ```
    */
  get payout(): Prisma.PayoutDelegate<ExtArgs>;

  /**
   * `prisma.payoutPayment`: Exposes CRUD operations for the **PayoutPayment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PayoutPayments
    * const payoutPayments = await prisma.payoutPayment.findMany()
    * ```
    */
  get payoutPayment(): Prisma.PayoutPaymentDelegate<ExtArgs>;
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
    User: 'User',
    ShortTermListing: 'ShortTermListing',
    Booking: 'Booking',
    Payment: 'Payment',
    PaymentIntent: 'PaymentIntent',
    Transaction: 'Transaction',
    Payout: 'Payout',
    PayoutPayment: 'PayoutPayment'
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
      modelProps: "user" | "shortTermListing" | "booking" | "payment" | "paymentIntent" | "transaction" | "payout" | "payoutPayment"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      ShortTermListing: {
        payload: Prisma.$ShortTermListingPayload<ExtArgs>
        fields: Prisma.ShortTermListingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ShortTermListingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ShortTermListingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload>
          }
          findFirst: {
            args: Prisma.ShortTermListingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ShortTermListingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload>
          }
          findMany: {
            args: Prisma.ShortTermListingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload>[]
          }
          create: {
            args: Prisma.ShortTermListingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload>
          }
          createMany: {
            args: Prisma.ShortTermListingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ShortTermListingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload>[]
          }
          delete: {
            args: Prisma.ShortTermListingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload>
          }
          update: {
            args: Prisma.ShortTermListingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload>
          }
          deleteMany: {
            args: Prisma.ShortTermListingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ShortTermListingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ShortTermListingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortTermListingPayload>
          }
          aggregate: {
            args: Prisma.ShortTermListingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateShortTermListing>
          }
          groupBy: {
            args: Prisma.ShortTermListingGroupByArgs<ExtArgs>
            result: $Utils.Optional<ShortTermListingGroupByOutputType>[]
          }
          count: {
            args: Prisma.ShortTermListingCountArgs<ExtArgs>
            result: $Utils.Optional<ShortTermListingCountAggregateOutputType> | number
          }
        }
      }
      Booking: {
        payload: Prisma.$BookingPayload<ExtArgs>
        fields: Prisma.BookingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BookingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BookingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findFirst: {
            args: Prisma.BookingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BookingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findMany: {
            args: Prisma.BookingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          create: {
            args: Prisma.BookingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          createMany: {
            args: Prisma.BookingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BookingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          delete: {
            args: Prisma.BookingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          update: {
            args: Prisma.BookingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          deleteMany: {
            args: Prisma.BookingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BookingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BookingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          aggregate: {
            args: Prisma.BookingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBooking>
          }
          groupBy: {
            args: Prisma.BookingGroupByArgs<ExtArgs>
            result: $Utils.Optional<BookingGroupByOutputType>[]
          }
          count: {
            args: Prisma.BookingCountArgs<ExtArgs>
            result: $Utils.Optional<BookingCountAggregateOutputType> | number
          }
        }
      }
      Payment: {
        payload: Prisma.$PaymentPayload<ExtArgs>
        fields: Prisma.PaymentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PaymentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PaymentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findFirst: {
            args: Prisma.PaymentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PaymentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findMany: {
            args: Prisma.PaymentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          create: {
            args: Prisma.PaymentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          createMany: {
            args: Prisma.PaymentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PaymentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          delete: {
            args: Prisma.PaymentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          update: {
            args: Prisma.PaymentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          deleteMany: {
            args: Prisma.PaymentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PaymentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PaymentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          aggregate: {
            args: Prisma.PaymentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayment>
          }
          groupBy: {
            args: Prisma.PaymentGroupByArgs<ExtArgs>
            result: $Utils.Optional<PaymentGroupByOutputType>[]
          }
          count: {
            args: Prisma.PaymentCountArgs<ExtArgs>
            result: $Utils.Optional<PaymentCountAggregateOutputType> | number
          }
        }
      }
      PaymentIntent: {
        payload: Prisma.$PaymentIntentPayload<ExtArgs>
        fields: Prisma.PaymentIntentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PaymentIntentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PaymentIntentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload>
          }
          findFirst: {
            args: Prisma.PaymentIntentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PaymentIntentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload>
          }
          findMany: {
            args: Prisma.PaymentIntentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload>[]
          }
          create: {
            args: Prisma.PaymentIntentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload>
          }
          createMany: {
            args: Prisma.PaymentIntentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PaymentIntentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload>[]
          }
          delete: {
            args: Prisma.PaymentIntentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload>
          }
          update: {
            args: Prisma.PaymentIntentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload>
          }
          deleteMany: {
            args: Prisma.PaymentIntentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PaymentIntentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PaymentIntentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIntentPayload>
          }
          aggregate: {
            args: Prisma.PaymentIntentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePaymentIntent>
          }
          groupBy: {
            args: Prisma.PaymentIntentGroupByArgs<ExtArgs>
            result: $Utils.Optional<PaymentIntentGroupByOutputType>[]
          }
          count: {
            args: Prisma.PaymentIntentCountArgs<ExtArgs>
            result: $Utils.Optional<PaymentIntentCountAggregateOutputType> | number
          }
        }
      }
      Transaction: {
        payload: Prisma.$TransactionPayload<ExtArgs>
        fields: Prisma.TransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findFirst: {
            args: Prisma.TransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findMany: {
            args: Prisma.TransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          create: {
            args: Prisma.TransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          createMany: {
            args: Prisma.TransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          delete: {
            args: Prisma.TransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          update: {
            args: Prisma.TransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          deleteMany: {
            args: Prisma.TransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          aggregate: {
            args: Prisma.TransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTransaction>
          }
          groupBy: {
            args: Prisma.TransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<TransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.TransactionCountArgs<ExtArgs>
            result: $Utils.Optional<TransactionCountAggregateOutputType> | number
          }
        }
      }
      Payout: {
        payload: Prisma.$PayoutPayload<ExtArgs>
        fields: Prisma.PayoutFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PayoutFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PayoutFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          findFirst: {
            args: Prisma.PayoutFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PayoutFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          findMany: {
            args: Prisma.PayoutFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>[]
          }
          create: {
            args: Prisma.PayoutCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          createMany: {
            args: Prisma.PayoutCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PayoutCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>[]
          }
          delete: {
            args: Prisma.PayoutDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          update: {
            args: Prisma.PayoutUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          deleteMany: {
            args: Prisma.PayoutDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PayoutUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PayoutUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          aggregate: {
            args: Prisma.PayoutAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayout>
          }
          groupBy: {
            args: Prisma.PayoutGroupByArgs<ExtArgs>
            result: $Utils.Optional<PayoutGroupByOutputType>[]
          }
          count: {
            args: Prisma.PayoutCountArgs<ExtArgs>
            result: $Utils.Optional<PayoutCountAggregateOutputType> | number
          }
        }
      }
      PayoutPayment: {
        payload: Prisma.$PayoutPaymentPayload<ExtArgs>
        fields: Prisma.PayoutPaymentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PayoutPaymentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PayoutPaymentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload>
          }
          findFirst: {
            args: Prisma.PayoutPaymentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PayoutPaymentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload>
          }
          findMany: {
            args: Prisma.PayoutPaymentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload>[]
          }
          create: {
            args: Prisma.PayoutPaymentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload>
          }
          createMany: {
            args: Prisma.PayoutPaymentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PayoutPaymentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload>[]
          }
          delete: {
            args: Prisma.PayoutPaymentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload>
          }
          update: {
            args: Prisma.PayoutPaymentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload>
          }
          deleteMany: {
            args: Prisma.PayoutPaymentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PayoutPaymentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PayoutPaymentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPaymentPayload>
          }
          aggregate: {
            args: Prisma.PayoutPaymentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayoutPayment>
          }
          groupBy: {
            args: Prisma.PayoutPaymentGroupByArgs<ExtArgs>
            result: $Utils.Optional<PayoutPaymentGroupByOutputType>[]
          }
          count: {
            args: Prisma.PayoutPaymentCountArgs<ExtArgs>
            result: $Utils.Optional<PayoutPaymentCountAggregateOutputType> | number
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
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    shortTermListings: number
    bookingsAsGuest: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shortTermListings?: boolean | UserCountOutputTypeCountShortTermListingsArgs
    bookingsAsGuest?: boolean | UserCountOutputTypeCountBookingsAsGuestArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountShortTermListingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ShortTermListingWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountBookingsAsGuestArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
  }


  /**
   * Count Type ShortTermListingCountOutputType
   */

  export type ShortTermListingCountOutputType = {
    bookings: number
  }

  export type ShortTermListingCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    bookings?: boolean | ShortTermListingCountOutputTypeCountBookingsArgs
  }

  // Custom InputTypes
  /**
   * ShortTermListingCountOutputType without action
   */
  export type ShortTermListingCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListingCountOutputType
     */
    select?: ShortTermListingCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ShortTermListingCountOutputType without action
   */
  export type ShortTermListingCountOutputTypeCountBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
  }


  /**
   * Count Type PaymentCountOutputType
   */

  export type PaymentCountOutputType = {
    transactions: number
    payoutPayments: number
  }

  export type PaymentCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | PaymentCountOutputTypeCountTransactionsArgs
    payoutPayments?: boolean | PaymentCountOutputTypeCountPayoutPaymentsArgs
  }

  // Custom InputTypes
  /**
   * PaymentCountOutputType without action
   */
  export type PaymentCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentCountOutputType
     */
    select?: PaymentCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PaymentCountOutputType without action
   */
  export type PaymentCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }

  /**
   * PaymentCountOutputType without action
   */
  export type PaymentCountOutputTypeCountPayoutPaymentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PayoutPaymentWhereInput
  }


  /**
   * Count Type PayoutCountOutputType
   */

  export type PayoutCountOutputType = {
    payments: number
    transactions: number
  }

  export type PayoutCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payments?: boolean | PayoutCountOutputTypeCountPaymentsArgs
    transactions?: boolean | PayoutCountOutputTypeCountTransactionsArgs
  }

  // Custom InputTypes
  /**
   * PayoutCountOutputType without action
   */
  export type PayoutCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutCountOutputType
     */
    select?: PayoutCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PayoutCountOutputType without action
   */
  export type PayoutCountOutputTypeCountPaymentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PayoutPaymentWhereInput
  }

  /**
   * PayoutCountOutputType without action
   */
  export type PayoutCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    role: $Enums.PlatformRole | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    role: $Enums.PlatformRole | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    role: number
    name: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    role?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    role?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    role?: true
    name?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    role: $Enums.PlatformRole
    name: string | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    role?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shortTermListings?: boolean | User$shortTermListingsArgs<ExtArgs>
    bookingsAsGuest?: boolean | User$bookingsAsGuestArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    role?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    role?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shortTermListings?: boolean | User$shortTermListingsArgs<ExtArgs>
    bookingsAsGuest?: boolean | User$bookingsAsGuestArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      shortTermListings: Prisma.$ShortTermListingPayload<ExtArgs>[]
      bookingsAsGuest: Prisma.$BookingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      role: $Enums.PlatformRole
      name: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
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
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    shortTermListings<T extends User$shortTermListingsArgs<ExtArgs> = {}>(args?: Subset<T, User$shortTermListingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "findMany"> | Null>
    bookingsAsGuest<T extends User$bookingsAsGuestArgs<ExtArgs> = {}>(args?: Subset<T, User$bookingsAsGuestArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'PlatformRole'>
    readonly name: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.shortTermListings
   */
  export type User$shortTermListingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    where?: ShortTermListingWhereInput
    orderBy?: ShortTermListingOrderByWithRelationInput | ShortTermListingOrderByWithRelationInput[]
    cursor?: ShortTermListingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ShortTermListingScalarFieldEnum | ShortTermListingScalarFieldEnum[]
  }

  /**
   * User.bookingsAsGuest
   */
  export type User$bookingsAsGuestArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    cursor?: BookingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model ShortTermListing
   */

  export type AggregateShortTermListing = {
    _count: ShortTermListingCountAggregateOutputType | null
    _avg: ShortTermListingAvgAggregateOutputType | null
    _sum: ShortTermListingSumAggregateOutputType | null
    _min: ShortTermListingMinAggregateOutputType | null
    _max: ShortTermListingMaxAggregateOutputType | null
  }

  export type ShortTermListingAvgAggregateOutputType = {
    latitude: number | null
    longitude: number | null
    nightPriceCents: number | null
    beds: number | null
    baths: number | null
    maxGuests: number | null
  }

  export type ShortTermListingSumAggregateOutputType = {
    latitude: number | null
    longitude: number | null
    nightPriceCents: number | null
    beds: number | null
    baths: number | null
    maxGuests: number | null
  }

  export type ShortTermListingMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    address: string | null
    city: string | null
    country: string | null
    latitude: number | null
    longitude: number | null
    nightPriceCents: number | null
    beds: number | null
    baths: number | null
    maxGuests: number | null
    verificationStatus: $Enums.VerificationStatus | null
    cadastreNumber: string | null
    verificationDocUrl: string | null
    verifiedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    ownerId: string | null
  }

  export type ShortTermListingMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    address: string | null
    city: string | null
    country: string | null
    latitude: number | null
    longitude: number | null
    nightPriceCents: number | null
    beds: number | null
    baths: number | null
    maxGuests: number | null
    verificationStatus: $Enums.VerificationStatus | null
    cadastreNumber: string | null
    verificationDocUrl: string | null
    verifiedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    ownerId: string | null
  }

  export type ShortTermListingCountAggregateOutputType = {
    id: number
    title: number
    description: number
    address: number
    city: number
    country: number
    latitude: number
    longitude: number
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests: number
    photos: number
    verificationStatus: number
    cadastreNumber: number
    verificationDocUrl: number
    verifiedAt: number
    createdAt: number
    updatedAt: number
    ownerId: number
    _all: number
  }


  export type ShortTermListingAvgAggregateInputType = {
    latitude?: true
    longitude?: true
    nightPriceCents?: true
    beds?: true
    baths?: true
    maxGuests?: true
  }

  export type ShortTermListingSumAggregateInputType = {
    latitude?: true
    longitude?: true
    nightPriceCents?: true
    beds?: true
    baths?: true
    maxGuests?: true
  }

  export type ShortTermListingMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    address?: true
    city?: true
    country?: true
    latitude?: true
    longitude?: true
    nightPriceCents?: true
    beds?: true
    baths?: true
    maxGuests?: true
    verificationStatus?: true
    cadastreNumber?: true
    verificationDocUrl?: true
    verifiedAt?: true
    createdAt?: true
    updatedAt?: true
    ownerId?: true
  }

  export type ShortTermListingMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    address?: true
    city?: true
    country?: true
    latitude?: true
    longitude?: true
    nightPriceCents?: true
    beds?: true
    baths?: true
    maxGuests?: true
    verificationStatus?: true
    cadastreNumber?: true
    verificationDocUrl?: true
    verifiedAt?: true
    createdAt?: true
    updatedAt?: true
    ownerId?: true
  }

  export type ShortTermListingCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    address?: true
    city?: true
    country?: true
    latitude?: true
    longitude?: true
    nightPriceCents?: true
    beds?: true
    baths?: true
    maxGuests?: true
    photos?: true
    verificationStatus?: true
    cadastreNumber?: true
    verificationDocUrl?: true
    verifiedAt?: true
    createdAt?: true
    updatedAt?: true
    ownerId?: true
    _all?: true
  }

  export type ShortTermListingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ShortTermListing to aggregate.
     */
    where?: ShortTermListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortTermListings to fetch.
     */
    orderBy?: ShortTermListingOrderByWithRelationInput | ShortTermListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ShortTermListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortTermListings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortTermListings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ShortTermListings
    **/
    _count?: true | ShortTermListingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ShortTermListingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ShortTermListingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ShortTermListingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ShortTermListingMaxAggregateInputType
  }

  export type GetShortTermListingAggregateType<T extends ShortTermListingAggregateArgs> = {
        [P in keyof T & keyof AggregateShortTermListing]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateShortTermListing[P]>
      : GetScalarType<T[P], AggregateShortTermListing[P]>
  }




  export type ShortTermListingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ShortTermListingWhereInput
    orderBy?: ShortTermListingOrderByWithAggregationInput | ShortTermListingOrderByWithAggregationInput[]
    by: ShortTermListingScalarFieldEnum[] | ShortTermListingScalarFieldEnum
    having?: ShortTermListingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ShortTermListingCountAggregateInputType | true
    _avg?: ShortTermListingAvgAggregateInputType
    _sum?: ShortTermListingSumAggregateInputType
    _min?: ShortTermListingMinAggregateInputType
    _max?: ShortTermListingMaxAggregateInputType
  }

  export type ShortTermListingGroupByOutputType = {
    id: string
    title: string
    description: string | null
    address: string
    city: string
    country: string
    latitude: number | null
    longitude: number | null
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests: number
    photos: string[]
    verificationStatus: $Enums.VerificationStatus
    cadastreNumber: string | null
    verificationDocUrl: string | null
    verifiedAt: Date | null
    createdAt: Date
    updatedAt: Date
    ownerId: string
    _count: ShortTermListingCountAggregateOutputType | null
    _avg: ShortTermListingAvgAggregateOutputType | null
    _sum: ShortTermListingSumAggregateOutputType | null
    _min: ShortTermListingMinAggregateOutputType | null
    _max: ShortTermListingMaxAggregateOutputType | null
  }

  type GetShortTermListingGroupByPayload<T extends ShortTermListingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ShortTermListingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ShortTermListingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ShortTermListingGroupByOutputType[P]>
            : GetScalarType<T[P], ShortTermListingGroupByOutputType[P]>
        }
      >
    >


  export type ShortTermListingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    address?: boolean
    city?: boolean
    country?: boolean
    latitude?: boolean
    longitude?: boolean
    nightPriceCents?: boolean
    beds?: boolean
    baths?: boolean
    maxGuests?: boolean
    photos?: boolean
    verificationStatus?: boolean
    cadastreNumber?: boolean
    verificationDocUrl?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ownerId?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
    bookings?: boolean | ShortTermListing$bookingsArgs<ExtArgs>
    _count?: boolean | ShortTermListingCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["shortTermListing"]>

  export type ShortTermListingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    address?: boolean
    city?: boolean
    country?: boolean
    latitude?: boolean
    longitude?: boolean
    nightPriceCents?: boolean
    beds?: boolean
    baths?: boolean
    maxGuests?: boolean
    photos?: boolean
    verificationStatus?: boolean
    cadastreNumber?: boolean
    verificationDocUrl?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ownerId?: boolean
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["shortTermListing"]>

  export type ShortTermListingSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    address?: boolean
    city?: boolean
    country?: boolean
    latitude?: boolean
    longitude?: boolean
    nightPriceCents?: boolean
    beds?: boolean
    baths?: boolean
    maxGuests?: boolean
    photos?: boolean
    verificationStatus?: boolean
    cadastreNumber?: boolean
    verificationDocUrl?: boolean
    verifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ownerId?: boolean
  }

  export type ShortTermListingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
    bookings?: boolean | ShortTermListing$bookingsArgs<ExtArgs>
    _count?: boolean | ShortTermListingCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ShortTermListingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    owner?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ShortTermListingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ShortTermListing"
    objects: {
      owner: Prisma.$UserPayload<ExtArgs>
      bookings: Prisma.$BookingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string | null
      address: string
      city: string
      country: string
      latitude: number | null
      longitude: number | null
      nightPriceCents: number
      beds: number
      baths: number
      maxGuests: number
      photos: string[]
      verificationStatus: $Enums.VerificationStatus
      cadastreNumber: string | null
      verificationDocUrl: string | null
      verifiedAt: Date | null
      createdAt: Date
      updatedAt: Date
      ownerId: string
    }, ExtArgs["result"]["shortTermListing"]>
    composites: {}
  }

  type ShortTermListingGetPayload<S extends boolean | null | undefined | ShortTermListingDefaultArgs> = $Result.GetResult<Prisma.$ShortTermListingPayload, S>

  type ShortTermListingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ShortTermListingFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ShortTermListingCountAggregateInputType | true
    }

  export interface ShortTermListingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ShortTermListing'], meta: { name: 'ShortTermListing' } }
    /**
     * Find zero or one ShortTermListing that matches the filter.
     * @param {ShortTermListingFindUniqueArgs} args - Arguments to find a ShortTermListing
     * @example
     * // Get one ShortTermListing
     * const shortTermListing = await prisma.shortTermListing.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ShortTermListingFindUniqueArgs>(args: SelectSubset<T, ShortTermListingFindUniqueArgs<ExtArgs>>): Prisma__ShortTermListingClient<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ShortTermListing that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ShortTermListingFindUniqueOrThrowArgs} args - Arguments to find a ShortTermListing
     * @example
     * // Get one ShortTermListing
     * const shortTermListing = await prisma.shortTermListing.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ShortTermListingFindUniqueOrThrowArgs>(args: SelectSubset<T, ShortTermListingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ShortTermListingClient<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ShortTermListing that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortTermListingFindFirstArgs} args - Arguments to find a ShortTermListing
     * @example
     * // Get one ShortTermListing
     * const shortTermListing = await prisma.shortTermListing.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ShortTermListingFindFirstArgs>(args?: SelectSubset<T, ShortTermListingFindFirstArgs<ExtArgs>>): Prisma__ShortTermListingClient<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ShortTermListing that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortTermListingFindFirstOrThrowArgs} args - Arguments to find a ShortTermListing
     * @example
     * // Get one ShortTermListing
     * const shortTermListing = await prisma.shortTermListing.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ShortTermListingFindFirstOrThrowArgs>(args?: SelectSubset<T, ShortTermListingFindFirstOrThrowArgs<ExtArgs>>): Prisma__ShortTermListingClient<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ShortTermListings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortTermListingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ShortTermListings
     * const shortTermListings = await prisma.shortTermListing.findMany()
     * 
     * // Get first 10 ShortTermListings
     * const shortTermListings = await prisma.shortTermListing.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const shortTermListingWithIdOnly = await prisma.shortTermListing.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ShortTermListingFindManyArgs>(args?: SelectSubset<T, ShortTermListingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ShortTermListing.
     * @param {ShortTermListingCreateArgs} args - Arguments to create a ShortTermListing.
     * @example
     * // Create one ShortTermListing
     * const ShortTermListing = await prisma.shortTermListing.create({
     *   data: {
     *     // ... data to create a ShortTermListing
     *   }
     * })
     * 
     */
    create<T extends ShortTermListingCreateArgs>(args: SelectSubset<T, ShortTermListingCreateArgs<ExtArgs>>): Prisma__ShortTermListingClient<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ShortTermListings.
     * @param {ShortTermListingCreateManyArgs} args - Arguments to create many ShortTermListings.
     * @example
     * // Create many ShortTermListings
     * const shortTermListing = await prisma.shortTermListing.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ShortTermListingCreateManyArgs>(args?: SelectSubset<T, ShortTermListingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ShortTermListings and returns the data saved in the database.
     * @param {ShortTermListingCreateManyAndReturnArgs} args - Arguments to create many ShortTermListings.
     * @example
     * // Create many ShortTermListings
     * const shortTermListing = await prisma.shortTermListing.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ShortTermListings and only return the `id`
     * const shortTermListingWithIdOnly = await prisma.shortTermListing.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ShortTermListingCreateManyAndReturnArgs>(args?: SelectSubset<T, ShortTermListingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ShortTermListing.
     * @param {ShortTermListingDeleteArgs} args - Arguments to delete one ShortTermListing.
     * @example
     * // Delete one ShortTermListing
     * const ShortTermListing = await prisma.shortTermListing.delete({
     *   where: {
     *     // ... filter to delete one ShortTermListing
     *   }
     * })
     * 
     */
    delete<T extends ShortTermListingDeleteArgs>(args: SelectSubset<T, ShortTermListingDeleteArgs<ExtArgs>>): Prisma__ShortTermListingClient<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ShortTermListing.
     * @param {ShortTermListingUpdateArgs} args - Arguments to update one ShortTermListing.
     * @example
     * // Update one ShortTermListing
     * const shortTermListing = await prisma.shortTermListing.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ShortTermListingUpdateArgs>(args: SelectSubset<T, ShortTermListingUpdateArgs<ExtArgs>>): Prisma__ShortTermListingClient<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ShortTermListings.
     * @param {ShortTermListingDeleteManyArgs} args - Arguments to filter ShortTermListings to delete.
     * @example
     * // Delete a few ShortTermListings
     * const { count } = await prisma.shortTermListing.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ShortTermListingDeleteManyArgs>(args?: SelectSubset<T, ShortTermListingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ShortTermListings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortTermListingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ShortTermListings
     * const shortTermListing = await prisma.shortTermListing.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ShortTermListingUpdateManyArgs>(args: SelectSubset<T, ShortTermListingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ShortTermListing.
     * @param {ShortTermListingUpsertArgs} args - Arguments to update or create a ShortTermListing.
     * @example
     * // Update or create a ShortTermListing
     * const shortTermListing = await prisma.shortTermListing.upsert({
     *   create: {
     *     // ... data to create a ShortTermListing
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ShortTermListing we want to update
     *   }
     * })
     */
    upsert<T extends ShortTermListingUpsertArgs>(args: SelectSubset<T, ShortTermListingUpsertArgs<ExtArgs>>): Prisma__ShortTermListingClient<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ShortTermListings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortTermListingCountArgs} args - Arguments to filter ShortTermListings to count.
     * @example
     * // Count the number of ShortTermListings
     * const count = await prisma.shortTermListing.count({
     *   where: {
     *     // ... the filter for the ShortTermListings we want to count
     *   }
     * })
    **/
    count<T extends ShortTermListingCountArgs>(
      args?: Subset<T, ShortTermListingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ShortTermListingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ShortTermListing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortTermListingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ShortTermListingAggregateArgs>(args: Subset<T, ShortTermListingAggregateArgs>): Prisma.PrismaPromise<GetShortTermListingAggregateType<T>>

    /**
     * Group by ShortTermListing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortTermListingGroupByArgs} args - Group by arguments.
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
      T extends ShortTermListingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ShortTermListingGroupByArgs['orderBy'] }
        : { orderBy?: ShortTermListingGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ShortTermListingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetShortTermListingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ShortTermListing model
   */
  readonly fields: ShortTermListingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ShortTermListing.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ShortTermListingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    owner<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    bookings<T extends ShortTermListing$bookingsArgs<ExtArgs> = {}>(args?: Subset<T, ShortTermListing$bookingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the ShortTermListing model
   */ 
  interface ShortTermListingFieldRefs {
    readonly id: FieldRef<"ShortTermListing", 'String'>
    readonly title: FieldRef<"ShortTermListing", 'String'>
    readonly description: FieldRef<"ShortTermListing", 'String'>
    readonly address: FieldRef<"ShortTermListing", 'String'>
    readonly city: FieldRef<"ShortTermListing", 'String'>
    readonly country: FieldRef<"ShortTermListing", 'String'>
    readonly latitude: FieldRef<"ShortTermListing", 'Float'>
    readonly longitude: FieldRef<"ShortTermListing", 'Float'>
    readonly nightPriceCents: FieldRef<"ShortTermListing", 'Int'>
    readonly beds: FieldRef<"ShortTermListing", 'Int'>
    readonly baths: FieldRef<"ShortTermListing", 'Float'>
    readonly maxGuests: FieldRef<"ShortTermListing", 'Int'>
    readonly photos: FieldRef<"ShortTermListing", 'String[]'>
    readonly verificationStatus: FieldRef<"ShortTermListing", 'VerificationStatus'>
    readonly cadastreNumber: FieldRef<"ShortTermListing", 'String'>
    readonly verificationDocUrl: FieldRef<"ShortTermListing", 'String'>
    readonly verifiedAt: FieldRef<"ShortTermListing", 'DateTime'>
    readonly createdAt: FieldRef<"ShortTermListing", 'DateTime'>
    readonly updatedAt: FieldRef<"ShortTermListing", 'DateTime'>
    readonly ownerId: FieldRef<"ShortTermListing", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ShortTermListing findUnique
   */
  export type ShortTermListingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    /**
     * Filter, which ShortTermListing to fetch.
     */
    where: ShortTermListingWhereUniqueInput
  }

  /**
   * ShortTermListing findUniqueOrThrow
   */
  export type ShortTermListingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    /**
     * Filter, which ShortTermListing to fetch.
     */
    where: ShortTermListingWhereUniqueInput
  }

  /**
   * ShortTermListing findFirst
   */
  export type ShortTermListingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    /**
     * Filter, which ShortTermListing to fetch.
     */
    where?: ShortTermListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortTermListings to fetch.
     */
    orderBy?: ShortTermListingOrderByWithRelationInput | ShortTermListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ShortTermListings.
     */
    cursor?: ShortTermListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortTermListings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortTermListings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ShortTermListings.
     */
    distinct?: ShortTermListingScalarFieldEnum | ShortTermListingScalarFieldEnum[]
  }

  /**
   * ShortTermListing findFirstOrThrow
   */
  export type ShortTermListingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    /**
     * Filter, which ShortTermListing to fetch.
     */
    where?: ShortTermListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortTermListings to fetch.
     */
    orderBy?: ShortTermListingOrderByWithRelationInput | ShortTermListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ShortTermListings.
     */
    cursor?: ShortTermListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortTermListings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortTermListings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ShortTermListings.
     */
    distinct?: ShortTermListingScalarFieldEnum | ShortTermListingScalarFieldEnum[]
  }

  /**
   * ShortTermListing findMany
   */
  export type ShortTermListingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    /**
     * Filter, which ShortTermListings to fetch.
     */
    where?: ShortTermListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortTermListings to fetch.
     */
    orderBy?: ShortTermListingOrderByWithRelationInput | ShortTermListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ShortTermListings.
     */
    cursor?: ShortTermListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortTermListings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortTermListings.
     */
    skip?: number
    distinct?: ShortTermListingScalarFieldEnum | ShortTermListingScalarFieldEnum[]
  }

  /**
   * ShortTermListing create
   */
  export type ShortTermListingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    /**
     * The data needed to create a ShortTermListing.
     */
    data: XOR<ShortTermListingCreateInput, ShortTermListingUncheckedCreateInput>
  }

  /**
   * ShortTermListing createMany
   */
  export type ShortTermListingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ShortTermListings.
     */
    data: ShortTermListingCreateManyInput | ShortTermListingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ShortTermListing createManyAndReturn
   */
  export type ShortTermListingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ShortTermListings.
     */
    data: ShortTermListingCreateManyInput | ShortTermListingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ShortTermListing update
   */
  export type ShortTermListingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    /**
     * The data needed to update a ShortTermListing.
     */
    data: XOR<ShortTermListingUpdateInput, ShortTermListingUncheckedUpdateInput>
    /**
     * Choose, which ShortTermListing to update.
     */
    where: ShortTermListingWhereUniqueInput
  }

  /**
   * ShortTermListing updateMany
   */
  export type ShortTermListingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ShortTermListings.
     */
    data: XOR<ShortTermListingUpdateManyMutationInput, ShortTermListingUncheckedUpdateManyInput>
    /**
     * Filter which ShortTermListings to update
     */
    where?: ShortTermListingWhereInput
  }

  /**
   * ShortTermListing upsert
   */
  export type ShortTermListingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    /**
     * The filter to search for the ShortTermListing to update in case it exists.
     */
    where: ShortTermListingWhereUniqueInput
    /**
     * In case the ShortTermListing found by the `where` argument doesn't exist, create a new ShortTermListing with this data.
     */
    create: XOR<ShortTermListingCreateInput, ShortTermListingUncheckedCreateInput>
    /**
     * In case the ShortTermListing was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ShortTermListingUpdateInput, ShortTermListingUncheckedUpdateInput>
  }

  /**
   * ShortTermListing delete
   */
  export type ShortTermListingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
    /**
     * Filter which ShortTermListing to delete.
     */
    where: ShortTermListingWhereUniqueInput
  }

  /**
   * ShortTermListing deleteMany
   */
  export type ShortTermListingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ShortTermListings to delete
     */
    where?: ShortTermListingWhereInput
  }

  /**
   * ShortTermListing.bookings
   */
  export type ShortTermListing$bookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    cursor?: BookingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * ShortTermListing without action
   */
  export type ShortTermListingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortTermListing
     */
    select?: ShortTermListingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShortTermListingInclude<ExtArgs> | null
  }


  /**
   * Model Booking
   */

  export type AggregateBooking = {
    _count: BookingCountAggregateOutputType | null
    _avg: BookingAvgAggregateOutputType | null
    _sum: BookingSumAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  export type BookingAvgAggregateOutputType = {
    nights: number | null
    totalCents: number | null
    guestFeeCents: number | null
    hostFeeCents: number | null
  }

  export type BookingSumAggregateOutputType = {
    nights: number | null
    totalCents: number | null
    guestFeeCents: number | null
    hostFeeCents: number | null
  }

  export type BookingMinAggregateOutputType = {
    id: string | null
    checkIn: Date | null
    checkOut: Date | null
    nights: number | null
    totalCents: number | null
    guestFeeCents: number | null
    hostFeeCents: number | null
    status: $Enums.BookingStatus | null
    guestNotes: string | null
    checkedInAt: Date | null
    checkedOutAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    guestId: string | null
    listingId: string | null
  }

  export type BookingMaxAggregateOutputType = {
    id: string | null
    checkIn: Date | null
    checkOut: Date | null
    nights: number | null
    totalCents: number | null
    guestFeeCents: number | null
    hostFeeCents: number | null
    status: $Enums.BookingStatus | null
    guestNotes: string | null
    checkedInAt: Date | null
    checkedOutAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    guestId: string | null
    listingId: string | null
  }

  export type BookingCountAggregateOutputType = {
    id: number
    checkIn: number
    checkOut: number
    nights: number
    totalCents: number
    guestFeeCents: number
    hostFeeCents: number
    status: number
    guestNotes: number
    checkedInAt: number
    checkedOutAt: number
    createdAt: number
    updatedAt: number
    guestId: number
    listingId: number
    _all: number
  }


  export type BookingAvgAggregateInputType = {
    nights?: true
    totalCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
  }

  export type BookingSumAggregateInputType = {
    nights?: true
    totalCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
  }

  export type BookingMinAggregateInputType = {
    id?: true
    checkIn?: true
    checkOut?: true
    nights?: true
    totalCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
    status?: true
    guestNotes?: true
    checkedInAt?: true
    checkedOutAt?: true
    createdAt?: true
    updatedAt?: true
    guestId?: true
    listingId?: true
  }

  export type BookingMaxAggregateInputType = {
    id?: true
    checkIn?: true
    checkOut?: true
    nights?: true
    totalCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
    status?: true
    guestNotes?: true
    checkedInAt?: true
    checkedOutAt?: true
    createdAt?: true
    updatedAt?: true
    guestId?: true
    listingId?: true
  }

  export type BookingCountAggregateInputType = {
    id?: true
    checkIn?: true
    checkOut?: true
    nights?: true
    totalCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
    status?: true
    guestNotes?: true
    checkedInAt?: true
    checkedOutAt?: true
    createdAt?: true
    updatedAt?: true
    guestId?: true
    listingId?: true
    _all?: true
  }

  export type BookingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Booking to aggregate.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Bookings
    **/
    _count?: true | BookingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BookingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BookingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BookingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BookingMaxAggregateInputType
  }

  export type GetBookingAggregateType<T extends BookingAggregateArgs> = {
        [P in keyof T & keyof AggregateBooking]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBooking[P]>
      : GetScalarType<T[P], AggregateBooking[P]>
  }




  export type BookingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithAggregationInput | BookingOrderByWithAggregationInput[]
    by: BookingScalarFieldEnum[] | BookingScalarFieldEnum
    having?: BookingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BookingCountAggregateInputType | true
    _avg?: BookingAvgAggregateInputType
    _sum?: BookingSumAggregateInputType
    _min?: BookingMinAggregateInputType
    _max?: BookingMaxAggregateInputType
  }

  export type BookingGroupByOutputType = {
    id: string
    checkIn: Date
    checkOut: Date
    nights: number
    totalCents: number
    guestFeeCents: number
    hostFeeCents: number
    status: $Enums.BookingStatus
    guestNotes: string | null
    checkedInAt: Date | null
    checkedOutAt: Date | null
    createdAt: Date
    updatedAt: Date
    guestId: string
    listingId: string
    _count: BookingCountAggregateOutputType | null
    _avg: BookingAvgAggregateOutputType | null
    _sum: BookingSumAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  type GetBookingGroupByPayload<T extends BookingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BookingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BookingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BookingGroupByOutputType[P]>
            : GetScalarType<T[P], BookingGroupByOutputType[P]>
        }
      >
    >


  export type BookingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    checkIn?: boolean
    checkOut?: boolean
    nights?: boolean
    totalCents?: boolean
    guestFeeCents?: boolean
    hostFeeCents?: boolean
    status?: boolean
    guestNotes?: boolean
    checkedInAt?: boolean
    checkedOutAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    guestId?: boolean
    listingId?: boolean
    guest?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ShortTermListingDefaultArgs<ExtArgs>
    payment?: boolean | Booking$paymentArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    checkIn?: boolean
    checkOut?: boolean
    nights?: boolean
    totalCents?: boolean
    guestFeeCents?: boolean
    hostFeeCents?: boolean
    status?: boolean
    guestNotes?: boolean
    checkedInAt?: boolean
    checkedOutAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    guestId?: boolean
    listingId?: boolean
    guest?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ShortTermListingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectScalar = {
    id?: boolean
    checkIn?: boolean
    checkOut?: boolean
    nights?: boolean
    totalCents?: boolean
    guestFeeCents?: boolean
    hostFeeCents?: boolean
    status?: boolean
    guestNotes?: boolean
    checkedInAt?: boolean
    checkedOutAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    guestId?: boolean
    listingId?: boolean
  }

  export type BookingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    guest?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ShortTermListingDefaultArgs<ExtArgs>
    payment?: boolean | Booking$paymentArgs<ExtArgs>
  }
  export type BookingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    guest?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ShortTermListingDefaultArgs<ExtArgs>
  }

  export type $BookingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Booking"
    objects: {
      guest: Prisma.$UserPayload<ExtArgs>
      listing: Prisma.$ShortTermListingPayload<ExtArgs>
      payment: Prisma.$PaymentPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      checkIn: Date
      checkOut: Date
      nights: number
      totalCents: number
      guestFeeCents: number
      hostFeeCents: number
      status: $Enums.BookingStatus
      guestNotes: string | null
      checkedInAt: Date | null
      checkedOutAt: Date | null
      createdAt: Date
      updatedAt: Date
      guestId: string
      listingId: string
    }, ExtArgs["result"]["booking"]>
    composites: {}
  }

  type BookingGetPayload<S extends boolean | null | undefined | BookingDefaultArgs> = $Result.GetResult<Prisma.$BookingPayload, S>

  type BookingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<BookingFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: BookingCountAggregateInputType | true
    }

  export interface BookingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Booking'], meta: { name: 'Booking' } }
    /**
     * Find zero or one Booking that matches the filter.
     * @param {BookingFindUniqueArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BookingFindUniqueArgs>(args: SelectSubset<T, BookingFindUniqueArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Booking that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {BookingFindUniqueOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BookingFindUniqueOrThrowArgs>(args: SelectSubset<T, BookingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Booking that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BookingFindFirstArgs>(args?: SelectSubset<T, BookingFindFirstArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Booking that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BookingFindFirstOrThrowArgs>(args?: SelectSubset<T, BookingFindFirstOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Bookings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Bookings
     * const bookings = await prisma.booking.findMany()
     * 
     * // Get first 10 Bookings
     * const bookings = await prisma.booking.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const bookingWithIdOnly = await prisma.booking.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BookingFindManyArgs>(args?: SelectSubset<T, BookingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Booking.
     * @param {BookingCreateArgs} args - Arguments to create a Booking.
     * @example
     * // Create one Booking
     * const Booking = await prisma.booking.create({
     *   data: {
     *     // ... data to create a Booking
     *   }
     * })
     * 
     */
    create<T extends BookingCreateArgs>(args: SelectSubset<T, BookingCreateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Bookings.
     * @param {BookingCreateManyArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BookingCreateManyArgs>(args?: SelectSubset<T, BookingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Bookings and returns the data saved in the database.
     * @param {BookingCreateManyAndReturnArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Bookings and only return the `id`
     * const bookingWithIdOnly = await prisma.booking.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BookingCreateManyAndReturnArgs>(args?: SelectSubset<T, BookingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Booking.
     * @param {BookingDeleteArgs} args - Arguments to delete one Booking.
     * @example
     * // Delete one Booking
     * const Booking = await prisma.booking.delete({
     *   where: {
     *     // ... filter to delete one Booking
     *   }
     * })
     * 
     */
    delete<T extends BookingDeleteArgs>(args: SelectSubset<T, BookingDeleteArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Booking.
     * @param {BookingUpdateArgs} args - Arguments to update one Booking.
     * @example
     * // Update one Booking
     * const booking = await prisma.booking.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BookingUpdateArgs>(args: SelectSubset<T, BookingUpdateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Bookings.
     * @param {BookingDeleteManyArgs} args - Arguments to filter Bookings to delete.
     * @example
     * // Delete a few Bookings
     * const { count } = await prisma.booking.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BookingDeleteManyArgs>(args?: SelectSubset<T, BookingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Bookings
     * const booking = await prisma.booking.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BookingUpdateManyArgs>(args: SelectSubset<T, BookingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Booking.
     * @param {BookingUpsertArgs} args - Arguments to update or create a Booking.
     * @example
     * // Update or create a Booking
     * const booking = await prisma.booking.upsert({
     *   create: {
     *     // ... data to create a Booking
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Booking we want to update
     *   }
     * })
     */
    upsert<T extends BookingUpsertArgs>(args: SelectSubset<T, BookingUpsertArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingCountArgs} args - Arguments to filter Bookings to count.
     * @example
     * // Count the number of Bookings
     * const count = await prisma.booking.count({
     *   where: {
     *     // ... the filter for the Bookings we want to count
     *   }
     * })
    **/
    count<T extends BookingCountArgs>(
      args?: Subset<T, BookingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BookingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends BookingAggregateArgs>(args: Subset<T, BookingAggregateArgs>): Prisma.PrismaPromise<GetBookingAggregateType<T>>

    /**
     * Group by Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingGroupByArgs} args - Group by arguments.
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
      T extends BookingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BookingGroupByArgs['orderBy'] }
        : { orderBy?: BookingGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, BookingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBookingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Booking model
   */
  readonly fields: BookingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Booking.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BookingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    guest<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    listing<T extends ShortTermListingDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShortTermListingDefaultArgs<ExtArgs>>): Prisma__ShortTermListingClient<$Result.GetResult<Prisma.$ShortTermListingPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    payment<T extends Booking$paymentArgs<ExtArgs> = {}>(args?: Subset<T, Booking$paymentArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
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
   * Fields of the Booking model
   */ 
  interface BookingFieldRefs {
    readonly id: FieldRef<"Booking", 'String'>
    readonly checkIn: FieldRef<"Booking", 'DateTime'>
    readonly checkOut: FieldRef<"Booking", 'DateTime'>
    readonly nights: FieldRef<"Booking", 'Int'>
    readonly totalCents: FieldRef<"Booking", 'Int'>
    readonly guestFeeCents: FieldRef<"Booking", 'Int'>
    readonly hostFeeCents: FieldRef<"Booking", 'Int'>
    readonly status: FieldRef<"Booking", 'BookingStatus'>
    readonly guestNotes: FieldRef<"Booking", 'String'>
    readonly checkedInAt: FieldRef<"Booking", 'DateTime'>
    readonly checkedOutAt: FieldRef<"Booking", 'DateTime'>
    readonly createdAt: FieldRef<"Booking", 'DateTime'>
    readonly updatedAt: FieldRef<"Booking", 'DateTime'>
    readonly guestId: FieldRef<"Booking", 'String'>
    readonly listingId: FieldRef<"Booking", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Booking findUnique
   */
  export type BookingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findUniqueOrThrow
   */
  export type BookingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findFirst
   */
  export type BookingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findFirstOrThrow
   */
  export type BookingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findMany
   */
  export type BookingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Bookings to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking create
   */
  export type BookingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to create a Booking.
     */
    data: XOR<BookingCreateInput, BookingUncheckedCreateInput>
  }

  /**
   * Booking createMany
   */
  export type BookingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Booking createManyAndReturn
   */
  export type BookingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Booking update
   */
  export type BookingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to update a Booking.
     */
    data: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
    /**
     * Choose, which Booking to update.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking updateMany
   */
  export type BookingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Bookings.
     */
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyInput>
    /**
     * Filter which Bookings to update
     */
    where?: BookingWhereInput
  }

  /**
   * Booking upsert
   */
  export type BookingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The filter to search for the Booking to update in case it exists.
     */
    where: BookingWhereUniqueInput
    /**
     * In case the Booking found by the `where` argument doesn't exist, create a new Booking with this data.
     */
    create: XOR<BookingCreateInput, BookingUncheckedCreateInput>
    /**
     * In case the Booking was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
  }

  /**
   * Booking delete
   */
  export type BookingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter which Booking to delete.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking deleteMany
   */
  export type BookingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Bookings to delete
     */
    where?: BookingWhereInput
  }

  /**
   * Booking.payment
   */
  export type Booking$paymentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    where?: PaymentWhereInput
  }

  /**
   * Booking without action
   */
  export type BookingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
  }


  /**
   * Model Payment
   */

  export type AggregatePayment = {
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  export type PaymentAvgAggregateOutputType = {
    amountCents: number | null
    guestFeeCents: number | null
    hostFeeCents: number | null
    hostPayoutCents: number | null
  }

  export type PaymentSumAggregateOutputType = {
    amountCents: number | null
    guestFeeCents: number | null
    hostFeeCents: number | null
    hostPayoutCents: number | null
  }

  export type PaymentMinAggregateOutputType = {
    id: string | null
    amountCents: number | null
    guestFeeCents: number | null
    hostFeeCents: number | null
    hostPayoutCents: number | null
    status: $Enums.PaymentStatus | null
    stripePaymentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    bookingId: string | null
  }

  export type PaymentMaxAggregateOutputType = {
    id: string | null
    amountCents: number | null
    guestFeeCents: number | null
    hostFeeCents: number | null
    hostPayoutCents: number | null
    status: $Enums.PaymentStatus | null
    stripePaymentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    bookingId: string | null
  }

  export type PaymentCountAggregateOutputType = {
    id: number
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status: number
    stripePaymentId: number
    createdAt: number
    updatedAt: number
    bookingId: number
    _all: number
  }


  export type PaymentAvgAggregateInputType = {
    amountCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
    hostPayoutCents?: true
  }

  export type PaymentSumAggregateInputType = {
    amountCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
    hostPayoutCents?: true
  }

  export type PaymentMinAggregateInputType = {
    id?: true
    amountCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
    hostPayoutCents?: true
    status?: true
    stripePaymentId?: true
    createdAt?: true
    updatedAt?: true
    bookingId?: true
  }

  export type PaymentMaxAggregateInputType = {
    id?: true
    amountCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
    hostPayoutCents?: true
    status?: true
    stripePaymentId?: true
    createdAt?: true
    updatedAt?: true
    bookingId?: true
  }

  export type PaymentCountAggregateInputType = {
    id?: true
    amountCents?: true
    guestFeeCents?: true
    hostFeeCents?: true
    hostPayoutCents?: true
    status?: true
    stripePaymentId?: true
    createdAt?: true
    updatedAt?: true
    bookingId?: true
    _all?: true
  }

  export type PaymentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payment to aggregate.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Payments
    **/
    _count?: true | PaymentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PaymentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PaymentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PaymentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PaymentMaxAggregateInputType
  }

  export type GetPaymentAggregateType<T extends PaymentAggregateArgs> = {
        [P in keyof T & keyof AggregatePayment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayment[P]>
      : GetScalarType<T[P], AggregatePayment[P]>
  }




  export type PaymentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentWhereInput
    orderBy?: PaymentOrderByWithAggregationInput | PaymentOrderByWithAggregationInput[]
    by: PaymentScalarFieldEnum[] | PaymentScalarFieldEnum
    having?: PaymentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PaymentCountAggregateInputType | true
    _avg?: PaymentAvgAggregateInputType
    _sum?: PaymentSumAggregateInputType
    _min?: PaymentMinAggregateInputType
    _max?: PaymentMaxAggregateInputType
  }

  export type PaymentGroupByOutputType = {
    id: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status: $Enums.PaymentStatus
    stripePaymentId: string | null
    createdAt: Date
    updatedAt: Date
    bookingId: string
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  type GetPaymentGroupByPayload<T extends PaymentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PaymentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PaymentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PaymentGroupByOutputType[P]>
            : GetScalarType<T[P], PaymentGroupByOutputType[P]>
        }
      >
    >


  export type PaymentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    amountCents?: boolean
    guestFeeCents?: boolean
    hostFeeCents?: boolean
    hostPayoutCents?: boolean
    status?: boolean
    stripePaymentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    bookingId?: boolean
    booking?: boolean | BookingDefaultArgs<ExtArgs>
    intent?: boolean | Payment$intentArgs<ExtArgs>
    transactions?: boolean | Payment$transactionsArgs<ExtArgs>
    payoutPayments?: boolean | Payment$payoutPaymentsArgs<ExtArgs>
    _count?: boolean | PaymentCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    amountCents?: boolean
    guestFeeCents?: boolean
    hostFeeCents?: boolean
    hostPayoutCents?: boolean
    status?: boolean
    stripePaymentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    bookingId?: boolean
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectScalar = {
    id?: boolean
    amountCents?: boolean
    guestFeeCents?: boolean
    hostFeeCents?: boolean
    hostPayoutCents?: boolean
    status?: boolean
    stripePaymentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    bookingId?: boolean
  }

  export type PaymentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    booking?: boolean | BookingDefaultArgs<ExtArgs>
    intent?: boolean | Payment$intentArgs<ExtArgs>
    transactions?: boolean | Payment$transactionsArgs<ExtArgs>
    payoutPayments?: boolean | Payment$payoutPaymentsArgs<ExtArgs>
    _count?: boolean | PaymentCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PaymentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }

  export type $PaymentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Payment"
    objects: {
      booking: Prisma.$BookingPayload<ExtArgs>
      intent: Prisma.$PaymentIntentPayload<ExtArgs> | null
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
      payoutPayments: Prisma.$PayoutPaymentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      amountCents: number
      guestFeeCents: number
      hostFeeCents: number
      hostPayoutCents: number
      status: $Enums.PaymentStatus
      stripePaymentId: string | null
      createdAt: Date
      updatedAt: Date
      bookingId: string
    }, ExtArgs["result"]["payment"]>
    composites: {}
  }

  type PaymentGetPayload<S extends boolean | null | undefined | PaymentDefaultArgs> = $Result.GetResult<Prisma.$PaymentPayload, S>

  type PaymentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PaymentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PaymentCountAggregateInputType | true
    }

  export interface PaymentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Payment'], meta: { name: 'Payment' } }
    /**
     * Find zero or one Payment that matches the filter.
     * @param {PaymentFindUniqueArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PaymentFindUniqueArgs>(args: SelectSubset<T, PaymentFindUniqueArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Payment that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PaymentFindUniqueOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PaymentFindUniqueOrThrowArgs>(args: SelectSubset<T, PaymentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Payment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PaymentFindFirstArgs>(args?: SelectSubset<T, PaymentFindFirstArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Payment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PaymentFindFirstOrThrowArgs>(args?: SelectSubset<T, PaymentFindFirstOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Payments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Payments
     * const payments = await prisma.payment.findMany()
     * 
     * // Get first 10 Payments
     * const payments = await prisma.payment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const paymentWithIdOnly = await prisma.payment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PaymentFindManyArgs>(args?: SelectSubset<T, PaymentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Payment.
     * @param {PaymentCreateArgs} args - Arguments to create a Payment.
     * @example
     * // Create one Payment
     * const Payment = await prisma.payment.create({
     *   data: {
     *     // ... data to create a Payment
     *   }
     * })
     * 
     */
    create<T extends PaymentCreateArgs>(args: SelectSubset<T, PaymentCreateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Payments.
     * @param {PaymentCreateManyArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PaymentCreateManyArgs>(args?: SelectSubset<T, PaymentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Payments and returns the data saved in the database.
     * @param {PaymentCreateManyAndReturnArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Payments and only return the `id`
     * const paymentWithIdOnly = await prisma.payment.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PaymentCreateManyAndReturnArgs>(args?: SelectSubset<T, PaymentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Payment.
     * @param {PaymentDeleteArgs} args - Arguments to delete one Payment.
     * @example
     * // Delete one Payment
     * const Payment = await prisma.payment.delete({
     *   where: {
     *     // ... filter to delete one Payment
     *   }
     * })
     * 
     */
    delete<T extends PaymentDeleteArgs>(args: SelectSubset<T, PaymentDeleteArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Payment.
     * @param {PaymentUpdateArgs} args - Arguments to update one Payment.
     * @example
     * // Update one Payment
     * const payment = await prisma.payment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PaymentUpdateArgs>(args: SelectSubset<T, PaymentUpdateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Payments.
     * @param {PaymentDeleteManyArgs} args - Arguments to filter Payments to delete.
     * @example
     * // Delete a few Payments
     * const { count } = await prisma.payment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PaymentDeleteManyArgs>(args?: SelectSubset<T, PaymentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Payments
     * const payment = await prisma.payment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PaymentUpdateManyArgs>(args: SelectSubset<T, PaymentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Payment.
     * @param {PaymentUpsertArgs} args - Arguments to update or create a Payment.
     * @example
     * // Update or create a Payment
     * const payment = await prisma.payment.upsert({
     *   create: {
     *     // ... data to create a Payment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Payment we want to update
     *   }
     * })
     */
    upsert<T extends PaymentUpsertArgs>(args: SelectSubset<T, PaymentUpsertArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentCountArgs} args - Arguments to filter Payments to count.
     * @example
     * // Count the number of Payments
     * const count = await prisma.payment.count({
     *   where: {
     *     // ... the filter for the Payments we want to count
     *   }
     * })
    **/
    count<T extends PaymentCountArgs>(
      args?: Subset<T, PaymentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PaymentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PaymentAggregateArgs>(args: Subset<T, PaymentAggregateArgs>): Prisma.PrismaPromise<GetPaymentAggregateType<T>>

    /**
     * Group by Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentGroupByArgs} args - Group by arguments.
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
      T extends PaymentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PaymentGroupByArgs['orderBy'] }
        : { orderBy?: PaymentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PaymentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPaymentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Payment model
   */
  readonly fields: PaymentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Payment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PaymentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    booking<T extends BookingDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BookingDefaultArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    intent<T extends Payment$intentArgs<ExtArgs> = {}>(args?: Subset<T, Payment$intentArgs<ExtArgs>>): Prisma__PaymentIntentClient<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    transactions<T extends Payment$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Payment$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany"> | Null>
    payoutPayments<T extends Payment$payoutPaymentsArgs<ExtArgs> = {}>(args?: Subset<T, Payment$payoutPaymentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the Payment model
   */ 
  interface PaymentFieldRefs {
    readonly id: FieldRef<"Payment", 'String'>
    readonly amountCents: FieldRef<"Payment", 'Int'>
    readonly guestFeeCents: FieldRef<"Payment", 'Int'>
    readonly hostFeeCents: FieldRef<"Payment", 'Int'>
    readonly hostPayoutCents: FieldRef<"Payment", 'Int'>
    readonly status: FieldRef<"Payment", 'PaymentStatus'>
    readonly stripePaymentId: FieldRef<"Payment", 'String'>
    readonly createdAt: FieldRef<"Payment", 'DateTime'>
    readonly updatedAt: FieldRef<"Payment", 'DateTime'>
    readonly bookingId: FieldRef<"Payment", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Payment findUnique
   */
  export type PaymentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findUniqueOrThrow
   */
  export type PaymentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findFirst
   */
  export type PaymentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findFirstOrThrow
   */
  export type PaymentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findMany
   */
  export type PaymentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter, which Payments to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment create
   */
  export type PaymentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * The data needed to create a Payment.
     */
    data: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
  }

  /**
   * Payment createMany
   */
  export type PaymentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payment createManyAndReturn
   */
  export type PaymentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Payment update
   */
  export type PaymentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * The data needed to update a Payment.
     */
    data: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
    /**
     * Choose, which Payment to update.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment updateMany
   */
  export type PaymentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Payments.
     */
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyInput>
    /**
     * Filter which Payments to update
     */
    where?: PaymentWhereInput
  }

  /**
   * Payment upsert
   */
  export type PaymentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * The filter to search for the Payment to update in case it exists.
     */
    where: PaymentWhereUniqueInput
    /**
     * In case the Payment found by the `where` argument doesn't exist, create a new Payment with this data.
     */
    create: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
    /**
     * In case the Payment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
  }

  /**
   * Payment delete
   */
  export type PaymentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    /**
     * Filter which Payment to delete.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment deleteMany
   */
  export type PaymentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payments to delete
     */
    where?: PaymentWhereInput
  }

  /**
   * Payment.intent
   */
  export type Payment$intentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    where?: PaymentIntentWhereInput
  }

  /**
   * Payment.transactions
   */
  export type Payment$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Payment.payoutPayments
   */
  export type Payment$payoutPaymentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    where?: PayoutPaymentWhereInput
    orderBy?: PayoutPaymentOrderByWithRelationInput | PayoutPaymentOrderByWithRelationInput[]
    cursor?: PayoutPaymentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PayoutPaymentScalarFieldEnum | PayoutPaymentScalarFieldEnum[]
  }

  /**
   * Payment without action
   */
  export type PaymentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
  }


  /**
   * Model PaymentIntent
   */

  export type AggregatePaymentIntent = {
    _count: PaymentIntentCountAggregateOutputType | null
    _avg: PaymentIntentAvgAggregateOutputType | null
    _sum: PaymentIntentSumAggregateOutputType | null
    _min: PaymentIntentMinAggregateOutputType | null
    _max: PaymentIntentMaxAggregateOutputType | null
  }

  export type PaymentIntentAvgAggregateOutputType = {
    amountCents: number | null
  }

  export type PaymentIntentSumAggregateOutputType = {
    amountCents: number | null
  }

  export type PaymentIntentMinAggregateOutputType = {
    id: string | null
    bookingId: string | null
    paymentId: string | null
    amountCents: number | null
    currency: string | null
    providerIntentId: string | null
    status: $Enums.IntentStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentIntentMaxAggregateOutputType = {
    id: string | null
    bookingId: string | null
    paymentId: string | null
    amountCents: number | null
    currency: string | null
    providerIntentId: string | null
    status: $Enums.IntentStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentIntentCountAggregateOutputType = {
    id: number
    bookingId: number
    paymentId: number
    amountCents: number
    currency: number
    providerIntentId: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PaymentIntentAvgAggregateInputType = {
    amountCents?: true
  }

  export type PaymentIntentSumAggregateInputType = {
    amountCents?: true
  }

  export type PaymentIntentMinAggregateInputType = {
    id?: true
    bookingId?: true
    paymentId?: true
    amountCents?: true
    currency?: true
    providerIntentId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentIntentMaxAggregateInputType = {
    id?: true
    bookingId?: true
    paymentId?: true
    amountCents?: true
    currency?: true
    providerIntentId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentIntentCountAggregateInputType = {
    id?: true
    bookingId?: true
    paymentId?: true
    amountCents?: true
    currency?: true
    providerIntentId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PaymentIntentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PaymentIntent to aggregate.
     */
    where?: PaymentIntentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentIntents to fetch.
     */
    orderBy?: PaymentIntentOrderByWithRelationInput | PaymentIntentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PaymentIntentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentIntents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentIntents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PaymentIntents
    **/
    _count?: true | PaymentIntentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PaymentIntentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PaymentIntentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PaymentIntentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PaymentIntentMaxAggregateInputType
  }

  export type GetPaymentIntentAggregateType<T extends PaymentIntentAggregateArgs> = {
        [P in keyof T & keyof AggregatePaymentIntent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePaymentIntent[P]>
      : GetScalarType<T[P], AggregatePaymentIntent[P]>
  }




  export type PaymentIntentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentIntentWhereInput
    orderBy?: PaymentIntentOrderByWithAggregationInput | PaymentIntentOrderByWithAggregationInput[]
    by: PaymentIntentScalarFieldEnum[] | PaymentIntentScalarFieldEnum
    having?: PaymentIntentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PaymentIntentCountAggregateInputType | true
    _avg?: PaymentIntentAvgAggregateInputType
    _sum?: PaymentIntentSumAggregateInputType
    _min?: PaymentIntentMinAggregateInputType
    _max?: PaymentIntentMaxAggregateInputType
  }

  export type PaymentIntentGroupByOutputType = {
    id: string
    bookingId: string
    paymentId: string
    amountCents: number
    currency: string
    providerIntentId: string | null
    status: $Enums.IntentStatus
    createdAt: Date
    updatedAt: Date
    _count: PaymentIntentCountAggregateOutputType | null
    _avg: PaymentIntentAvgAggregateOutputType | null
    _sum: PaymentIntentSumAggregateOutputType | null
    _min: PaymentIntentMinAggregateOutputType | null
    _max: PaymentIntentMaxAggregateOutputType | null
  }

  type GetPaymentIntentGroupByPayload<T extends PaymentIntentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PaymentIntentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PaymentIntentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PaymentIntentGroupByOutputType[P]>
            : GetScalarType<T[P], PaymentIntentGroupByOutputType[P]>
        }
      >
    >


  export type PaymentIntentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    paymentId?: boolean
    amountCents?: boolean
    currency?: boolean
    providerIntentId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    payment?: boolean | PaymentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["paymentIntent"]>

  export type PaymentIntentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    bookingId?: boolean
    paymentId?: boolean
    amountCents?: boolean
    currency?: boolean
    providerIntentId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    payment?: boolean | PaymentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["paymentIntent"]>

  export type PaymentIntentSelectScalar = {
    id?: boolean
    bookingId?: boolean
    paymentId?: boolean
    amountCents?: boolean
    currency?: boolean
    providerIntentId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PaymentIntentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payment?: boolean | PaymentDefaultArgs<ExtArgs>
  }
  export type PaymentIntentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payment?: boolean | PaymentDefaultArgs<ExtArgs>
  }

  export type $PaymentIntentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PaymentIntent"
    objects: {
      payment: Prisma.$PaymentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      bookingId: string
      paymentId: string
      amountCents: number
      currency: string
      providerIntentId: string | null
      status: $Enums.IntentStatus
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["paymentIntent"]>
    composites: {}
  }

  type PaymentIntentGetPayload<S extends boolean | null | undefined | PaymentIntentDefaultArgs> = $Result.GetResult<Prisma.$PaymentIntentPayload, S>

  type PaymentIntentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PaymentIntentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PaymentIntentCountAggregateInputType | true
    }

  export interface PaymentIntentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PaymentIntent'], meta: { name: 'PaymentIntent' } }
    /**
     * Find zero or one PaymentIntent that matches the filter.
     * @param {PaymentIntentFindUniqueArgs} args - Arguments to find a PaymentIntent
     * @example
     * // Get one PaymentIntent
     * const paymentIntent = await prisma.paymentIntent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PaymentIntentFindUniqueArgs>(args: SelectSubset<T, PaymentIntentFindUniqueArgs<ExtArgs>>): Prisma__PaymentIntentClient<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PaymentIntent that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PaymentIntentFindUniqueOrThrowArgs} args - Arguments to find a PaymentIntent
     * @example
     * // Get one PaymentIntent
     * const paymentIntent = await prisma.paymentIntent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PaymentIntentFindUniqueOrThrowArgs>(args: SelectSubset<T, PaymentIntentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PaymentIntentClient<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PaymentIntent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIntentFindFirstArgs} args - Arguments to find a PaymentIntent
     * @example
     * // Get one PaymentIntent
     * const paymentIntent = await prisma.paymentIntent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PaymentIntentFindFirstArgs>(args?: SelectSubset<T, PaymentIntentFindFirstArgs<ExtArgs>>): Prisma__PaymentIntentClient<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PaymentIntent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIntentFindFirstOrThrowArgs} args - Arguments to find a PaymentIntent
     * @example
     * // Get one PaymentIntent
     * const paymentIntent = await prisma.paymentIntent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PaymentIntentFindFirstOrThrowArgs>(args?: SelectSubset<T, PaymentIntentFindFirstOrThrowArgs<ExtArgs>>): Prisma__PaymentIntentClient<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PaymentIntents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIntentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PaymentIntents
     * const paymentIntents = await prisma.paymentIntent.findMany()
     * 
     * // Get first 10 PaymentIntents
     * const paymentIntents = await prisma.paymentIntent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const paymentIntentWithIdOnly = await prisma.paymentIntent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PaymentIntentFindManyArgs>(args?: SelectSubset<T, PaymentIntentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PaymentIntent.
     * @param {PaymentIntentCreateArgs} args - Arguments to create a PaymentIntent.
     * @example
     * // Create one PaymentIntent
     * const PaymentIntent = await prisma.paymentIntent.create({
     *   data: {
     *     // ... data to create a PaymentIntent
     *   }
     * })
     * 
     */
    create<T extends PaymentIntentCreateArgs>(args: SelectSubset<T, PaymentIntentCreateArgs<ExtArgs>>): Prisma__PaymentIntentClient<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PaymentIntents.
     * @param {PaymentIntentCreateManyArgs} args - Arguments to create many PaymentIntents.
     * @example
     * // Create many PaymentIntents
     * const paymentIntent = await prisma.paymentIntent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PaymentIntentCreateManyArgs>(args?: SelectSubset<T, PaymentIntentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PaymentIntents and returns the data saved in the database.
     * @param {PaymentIntentCreateManyAndReturnArgs} args - Arguments to create many PaymentIntents.
     * @example
     * // Create many PaymentIntents
     * const paymentIntent = await prisma.paymentIntent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PaymentIntents and only return the `id`
     * const paymentIntentWithIdOnly = await prisma.paymentIntent.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PaymentIntentCreateManyAndReturnArgs>(args?: SelectSubset<T, PaymentIntentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PaymentIntent.
     * @param {PaymentIntentDeleteArgs} args - Arguments to delete one PaymentIntent.
     * @example
     * // Delete one PaymentIntent
     * const PaymentIntent = await prisma.paymentIntent.delete({
     *   where: {
     *     // ... filter to delete one PaymentIntent
     *   }
     * })
     * 
     */
    delete<T extends PaymentIntentDeleteArgs>(args: SelectSubset<T, PaymentIntentDeleteArgs<ExtArgs>>): Prisma__PaymentIntentClient<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PaymentIntent.
     * @param {PaymentIntentUpdateArgs} args - Arguments to update one PaymentIntent.
     * @example
     * // Update one PaymentIntent
     * const paymentIntent = await prisma.paymentIntent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PaymentIntentUpdateArgs>(args: SelectSubset<T, PaymentIntentUpdateArgs<ExtArgs>>): Prisma__PaymentIntentClient<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PaymentIntents.
     * @param {PaymentIntentDeleteManyArgs} args - Arguments to filter PaymentIntents to delete.
     * @example
     * // Delete a few PaymentIntents
     * const { count } = await prisma.paymentIntent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PaymentIntentDeleteManyArgs>(args?: SelectSubset<T, PaymentIntentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PaymentIntents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIntentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PaymentIntents
     * const paymentIntent = await prisma.paymentIntent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PaymentIntentUpdateManyArgs>(args: SelectSubset<T, PaymentIntentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PaymentIntent.
     * @param {PaymentIntentUpsertArgs} args - Arguments to update or create a PaymentIntent.
     * @example
     * // Update or create a PaymentIntent
     * const paymentIntent = await prisma.paymentIntent.upsert({
     *   create: {
     *     // ... data to create a PaymentIntent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PaymentIntent we want to update
     *   }
     * })
     */
    upsert<T extends PaymentIntentUpsertArgs>(args: SelectSubset<T, PaymentIntentUpsertArgs<ExtArgs>>): Prisma__PaymentIntentClient<$Result.GetResult<Prisma.$PaymentIntentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PaymentIntents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIntentCountArgs} args - Arguments to filter PaymentIntents to count.
     * @example
     * // Count the number of PaymentIntents
     * const count = await prisma.paymentIntent.count({
     *   where: {
     *     // ... the filter for the PaymentIntents we want to count
     *   }
     * })
    **/
    count<T extends PaymentIntentCountArgs>(
      args?: Subset<T, PaymentIntentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PaymentIntentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PaymentIntent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIntentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PaymentIntentAggregateArgs>(args: Subset<T, PaymentIntentAggregateArgs>): Prisma.PrismaPromise<GetPaymentIntentAggregateType<T>>

    /**
     * Group by PaymentIntent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIntentGroupByArgs} args - Group by arguments.
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
      T extends PaymentIntentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PaymentIntentGroupByArgs['orderBy'] }
        : { orderBy?: PaymentIntentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PaymentIntentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPaymentIntentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PaymentIntent model
   */
  readonly fields: PaymentIntentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PaymentIntent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PaymentIntentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    payment<T extends PaymentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PaymentDefaultArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the PaymentIntent model
   */ 
  interface PaymentIntentFieldRefs {
    readonly id: FieldRef<"PaymentIntent", 'String'>
    readonly bookingId: FieldRef<"PaymentIntent", 'String'>
    readonly paymentId: FieldRef<"PaymentIntent", 'String'>
    readonly amountCents: FieldRef<"PaymentIntent", 'Int'>
    readonly currency: FieldRef<"PaymentIntent", 'String'>
    readonly providerIntentId: FieldRef<"PaymentIntent", 'String'>
    readonly status: FieldRef<"PaymentIntent", 'IntentStatus'>
    readonly createdAt: FieldRef<"PaymentIntent", 'DateTime'>
    readonly updatedAt: FieldRef<"PaymentIntent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PaymentIntent findUnique
   */
  export type PaymentIntentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    /**
     * Filter, which PaymentIntent to fetch.
     */
    where: PaymentIntentWhereUniqueInput
  }

  /**
   * PaymentIntent findUniqueOrThrow
   */
  export type PaymentIntentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    /**
     * Filter, which PaymentIntent to fetch.
     */
    where: PaymentIntentWhereUniqueInput
  }

  /**
   * PaymentIntent findFirst
   */
  export type PaymentIntentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    /**
     * Filter, which PaymentIntent to fetch.
     */
    where?: PaymentIntentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentIntents to fetch.
     */
    orderBy?: PaymentIntentOrderByWithRelationInput | PaymentIntentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PaymentIntents.
     */
    cursor?: PaymentIntentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentIntents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentIntents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PaymentIntents.
     */
    distinct?: PaymentIntentScalarFieldEnum | PaymentIntentScalarFieldEnum[]
  }

  /**
   * PaymentIntent findFirstOrThrow
   */
  export type PaymentIntentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    /**
     * Filter, which PaymentIntent to fetch.
     */
    where?: PaymentIntentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentIntents to fetch.
     */
    orderBy?: PaymentIntentOrderByWithRelationInput | PaymentIntentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PaymentIntents.
     */
    cursor?: PaymentIntentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentIntents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentIntents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PaymentIntents.
     */
    distinct?: PaymentIntentScalarFieldEnum | PaymentIntentScalarFieldEnum[]
  }

  /**
   * PaymentIntent findMany
   */
  export type PaymentIntentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    /**
     * Filter, which PaymentIntents to fetch.
     */
    where?: PaymentIntentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentIntents to fetch.
     */
    orderBy?: PaymentIntentOrderByWithRelationInput | PaymentIntentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PaymentIntents.
     */
    cursor?: PaymentIntentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentIntents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentIntents.
     */
    skip?: number
    distinct?: PaymentIntentScalarFieldEnum | PaymentIntentScalarFieldEnum[]
  }

  /**
   * PaymentIntent create
   */
  export type PaymentIntentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    /**
     * The data needed to create a PaymentIntent.
     */
    data: XOR<PaymentIntentCreateInput, PaymentIntentUncheckedCreateInput>
  }

  /**
   * PaymentIntent createMany
   */
  export type PaymentIntentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PaymentIntents.
     */
    data: PaymentIntentCreateManyInput | PaymentIntentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PaymentIntent createManyAndReturn
   */
  export type PaymentIntentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PaymentIntents.
     */
    data: PaymentIntentCreateManyInput | PaymentIntentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PaymentIntent update
   */
  export type PaymentIntentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    /**
     * The data needed to update a PaymentIntent.
     */
    data: XOR<PaymentIntentUpdateInput, PaymentIntentUncheckedUpdateInput>
    /**
     * Choose, which PaymentIntent to update.
     */
    where: PaymentIntentWhereUniqueInput
  }

  /**
   * PaymentIntent updateMany
   */
  export type PaymentIntentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PaymentIntents.
     */
    data: XOR<PaymentIntentUpdateManyMutationInput, PaymentIntentUncheckedUpdateManyInput>
    /**
     * Filter which PaymentIntents to update
     */
    where?: PaymentIntentWhereInput
  }

  /**
   * PaymentIntent upsert
   */
  export type PaymentIntentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    /**
     * The filter to search for the PaymentIntent to update in case it exists.
     */
    where: PaymentIntentWhereUniqueInput
    /**
     * In case the PaymentIntent found by the `where` argument doesn't exist, create a new PaymentIntent with this data.
     */
    create: XOR<PaymentIntentCreateInput, PaymentIntentUncheckedCreateInput>
    /**
     * In case the PaymentIntent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PaymentIntentUpdateInput, PaymentIntentUncheckedUpdateInput>
  }

  /**
   * PaymentIntent delete
   */
  export type PaymentIntentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
    /**
     * Filter which PaymentIntent to delete.
     */
    where: PaymentIntentWhereUniqueInput
  }

  /**
   * PaymentIntent deleteMany
   */
  export type PaymentIntentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PaymentIntents to delete
     */
    where?: PaymentIntentWhereInput
  }

  /**
   * PaymentIntent without action
   */
  export type PaymentIntentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIntent
     */
    select?: PaymentIntentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentIntentInclude<ExtArgs> | null
  }


  /**
   * Model Transaction
   */

  export type AggregateTransaction = {
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  export type TransactionAvgAggregateOutputType = {
    amountCents: number | null
  }

  export type TransactionSumAggregateOutputType = {
    amountCents: number | null
  }

  export type TransactionMinAggregateOutputType = {
    id: string | null
    type: $Enums.TransactionType | null
    paymentId: string | null
    paymentIntentId: string | null
    payoutId: string | null
    amountCents: number | null
    providerRef: string | null
    metadata: string | null
    createdAt: Date | null
  }

  export type TransactionMaxAggregateOutputType = {
    id: string | null
    type: $Enums.TransactionType | null
    paymentId: string | null
    paymentIntentId: string | null
    payoutId: string | null
    amountCents: number | null
    providerRef: string | null
    metadata: string | null
    createdAt: Date | null
  }

  export type TransactionCountAggregateOutputType = {
    id: number
    type: number
    paymentId: number
    paymentIntentId: number
    payoutId: number
    amountCents: number
    providerRef: number
    metadata: number
    createdAt: number
    _all: number
  }


  export type TransactionAvgAggregateInputType = {
    amountCents?: true
  }

  export type TransactionSumAggregateInputType = {
    amountCents?: true
  }

  export type TransactionMinAggregateInputType = {
    id?: true
    type?: true
    paymentId?: true
    paymentIntentId?: true
    payoutId?: true
    amountCents?: true
    providerRef?: true
    metadata?: true
    createdAt?: true
  }

  export type TransactionMaxAggregateInputType = {
    id?: true
    type?: true
    paymentId?: true
    paymentIntentId?: true
    payoutId?: true
    amountCents?: true
    providerRef?: true
    metadata?: true
    createdAt?: true
  }

  export type TransactionCountAggregateInputType = {
    id?: true
    type?: true
    paymentId?: true
    paymentIntentId?: true
    payoutId?: true
    amountCents?: true
    providerRef?: true
    metadata?: true
    createdAt?: true
    _all?: true
  }

  export type TransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transaction to aggregate.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Transactions
    **/
    _count?: true | TransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TransactionMaxAggregateInputType
  }

  export type GetTransactionAggregateType<T extends TransactionAggregateArgs> = {
        [P in keyof T & keyof AggregateTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTransaction[P]>
      : GetScalarType<T[P], AggregateTransaction[P]>
  }




  export type TransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithAggregationInput | TransactionOrderByWithAggregationInput[]
    by: TransactionScalarFieldEnum[] | TransactionScalarFieldEnum
    having?: TransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TransactionCountAggregateInputType | true
    _avg?: TransactionAvgAggregateInputType
    _sum?: TransactionSumAggregateInputType
    _min?: TransactionMinAggregateInputType
    _max?: TransactionMaxAggregateInputType
  }

  export type TransactionGroupByOutputType = {
    id: string
    type: $Enums.TransactionType
    paymentId: string | null
    paymentIntentId: string | null
    payoutId: string | null
    amountCents: number
    providerRef: string | null
    metadata: string | null
    createdAt: Date
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  type GetTransactionGroupByPayload<T extends TransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TransactionGroupByOutputType[P]>
            : GetScalarType<T[P], TransactionGroupByOutputType[P]>
        }
      >
    >


  export type TransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    paymentId?: boolean
    paymentIntentId?: boolean
    payoutId?: boolean
    amountCents?: boolean
    providerRef?: boolean
    metadata?: boolean
    createdAt?: boolean
    payment?: boolean | Transaction$paymentArgs<ExtArgs>
    payout?: boolean | Transaction$payoutArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    paymentId?: boolean
    paymentIntentId?: boolean
    payoutId?: boolean
    amountCents?: boolean
    providerRef?: boolean
    metadata?: boolean
    createdAt?: boolean
    payment?: boolean | Transaction$paymentArgs<ExtArgs>
    payout?: boolean | Transaction$payoutArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectScalar = {
    id?: boolean
    type?: boolean
    paymentId?: boolean
    paymentIntentId?: boolean
    payoutId?: boolean
    amountCents?: boolean
    providerRef?: boolean
    metadata?: boolean
    createdAt?: boolean
  }

  export type TransactionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payment?: boolean | Transaction$paymentArgs<ExtArgs>
    payout?: boolean | Transaction$payoutArgs<ExtArgs>
  }
  export type TransactionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payment?: boolean | Transaction$paymentArgs<ExtArgs>
    payout?: boolean | Transaction$payoutArgs<ExtArgs>
  }

  export type $TransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Transaction"
    objects: {
      payment: Prisma.$PaymentPayload<ExtArgs> | null
      payout: Prisma.$PayoutPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: $Enums.TransactionType
      paymentId: string | null
      paymentIntentId: string | null
      payoutId: string | null
      amountCents: number
      providerRef: string | null
      metadata: string | null
      createdAt: Date
    }, ExtArgs["result"]["transaction"]>
    composites: {}
  }

  type TransactionGetPayload<S extends boolean | null | undefined | TransactionDefaultArgs> = $Result.GetResult<Prisma.$TransactionPayload, S>

  type TransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TransactionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TransactionCountAggregateInputType | true
    }

  export interface TransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Transaction'], meta: { name: 'Transaction' } }
    /**
     * Find zero or one Transaction that matches the filter.
     * @param {TransactionFindUniqueArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TransactionFindUniqueArgs>(args: SelectSubset<T, TransactionFindUniqueArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Transaction that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TransactionFindUniqueOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, TransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Transaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TransactionFindFirstArgs>(args?: SelectSubset<T, TransactionFindFirstArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Transaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, TransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Transactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Transactions
     * const transactions = await prisma.transaction.findMany()
     * 
     * // Get first 10 Transactions
     * const transactions = await prisma.transaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const transactionWithIdOnly = await prisma.transaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TransactionFindManyArgs>(args?: SelectSubset<T, TransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Transaction.
     * @param {TransactionCreateArgs} args - Arguments to create a Transaction.
     * @example
     * // Create one Transaction
     * const Transaction = await prisma.transaction.create({
     *   data: {
     *     // ... data to create a Transaction
     *   }
     * })
     * 
     */
    create<T extends TransactionCreateArgs>(args: SelectSubset<T, TransactionCreateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Transactions.
     * @param {TransactionCreateManyArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TransactionCreateManyArgs>(args?: SelectSubset<T, TransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Transactions and returns the data saved in the database.
     * @param {TransactionCreateManyAndReturnArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Transactions and only return the `id`
     * const transactionWithIdOnly = await prisma.transaction.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, TransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Transaction.
     * @param {TransactionDeleteArgs} args - Arguments to delete one Transaction.
     * @example
     * // Delete one Transaction
     * const Transaction = await prisma.transaction.delete({
     *   where: {
     *     // ... filter to delete one Transaction
     *   }
     * })
     * 
     */
    delete<T extends TransactionDeleteArgs>(args: SelectSubset<T, TransactionDeleteArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Transaction.
     * @param {TransactionUpdateArgs} args - Arguments to update one Transaction.
     * @example
     * // Update one Transaction
     * const transaction = await prisma.transaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TransactionUpdateArgs>(args: SelectSubset<T, TransactionUpdateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Transactions.
     * @param {TransactionDeleteManyArgs} args - Arguments to filter Transactions to delete.
     * @example
     * // Delete a few Transactions
     * const { count } = await prisma.transaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TransactionDeleteManyArgs>(args?: SelectSubset<T, TransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Transactions
     * const transaction = await prisma.transaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TransactionUpdateManyArgs>(args: SelectSubset<T, TransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Transaction.
     * @param {TransactionUpsertArgs} args - Arguments to update or create a Transaction.
     * @example
     * // Update or create a Transaction
     * const transaction = await prisma.transaction.upsert({
     *   create: {
     *     // ... data to create a Transaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Transaction we want to update
     *   }
     * })
     */
    upsert<T extends TransactionUpsertArgs>(args: SelectSubset<T, TransactionUpsertArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionCountArgs} args - Arguments to filter Transactions to count.
     * @example
     * // Count the number of Transactions
     * const count = await prisma.transaction.count({
     *   where: {
     *     // ... the filter for the Transactions we want to count
     *   }
     * })
    **/
    count<T extends TransactionCountArgs>(
      args?: Subset<T, TransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends TransactionAggregateArgs>(args: Subset<T, TransactionAggregateArgs>): Prisma.PrismaPromise<GetTransactionAggregateType<T>>

    /**
     * Group by Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionGroupByArgs} args - Group by arguments.
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
      T extends TransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TransactionGroupByArgs['orderBy'] }
        : { orderBy?: TransactionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, TransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Transaction model
   */
  readonly fields: TransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Transaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    payment<T extends Transaction$paymentArgs<ExtArgs> = {}>(args?: Subset<T, Transaction$paymentArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    payout<T extends Transaction$payoutArgs<ExtArgs> = {}>(args?: Subset<T, Transaction$payoutArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
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
   * Fields of the Transaction model
   */ 
  interface TransactionFieldRefs {
    readonly id: FieldRef<"Transaction", 'String'>
    readonly type: FieldRef<"Transaction", 'TransactionType'>
    readonly paymentId: FieldRef<"Transaction", 'String'>
    readonly paymentIntentId: FieldRef<"Transaction", 'String'>
    readonly payoutId: FieldRef<"Transaction", 'String'>
    readonly amountCents: FieldRef<"Transaction", 'Int'>
    readonly providerRef: FieldRef<"Transaction", 'String'>
    readonly metadata: FieldRef<"Transaction", 'String'>
    readonly createdAt: FieldRef<"Transaction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Transaction findUnique
   */
  export type TransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findUniqueOrThrow
   */
  export type TransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findFirst
   */
  export type TransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findFirstOrThrow
   */
  export type TransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findMany
   */
  export type TransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transactions to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction create
   */
  export type TransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to create a Transaction.
     */
    data: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
  }

  /**
   * Transaction createMany
   */
  export type TransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Transaction createManyAndReturn
   */
  export type TransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Transaction update
   */
  export type TransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to update a Transaction.
     */
    data: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
    /**
     * Choose, which Transaction to update.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction updateMany
   */
  export type TransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Transactions.
     */
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyInput>
    /**
     * Filter which Transactions to update
     */
    where?: TransactionWhereInput
  }

  /**
   * Transaction upsert
   */
  export type TransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The filter to search for the Transaction to update in case it exists.
     */
    where: TransactionWhereUniqueInput
    /**
     * In case the Transaction found by the `where` argument doesn't exist, create a new Transaction with this data.
     */
    create: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
    /**
     * In case the Transaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
  }

  /**
   * Transaction delete
   */
  export type TransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter which Transaction to delete.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction deleteMany
   */
  export type TransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transactions to delete
     */
    where?: TransactionWhereInput
  }

  /**
   * Transaction.payment
   */
  export type Transaction$paymentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentInclude<ExtArgs> | null
    where?: PaymentWhereInput
  }

  /**
   * Transaction.payout
   */
  export type Transaction$payoutArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    where?: PayoutWhereInput
  }

  /**
   * Transaction without action
   */
  export type TransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
  }


  /**
   * Model Payout
   */

  export type AggregatePayout = {
    _count: PayoutCountAggregateOutputType | null
    _avg: PayoutAvgAggregateOutputType | null
    _sum: PayoutSumAggregateOutputType | null
    _min: PayoutMinAggregateOutputType | null
    _max: PayoutMaxAggregateOutputType | null
  }

  export type PayoutAvgAggregateOutputType = {
    totalCents: number | null
  }

  export type PayoutSumAggregateOutputType = {
    totalCents: number | null
  }

  export type PayoutMinAggregateOutputType = {
    id: string | null
    hostId: string | null
    totalCents: number | null
    status: $Enums.PayoutStatus | null
    providerPayoutId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PayoutMaxAggregateOutputType = {
    id: string | null
    hostId: string | null
    totalCents: number | null
    status: $Enums.PayoutStatus | null
    providerPayoutId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PayoutCountAggregateOutputType = {
    id: number
    hostId: number
    totalCents: number
    status: number
    providerPayoutId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PayoutAvgAggregateInputType = {
    totalCents?: true
  }

  export type PayoutSumAggregateInputType = {
    totalCents?: true
  }

  export type PayoutMinAggregateInputType = {
    id?: true
    hostId?: true
    totalCents?: true
    status?: true
    providerPayoutId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PayoutMaxAggregateInputType = {
    id?: true
    hostId?: true
    totalCents?: true
    status?: true
    providerPayoutId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PayoutCountAggregateInputType = {
    id?: true
    hostId?: true
    totalCents?: true
    status?: true
    providerPayoutId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PayoutAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payout to aggregate.
     */
    where?: PayoutWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payouts to fetch.
     */
    orderBy?: PayoutOrderByWithRelationInput | PayoutOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PayoutWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payouts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payouts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Payouts
    **/
    _count?: true | PayoutCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PayoutAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PayoutSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PayoutMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PayoutMaxAggregateInputType
  }

  export type GetPayoutAggregateType<T extends PayoutAggregateArgs> = {
        [P in keyof T & keyof AggregatePayout]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayout[P]>
      : GetScalarType<T[P], AggregatePayout[P]>
  }




  export type PayoutGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PayoutWhereInput
    orderBy?: PayoutOrderByWithAggregationInput | PayoutOrderByWithAggregationInput[]
    by: PayoutScalarFieldEnum[] | PayoutScalarFieldEnum
    having?: PayoutScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PayoutCountAggregateInputType | true
    _avg?: PayoutAvgAggregateInputType
    _sum?: PayoutSumAggregateInputType
    _min?: PayoutMinAggregateInputType
    _max?: PayoutMaxAggregateInputType
  }

  export type PayoutGroupByOutputType = {
    id: string
    hostId: string
    totalCents: number
    status: $Enums.PayoutStatus
    providerPayoutId: string | null
    createdAt: Date
    updatedAt: Date
    _count: PayoutCountAggregateOutputType | null
    _avg: PayoutAvgAggregateOutputType | null
    _sum: PayoutSumAggregateOutputType | null
    _min: PayoutMinAggregateOutputType | null
    _max: PayoutMaxAggregateOutputType | null
  }

  type GetPayoutGroupByPayload<T extends PayoutGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PayoutGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PayoutGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PayoutGroupByOutputType[P]>
            : GetScalarType<T[P], PayoutGroupByOutputType[P]>
        }
      >
    >


  export type PayoutSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostId?: boolean
    totalCents?: boolean
    status?: boolean
    providerPayoutId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    payments?: boolean | Payout$paymentsArgs<ExtArgs>
    transactions?: boolean | Payout$transactionsArgs<ExtArgs>
    _count?: boolean | PayoutCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payout"]>

  export type PayoutSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostId?: boolean
    totalCents?: boolean
    status?: boolean
    providerPayoutId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["payout"]>

  export type PayoutSelectScalar = {
    id?: boolean
    hostId?: boolean
    totalCents?: boolean
    status?: boolean
    providerPayoutId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PayoutInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payments?: boolean | Payout$paymentsArgs<ExtArgs>
    transactions?: boolean | Payout$transactionsArgs<ExtArgs>
    _count?: boolean | PayoutCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PayoutIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PayoutPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Payout"
    objects: {
      payments: Prisma.$PayoutPaymentPayload<ExtArgs>[]
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      hostId: string
      totalCents: number
      status: $Enums.PayoutStatus
      providerPayoutId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["payout"]>
    composites: {}
  }

  type PayoutGetPayload<S extends boolean | null | undefined | PayoutDefaultArgs> = $Result.GetResult<Prisma.$PayoutPayload, S>

  type PayoutCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PayoutFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PayoutCountAggregateInputType | true
    }

  export interface PayoutDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Payout'], meta: { name: 'Payout' } }
    /**
     * Find zero or one Payout that matches the filter.
     * @param {PayoutFindUniqueArgs} args - Arguments to find a Payout
     * @example
     * // Get one Payout
     * const payout = await prisma.payout.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PayoutFindUniqueArgs>(args: SelectSubset<T, PayoutFindUniqueArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Payout that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PayoutFindUniqueOrThrowArgs} args - Arguments to find a Payout
     * @example
     * // Get one Payout
     * const payout = await prisma.payout.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PayoutFindUniqueOrThrowArgs>(args: SelectSubset<T, PayoutFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Payout that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutFindFirstArgs} args - Arguments to find a Payout
     * @example
     * // Get one Payout
     * const payout = await prisma.payout.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PayoutFindFirstArgs>(args?: SelectSubset<T, PayoutFindFirstArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Payout that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutFindFirstOrThrowArgs} args - Arguments to find a Payout
     * @example
     * // Get one Payout
     * const payout = await prisma.payout.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PayoutFindFirstOrThrowArgs>(args?: SelectSubset<T, PayoutFindFirstOrThrowArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Payouts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Payouts
     * const payouts = await prisma.payout.findMany()
     * 
     * // Get first 10 Payouts
     * const payouts = await prisma.payout.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const payoutWithIdOnly = await prisma.payout.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PayoutFindManyArgs>(args?: SelectSubset<T, PayoutFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Payout.
     * @param {PayoutCreateArgs} args - Arguments to create a Payout.
     * @example
     * // Create one Payout
     * const Payout = await prisma.payout.create({
     *   data: {
     *     // ... data to create a Payout
     *   }
     * })
     * 
     */
    create<T extends PayoutCreateArgs>(args: SelectSubset<T, PayoutCreateArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Payouts.
     * @param {PayoutCreateManyArgs} args - Arguments to create many Payouts.
     * @example
     * // Create many Payouts
     * const payout = await prisma.payout.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PayoutCreateManyArgs>(args?: SelectSubset<T, PayoutCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Payouts and returns the data saved in the database.
     * @param {PayoutCreateManyAndReturnArgs} args - Arguments to create many Payouts.
     * @example
     * // Create many Payouts
     * const payout = await prisma.payout.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Payouts and only return the `id`
     * const payoutWithIdOnly = await prisma.payout.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PayoutCreateManyAndReturnArgs>(args?: SelectSubset<T, PayoutCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Payout.
     * @param {PayoutDeleteArgs} args - Arguments to delete one Payout.
     * @example
     * // Delete one Payout
     * const Payout = await prisma.payout.delete({
     *   where: {
     *     // ... filter to delete one Payout
     *   }
     * })
     * 
     */
    delete<T extends PayoutDeleteArgs>(args: SelectSubset<T, PayoutDeleteArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Payout.
     * @param {PayoutUpdateArgs} args - Arguments to update one Payout.
     * @example
     * // Update one Payout
     * const payout = await prisma.payout.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PayoutUpdateArgs>(args: SelectSubset<T, PayoutUpdateArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Payouts.
     * @param {PayoutDeleteManyArgs} args - Arguments to filter Payouts to delete.
     * @example
     * // Delete a few Payouts
     * const { count } = await prisma.payout.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PayoutDeleteManyArgs>(args?: SelectSubset<T, PayoutDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payouts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Payouts
     * const payout = await prisma.payout.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PayoutUpdateManyArgs>(args: SelectSubset<T, PayoutUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Payout.
     * @param {PayoutUpsertArgs} args - Arguments to update or create a Payout.
     * @example
     * // Update or create a Payout
     * const payout = await prisma.payout.upsert({
     *   create: {
     *     // ... data to create a Payout
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Payout we want to update
     *   }
     * })
     */
    upsert<T extends PayoutUpsertArgs>(args: SelectSubset<T, PayoutUpsertArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Payouts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutCountArgs} args - Arguments to filter Payouts to count.
     * @example
     * // Count the number of Payouts
     * const count = await prisma.payout.count({
     *   where: {
     *     // ... the filter for the Payouts we want to count
     *   }
     * })
    **/
    count<T extends PayoutCountArgs>(
      args?: Subset<T, PayoutCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PayoutCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Payout.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PayoutAggregateArgs>(args: Subset<T, PayoutAggregateArgs>): Prisma.PrismaPromise<GetPayoutAggregateType<T>>

    /**
     * Group by Payout.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutGroupByArgs} args - Group by arguments.
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
      T extends PayoutGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PayoutGroupByArgs['orderBy'] }
        : { orderBy?: PayoutGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PayoutGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPayoutGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Payout model
   */
  readonly fields: PayoutFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Payout.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PayoutClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    payments<T extends Payout$paymentsArgs<ExtArgs> = {}>(args?: Subset<T, Payout$paymentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "findMany"> | Null>
    transactions<T extends Payout$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Payout$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the Payout model
   */ 
  interface PayoutFieldRefs {
    readonly id: FieldRef<"Payout", 'String'>
    readonly hostId: FieldRef<"Payout", 'String'>
    readonly totalCents: FieldRef<"Payout", 'Int'>
    readonly status: FieldRef<"Payout", 'PayoutStatus'>
    readonly providerPayoutId: FieldRef<"Payout", 'String'>
    readonly createdAt: FieldRef<"Payout", 'DateTime'>
    readonly updatedAt: FieldRef<"Payout", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Payout findUnique
   */
  export type PayoutFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payout to fetch.
     */
    where: PayoutWhereUniqueInput
  }

  /**
   * Payout findUniqueOrThrow
   */
  export type PayoutFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payout to fetch.
     */
    where: PayoutWhereUniqueInput
  }

  /**
   * Payout findFirst
   */
  export type PayoutFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payout to fetch.
     */
    where?: PayoutWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payouts to fetch.
     */
    orderBy?: PayoutOrderByWithRelationInput | PayoutOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payouts.
     */
    cursor?: PayoutWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payouts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payouts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payouts.
     */
    distinct?: PayoutScalarFieldEnum | PayoutScalarFieldEnum[]
  }

  /**
   * Payout findFirstOrThrow
   */
  export type PayoutFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payout to fetch.
     */
    where?: PayoutWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payouts to fetch.
     */
    orderBy?: PayoutOrderByWithRelationInput | PayoutOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payouts.
     */
    cursor?: PayoutWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payouts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payouts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payouts.
     */
    distinct?: PayoutScalarFieldEnum | PayoutScalarFieldEnum[]
  }

  /**
   * Payout findMany
   */
  export type PayoutFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payouts to fetch.
     */
    where?: PayoutWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payouts to fetch.
     */
    orderBy?: PayoutOrderByWithRelationInput | PayoutOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Payouts.
     */
    cursor?: PayoutWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payouts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payouts.
     */
    skip?: number
    distinct?: PayoutScalarFieldEnum | PayoutScalarFieldEnum[]
  }

  /**
   * Payout create
   */
  export type PayoutCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * The data needed to create a Payout.
     */
    data: XOR<PayoutCreateInput, PayoutUncheckedCreateInput>
  }

  /**
   * Payout createMany
   */
  export type PayoutCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Payouts.
     */
    data: PayoutCreateManyInput | PayoutCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payout createManyAndReturn
   */
  export type PayoutCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Payouts.
     */
    data: PayoutCreateManyInput | PayoutCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payout update
   */
  export type PayoutUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * The data needed to update a Payout.
     */
    data: XOR<PayoutUpdateInput, PayoutUncheckedUpdateInput>
    /**
     * Choose, which Payout to update.
     */
    where: PayoutWhereUniqueInput
  }

  /**
   * Payout updateMany
   */
  export type PayoutUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Payouts.
     */
    data: XOR<PayoutUpdateManyMutationInput, PayoutUncheckedUpdateManyInput>
    /**
     * Filter which Payouts to update
     */
    where?: PayoutWhereInput
  }

  /**
   * Payout upsert
   */
  export type PayoutUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * The filter to search for the Payout to update in case it exists.
     */
    where: PayoutWhereUniqueInput
    /**
     * In case the Payout found by the `where` argument doesn't exist, create a new Payout with this data.
     */
    create: XOR<PayoutCreateInput, PayoutUncheckedCreateInput>
    /**
     * In case the Payout was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PayoutUpdateInput, PayoutUncheckedUpdateInput>
  }

  /**
   * Payout delete
   */
  export type PayoutDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter which Payout to delete.
     */
    where: PayoutWhereUniqueInput
  }

  /**
   * Payout deleteMany
   */
  export type PayoutDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payouts to delete
     */
    where?: PayoutWhereInput
  }

  /**
   * Payout.payments
   */
  export type Payout$paymentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    where?: PayoutPaymentWhereInput
    orderBy?: PayoutPaymentOrderByWithRelationInput | PayoutPaymentOrderByWithRelationInput[]
    cursor?: PayoutPaymentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PayoutPaymentScalarFieldEnum | PayoutPaymentScalarFieldEnum[]
  }

  /**
   * Payout.transactions
   */
  export type Payout$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Payout without action
   */
  export type PayoutDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
  }


  /**
   * Model PayoutPayment
   */

  export type AggregatePayoutPayment = {
    _count: PayoutPaymentCountAggregateOutputType | null
    _min: PayoutPaymentMinAggregateOutputType | null
    _max: PayoutPaymentMaxAggregateOutputType | null
  }

  export type PayoutPaymentMinAggregateOutputType = {
    payoutId: string | null
    paymentId: string | null
    createdAt: Date | null
  }

  export type PayoutPaymentMaxAggregateOutputType = {
    payoutId: string | null
    paymentId: string | null
    createdAt: Date | null
  }

  export type PayoutPaymentCountAggregateOutputType = {
    payoutId: number
    paymentId: number
    createdAt: number
    _all: number
  }


  export type PayoutPaymentMinAggregateInputType = {
    payoutId?: true
    paymentId?: true
    createdAt?: true
  }

  export type PayoutPaymentMaxAggregateInputType = {
    payoutId?: true
    paymentId?: true
    createdAt?: true
  }

  export type PayoutPaymentCountAggregateInputType = {
    payoutId?: true
    paymentId?: true
    createdAt?: true
    _all?: true
  }

  export type PayoutPaymentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PayoutPayment to aggregate.
     */
    where?: PayoutPaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutPayments to fetch.
     */
    orderBy?: PayoutPaymentOrderByWithRelationInput | PayoutPaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PayoutPaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutPayments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutPayments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PayoutPayments
    **/
    _count?: true | PayoutPaymentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PayoutPaymentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PayoutPaymentMaxAggregateInputType
  }

  export type GetPayoutPaymentAggregateType<T extends PayoutPaymentAggregateArgs> = {
        [P in keyof T & keyof AggregatePayoutPayment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayoutPayment[P]>
      : GetScalarType<T[P], AggregatePayoutPayment[P]>
  }




  export type PayoutPaymentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PayoutPaymentWhereInput
    orderBy?: PayoutPaymentOrderByWithAggregationInput | PayoutPaymentOrderByWithAggregationInput[]
    by: PayoutPaymentScalarFieldEnum[] | PayoutPaymentScalarFieldEnum
    having?: PayoutPaymentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PayoutPaymentCountAggregateInputType | true
    _min?: PayoutPaymentMinAggregateInputType
    _max?: PayoutPaymentMaxAggregateInputType
  }

  export type PayoutPaymentGroupByOutputType = {
    payoutId: string
    paymentId: string
    createdAt: Date
    _count: PayoutPaymentCountAggregateOutputType | null
    _min: PayoutPaymentMinAggregateOutputType | null
    _max: PayoutPaymentMaxAggregateOutputType | null
  }

  type GetPayoutPaymentGroupByPayload<T extends PayoutPaymentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PayoutPaymentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PayoutPaymentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PayoutPaymentGroupByOutputType[P]>
            : GetScalarType<T[P], PayoutPaymentGroupByOutputType[P]>
        }
      >
    >


  export type PayoutPaymentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    payoutId?: boolean
    paymentId?: boolean
    createdAt?: boolean
    payout?: boolean | PayoutDefaultArgs<ExtArgs>
    payment?: boolean | PaymentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payoutPayment"]>

  export type PayoutPaymentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    payoutId?: boolean
    paymentId?: boolean
    createdAt?: boolean
    payout?: boolean | PayoutDefaultArgs<ExtArgs>
    payment?: boolean | PaymentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payoutPayment"]>

  export type PayoutPaymentSelectScalar = {
    payoutId?: boolean
    paymentId?: boolean
    createdAt?: boolean
  }

  export type PayoutPaymentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payout?: boolean | PayoutDefaultArgs<ExtArgs>
    payment?: boolean | PaymentDefaultArgs<ExtArgs>
  }
  export type PayoutPaymentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    payout?: boolean | PayoutDefaultArgs<ExtArgs>
    payment?: boolean | PaymentDefaultArgs<ExtArgs>
  }

  export type $PayoutPaymentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PayoutPayment"
    objects: {
      payout: Prisma.$PayoutPayload<ExtArgs>
      payment: Prisma.$PaymentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      payoutId: string
      paymentId: string
      createdAt: Date
    }, ExtArgs["result"]["payoutPayment"]>
    composites: {}
  }

  type PayoutPaymentGetPayload<S extends boolean | null | undefined | PayoutPaymentDefaultArgs> = $Result.GetResult<Prisma.$PayoutPaymentPayload, S>

  type PayoutPaymentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PayoutPaymentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PayoutPaymentCountAggregateInputType | true
    }

  export interface PayoutPaymentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PayoutPayment'], meta: { name: 'PayoutPayment' } }
    /**
     * Find zero or one PayoutPayment that matches the filter.
     * @param {PayoutPaymentFindUniqueArgs} args - Arguments to find a PayoutPayment
     * @example
     * // Get one PayoutPayment
     * const payoutPayment = await prisma.payoutPayment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PayoutPaymentFindUniqueArgs>(args: SelectSubset<T, PayoutPaymentFindUniqueArgs<ExtArgs>>): Prisma__PayoutPaymentClient<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PayoutPayment that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PayoutPaymentFindUniqueOrThrowArgs} args - Arguments to find a PayoutPayment
     * @example
     * // Get one PayoutPayment
     * const payoutPayment = await prisma.payoutPayment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PayoutPaymentFindUniqueOrThrowArgs>(args: SelectSubset<T, PayoutPaymentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PayoutPaymentClient<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PayoutPayment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutPaymentFindFirstArgs} args - Arguments to find a PayoutPayment
     * @example
     * // Get one PayoutPayment
     * const payoutPayment = await prisma.payoutPayment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PayoutPaymentFindFirstArgs>(args?: SelectSubset<T, PayoutPaymentFindFirstArgs<ExtArgs>>): Prisma__PayoutPaymentClient<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PayoutPayment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutPaymentFindFirstOrThrowArgs} args - Arguments to find a PayoutPayment
     * @example
     * // Get one PayoutPayment
     * const payoutPayment = await prisma.payoutPayment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PayoutPaymentFindFirstOrThrowArgs>(args?: SelectSubset<T, PayoutPaymentFindFirstOrThrowArgs<ExtArgs>>): Prisma__PayoutPaymentClient<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PayoutPayments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutPaymentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PayoutPayments
     * const payoutPayments = await prisma.payoutPayment.findMany()
     * 
     * // Get first 10 PayoutPayments
     * const payoutPayments = await prisma.payoutPayment.findMany({ take: 10 })
     * 
     * // Only select the `payoutId`
     * const payoutPaymentWithPayoutIdOnly = await prisma.payoutPayment.findMany({ select: { payoutId: true } })
     * 
     */
    findMany<T extends PayoutPaymentFindManyArgs>(args?: SelectSubset<T, PayoutPaymentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PayoutPayment.
     * @param {PayoutPaymentCreateArgs} args - Arguments to create a PayoutPayment.
     * @example
     * // Create one PayoutPayment
     * const PayoutPayment = await prisma.payoutPayment.create({
     *   data: {
     *     // ... data to create a PayoutPayment
     *   }
     * })
     * 
     */
    create<T extends PayoutPaymentCreateArgs>(args: SelectSubset<T, PayoutPaymentCreateArgs<ExtArgs>>): Prisma__PayoutPaymentClient<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PayoutPayments.
     * @param {PayoutPaymentCreateManyArgs} args - Arguments to create many PayoutPayments.
     * @example
     * // Create many PayoutPayments
     * const payoutPayment = await prisma.payoutPayment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PayoutPaymentCreateManyArgs>(args?: SelectSubset<T, PayoutPaymentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PayoutPayments and returns the data saved in the database.
     * @param {PayoutPaymentCreateManyAndReturnArgs} args - Arguments to create many PayoutPayments.
     * @example
     * // Create many PayoutPayments
     * const payoutPayment = await prisma.payoutPayment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PayoutPayments and only return the `payoutId`
     * const payoutPaymentWithPayoutIdOnly = await prisma.payoutPayment.createManyAndReturn({ 
     *   select: { payoutId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PayoutPaymentCreateManyAndReturnArgs>(args?: SelectSubset<T, PayoutPaymentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PayoutPayment.
     * @param {PayoutPaymentDeleteArgs} args - Arguments to delete one PayoutPayment.
     * @example
     * // Delete one PayoutPayment
     * const PayoutPayment = await prisma.payoutPayment.delete({
     *   where: {
     *     // ... filter to delete one PayoutPayment
     *   }
     * })
     * 
     */
    delete<T extends PayoutPaymentDeleteArgs>(args: SelectSubset<T, PayoutPaymentDeleteArgs<ExtArgs>>): Prisma__PayoutPaymentClient<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PayoutPayment.
     * @param {PayoutPaymentUpdateArgs} args - Arguments to update one PayoutPayment.
     * @example
     * // Update one PayoutPayment
     * const payoutPayment = await prisma.payoutPayment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PayoutPaymentUpdateArgs>(args: SelectSubset<T, PayoutPaymentUpdateArgs<ExtArgs>>): Prisma__PayoutPaymentClient<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PayoutPayments.
     * @param {PayoutPaymentDeleteManyArgs} args - Arguments to filter PayoutPayments to delete.
     * @example
     * // Delete a few PayoutPayments
     * const { count } = await prisma.payoutPayment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PayoutPaymentDeleteManyArgs>(args?: SelectSubset<T, PayoutPaymentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PayoutPayments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutPaymentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PayoutPayments
     * const payoutPayment = await prisma.payoutPayment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PayoutPaymentUpdateManyArgs>(args: SelectSubset<T, PayoutPaymentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PayoutPayment.
     * @param {PayoutPaymentUpsertArgs} args - Arguments to update or create a PayoutPayment.
     * @example
     * // Update or create a PayoutPayment
     * const payoutPayment = await prisma.payoutPayment.upsert({
     *   create: {
     *     // ... data to create a PayoutPayment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PayoutPayment we want to update
     *   }
     * })
     */
    upsert<T extends PayoutPaymentUpsertArgs>(args: SelectSubset<T, PayoutPaymentUpsertArgs<ExtArgs>>): Prisma__PayoutPaymentClient<$Result.GetResult<Prisma.$PayoutPaymentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PayoutPayments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutPaymentCountArgs} args - Arguments to filter PayoutPayments to count.
     * @example
     * // Count the number of PayoutPayments
     * const count = await prisma.payoutPayment.count({
     *   where: {
     *     // ... the filter for the PayoutPayments we want to count
     *   }
     * })
    **/
    count<T extends PayoutPaymentCountArgs>(
      args?: Subset<T, PayoutPaymentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PayoutPaymentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PayoutPayment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutPaymentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PayoutPaymentAggregateArgs>(args: Subset<T, PayoutPaymentAggregateArgs>): Prisma.PrismaPromise<GetPayoutPaymentAggregateType<T>>

    /**
     * Group by PayoutPayment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutPaymentGroupByArgs} args - Group by arguments.
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
      T extends PayoutPaymentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PayoutPaymentGroupByArgs['orderBy'] }
        : { orderBy?: PayoutPaymentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PayoutPaymentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPayoutPaymentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PayoutPayment model
   */
  readonly fields: PayoutPaymentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PayoutPayment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PayoutPaymentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    payout<T extends PayoutDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PayoutDefaultArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    payment<T extends PaymentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PaymentDefaultArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the PayoutPayment model
   */ 
  interface PayoutPaymentFieldRefs {
    readonly payoutId: FieldRef<"PayoutPayment", 'String'>
    readonly paymentId: FieldRef<"PayoutPayment", 'String'>
    readonly createdAt: FieldRef<"PayoutPayment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PayoutPayment findUnique
   */
  export type PayoutPaymentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    /**
     * Filter, which PayoutPayment to fetch.
     */
    where: PayoutPaymentWhereUniqueInput
  }

  /**
   * PayoutPayment findUniqueOrThrow
   */
  export type PayoutPaymentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    /**
     * Filter, which PayoutPayment to fetch.
     */
    where: PayoutPaymentWhereUniqueInput
  }

  /**
   * PayoutPayment findFirst
   */
  export type PayoutPaymentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    /**
     * Filter, which PayoutPayment to fetch.
     */
    where?: PayoutPaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutPayments to fetch.
     */
    orderBy?: PayoutPaymentOrderByWithRelationInput | PayoutPaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PayoutPayments.
     */
    cursor?: PayoutPaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutPayments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutPayments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PayoutPayments.
     */
    distinct?: PayoutPaymentScalarFieldEnum | PayoutPaymentScalarFieldEnum[]
  }

  /**
   * PayoutPayment findFirstOrThrow
   */
  export type PayoutPaymentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    /**
     * Filter, which PayoutPayment to fetch.
     */
    where?: PayoutPaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutPayments to fetch.
     */
    orderBy?: PayoutPaymentOrderByWithRelationInput | PayoutPaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PayoutPayments.
     */
    cursor?: PayoutPaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutPayments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutPayments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PayoutPayments.
     */
    distinct?: PayoutPaymentScalarFieldEnum | PayoutPaymentScalarFieldEnum[]
  }

  /**
   * PayoutPayment findMany
   */
  export type PayoutPaymentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    /**
     * Filter, which PayoutPayments to fetch.
     */
    where?: PayoutPaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutPayments to fetch.
     */
    orderBy?: PayoutPaymentOrderByWithRelationInput | PayoutPaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PayoutPayments.
     */
    cursor?: PayoutPaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutPayments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutPayments.
     */
    skip?: number
    distinct?: PayoutPaymentScalarFieldEnum | PayoutPaymentScalarFieldEnum[]
  }

  /**
   * PayoutPayment create
   */
  export type PayoutPaymentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    /**
     * The data needed to create a PayoutPayment.
     */
    data: XOR<PayoutPaymentCreateInput, PayoutPaymentUncheckedCreateInput>
  }

  /**
   * PayoutPayment createMany
   */
  export type PayoutPaymentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PayoutPayments.
     */
    data: PayoutPaymentCreateManyInput | PayoutPaymentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PayoutPayment createManyAndReturn
   */
  export type PayoutPaymentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PayoutPayments.
     */
    data: PayoutPaymentCreateManyInput | PayoutPaymentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PayoutPayment update
   */
  export type PayoutPaymentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    /**
     * The data needed to update a PayoutPayment.
     */
    data: XOR<PayoutPaymentUpdateInput, PayoutPaymentUncheckedUpdateInput>
    /**
     * Choose, which PayoutPayment to update.
     */
    where: PayoutPaymentWhereUniqueInput
  }

  /**
   * PayoutPayment updateMany
   */
  export type PayoutPaymentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PayoutPayments.
     */
    data: XOR<PayoutPaymentUpdateManyMutationInput, PayoutPaymentUncheckedUpdateManyInput>
    /**
     * Filter which PayoutPayments to update
     */
    where?: PayoutPaymentWhereInput
  }

  /**
   * PayoutPayment upsert
   */
  export type PayoutPaymentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    /**
     * The filter to search for the PayoutPayment to update in case it exists.
     */
    where: PayoutPaymentWhereUniqueInput
    /**
     * In case the PayoutPayment found by the `where` argument doesn't exist, create a new PayoutPayment with this data.
     */
    create: XOR<PayoutPaymentCreateInput, PayoutPaymentUncheckedCreateInput>
    /**
     * In case the PayoutPayment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PayoutPaymentUpdateInput, PayoutPaymentUncheckedUpdateInput>
  }

  /**
   * PayoutPayment delete
   */
  export type PayoutPaymentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
    /**
     * Filter which PayoutPayment to delete.
     */
    where: PayoutPaymentWhereUniqueInput
  }

  /**
   * PayoutPayment deleteMany
   */
  export type PayoutPaymentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PayoutPayments to delete
     */
    where?: PayoutPaymentWhereInput
  }

  /**
   * PayoutPayment without action
   */
  export type PayoutPaymentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutPayment
     */
    select?: PayoutPaymentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutPaymentInclude<ExtArgs> | null
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


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    role: 'role',
    name: 'name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ShortTermListingScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    address: 'address',
    city: 'city',
    country: 'country',
    latitude: 'latitude',
    longitude: 'longitude',
    nightPriceCents: 'nightPriceCents',
    beds: 'beds',
    baths: 'baths',
    maxGuests: 'maxGuests',
    photos: 'photos',
    verificationStatus: 'verificationStatus',
    cadastreNumber: 'cadastreNumber',
    verificationDocUrl: 'verificationDocUrl',
    verifiedAt: 'verifiedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    ownerId: 'ownerId'
  };

  export type ShortTermListingScalarFieldEnum = (typeof ShortTermListingScalarFieldEnum)[keyof typeof ShortTermListingScalarFieldEnum]


  export const BookingScalarFieldEnum: {
    id: 'id',
    checkIn: 'checkIn',
    checkOut: 'checkOut',
    nights: 'nights',
    totalCents: 'totalCents',
    guestFeeCents: 'guestFeeCents',
    hostFeeCents: 'hostFeeCents',
    status: 'status',
    guestNotes: 'guestNotes',
    checkedInAt: 'checkedInAt',
    checkedOutAt: 'checkedOutAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    guestId: 'guestId',
    listingId: 'listingId'
  };

  export type BookingScalarFieldEnum = (typeof BookingScalarFieldEnum)[keyof typeof BookingScalarFieldEnum]


  export const PaymentScalarFieldEnum: {
    id: 'id',
    amountCents: 'amountCents',
    guestFeeCents: 'guestFeeCents',
    hostFeeCents: 'hostFeeCents',
    hostPayoutCents: 'hostPayoutCents',
    status: 'status',
    stripePaymentId: 'stripePaymentId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    bookingId: 'bookingId'
  };

  export type PaymentScalarFieldEnum = (typeof PaymentScalarFieldEnum)[keyof typeof PaymentScalarFieldEnum]


  export const PaymentIntentScalarFieldEnum: {
    id: 'id',
    bookingId: 'bookingId',
    paymentId: 'paymentId',
    amountCents: 'amountCents',
    currency: 'currency',
    providerIntentId: 'providerIntentId',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PaymentIntentScalarFieldEnum = (typeof PaymentIntentScalarFieldEnum)[keyof typeof PaymentIntentScalarFieldEnum]


  export const TransactionScalarFieldEnum: {
    id: 'id',
    type: 'type',
    paymentId: 'paymentId',
    paymentIntentId: 'paymentIntentId',
    payoutId: 'payoutId',
    amountCents: 'amountCents',
    providerRef: 'providerRef',
    metadata: 'metadata',
    createdAt: 'createdAt'
  };

  export type TransactionScalarFieldEnum = (typeof TransactionScalarFieldEnum)[keyof typeof TransactionScalarFieldEnum]


  export const PayoutScalarFieldEnum: {
    id: 'id',
    hostId: 'hostId',
    totalCents: 'totalCents',
    status: 'status',
    providerPayoutId: 'providerPayoutId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PayoutScalarFieldEnum = (typeof PayoutScalarFieldEnum)[keyof typeof PayoutScalarFieldEnum]


  export const PayoutPaymentScalarFieldEnum: {
    payoutId: 'payoutId',
    paymentId: 'paymentId',
    createdAt: 'createdAt'
  };

  export type PayoutPaymentScalarFieldEnum = (typeof PayoutPaymentScalarFieldEnum)[keyof typeof PayoutPaymentScalarFieldEnum]


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
   * Reference to a field of type 'PlatformRole'
   */
  export type EnumPlatformRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PlatformRole'>
    


  /**
   * Reference to a field of type 'PlatformRole[]'
   */
  export type ListEnumPlatformRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PlatformRole[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'VerificationStatus'
   */
  export type EnumVerificationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationStatus'>
    


  /**
   * Reference to a field of type 'VerificationStatus[]'
   */
  export type ListEnumVerificationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationStatus[]'>
    


  /**
   * Reference to a field of type 'BookingStatus'
   */
  export type EnumBookingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BookingStatus'>
    


  /**
   * Reference to a field of type 'BookingStatus[]'
   */
  export type ListEnumBookingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BookingStatus[]'>
    


  /**
   * Reference to a field of type 'PaymentStatus'
   */
  export type EnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus'>
    


  /**
   * Reference to a field of type 'PaymentStatus[]'
   */
  export type ListEnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus[]'>
    


  /**
   * Reference to a field of type 'IntentStatus'
   */
  export type EnumIntentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntentStatus'>
    


  /**
   * Reference to a field of type 'IntentStatus[]'
   */
  export type ListEnumIntentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'IntentStatus[]'>
    


  /**
   * Reference to a field of type 'TransactionType'
   */
  export type EnumTransactionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionType'>
    


  /**
   * Reference to a field of type 'TransactionType[]'
   */
  export type ListEnumTransactionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionType[]'>
    


  /**
   * Reference to a field of type 'PayoutStatus'
   */
  export type EnumPayoutStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PayoutStatus'>
    


  /**
   * Reference to a field of type 'PayoutStatus[]'
   */
  export type ListEnumPayoutStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PayoutStatus[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    role?: EnumPlatformRoleFilter<"User"> | $Enums.PlatformRole
    name?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    shortTermListings?: ShortTermListingListRelationFilter
    bookingsAsGuest?: BookingListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    role?: SortOrder
    name?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shortTermListings?: ShortTermListingOrderByRelationAggregateInput
    bookingsAsGuest?: BookingOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    role?: EnumPlatformRoleFilter<"User"> | $Enums.PlatformRole
    name?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    shortTermListings?: ShortTermListingListRelationFilter
    bookingsAsGuest?: BookingListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    role?: SortOrder
    name?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    role?: EnumPlatformRoleWithAggregatesFilter<"User"> | $Enums.PlatformRole
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type ShortTermListingWhereInput = {
    AND?: ShortTermListingWhereInput | ShortTermListingWhereInput[]
    OR?: ShortTermListingWhereInput[]
    NOT?: ShortTermListingWhereInput | ShortTermListingWhereInput[]
    id?: StringFilter<"ShortTermListing"> | string
    title?: StringFilter<"ShortTermListing"> | string
    description?: StringNullableFilter<"ShortTermListing"> | string | null
    address?: StringFilter<"ShortTermListing"> | string
    city?: StringFilter<"ShortTermListing"> | string
    country?: StringFilter<"ShortTermListing"> | string
    latitude?: FloatNullableFilter<"ShortTermListing"> | number | null
    longitude?: FloatNullableFilter<"ShortTermListing"> | number | null
    nightPriceCents?: IntFilter<"ShortTermListing"> | number
    beds?: IntFilter<"ShortTermListing"> | number
    baths?: FloatFilter<"ShortTermListing"> | number
    maxGuests?: IntFilter<"ShortTermListing"> | number
    photos?: StringNullableListFilter<"ShortTermListing">
    verificationStatus?: EnumVerificationStatusFilter<"ShortTermListing"> | $Enums.VerificationStatus
    cadastreNumber?: StringNullableFilter<"ShortTermListing"> | string | null
    verificationDocUrl?: StringNullableFilter<"ShortTermListing"> | string | null
    verifiedAt?: DateTimeNullableFilter<"ShortTermListing"> | Date | string | null
    createdAt?: DateTimeFilter<"ShortTermListing"> | Date | string
    updatedAt?: DateTimeFilter<"ShortTermListing"> | Date | string
    ownerId?: StringFilter<"ShortTermListing"> | string
    owner?: XOR<UserRelationFilter, UserWhereInput>
    bookings?: BookingListRelationFilter
  }

  export type ShortTermListingOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    address?: SortOrder
    city?: SortOrder
    country?: SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    nightPriceCents?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    maxGuests?: SortOrder
    photos?: SortOrder
    verificationStatus?: SortOrder
    cadastreNumber?: SortOrderInput | SortOrder
    verificationDocUrl?: SortOrderInput | SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ownerId?: SortOrder
    owner?: UserOrderByWithRelationInput
    bookings?: BookingOrderByRelationAggregateInput
  }

  export type ShortTermListingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ShortTermListingWhereInput | ShortTermListingWhereInput[]
    OR?: ShortTermListingWhereInput[]
    NOT?: ShortTermListingWhereInput | ShortTermListingWhereInput[]
    title?: StringFilter<"ShortTermListing"> | string
    description?: StringNullableFilter<"ShortTermListing"> | string | null
    address?: StringFilter<"ShortTermListing"> | string
    city?: StringFilter<"ShortTermListing"> | string
    country?: StringFilter<"ShortTermListing"> | string
    latitude?: FloatNullableFilter<"ShortTermListing"> | number | null
    longitude?: FloatNullableFilter<"ShortTermListing"> | number | null
    nightPriceCents?: IntFilter<"ShortTermListing"> | number
    beds?: IntFilter<"ShortTermListing"> | number
    baths?: FloatFilter<"ShortTermListing"> | number
    maxGuests?: IntFilter<"ShortTermListing"> | number
    photos?: StringNullableListFilter<"ShortTermListing">
    verificationStatus?: EnumVerificationStatusFilter<"ShortTermListing"> | $Enums.VerificationStatus
    cadastreNumber?: StringNullableFilter<"ShortTermListing"> | string | null
    verificationDocUrl?: StringNullableFilter<"ShortTermListing"> | string | null
    verifiedAt?: DateTimeNullableFilter<"ShortTermListing"> | Date | string | null
    createdAt?: DateTimeFilter<"ShortTermListing"> | Date | string
    updatedAt?: DateTimeFilter<"ShortTermListing"> | Date | string
    ownerId?: StringFilter<"ShortTermListing"> | string
    owner?: XOR<UserRelationFilter, UserWhereInput>
    bookings?: BookingListRelationFilter
  }, "id">

  export type ShortTermListingOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    address?: SortOrder
    city?: SortOrder
    country?: SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    nightPriceCents?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    maxGuests?: SortOrder
    photos?: SortOrder
    verificationStatus?: SortOrder
    cadastreNumber?: SortOrderInput | SortOrder
    verificationDocUrl?: SortOrderInput | SortOrder
    verifiedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ownerId?: SortOrder
    _count?: ShortTermListingCountOrderByAggregateInput
    _avg?: ShortTermListingAvgOrderByAggregateInput
    _max?: ShortTermListingMaxOrderByAggregateInput
    _min?: ShortTermListingMinOrderByAggregateInput
    _sum?: ShortTermListingSumOrderByAggregateInput
  }

  export type ShortTermListingScalarWhereWithAggregatesInput = {
    AND?: ShortTermListingScalarWhereWithAggregatesInput | ShortTermListingScalarWhereWithAggregatesInput[]
    OR?: ShortTermListingScalarWhereWithAggregatesInput[]
    NOT?: ShortTermListingScalarWhereWithAggregatesInput | ShortTermListingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ShortTermListing"> | string
    title?: StringWithAggregatesFilter<"ShortTermListing"> | string
    description?: StringNullableWithAggregatesFilter<"ShortTermListing"> | string | null
    address?: StringWithAggregatesFilter<"ShortTermListing"> | string
    city?: StringWithAggregatesFilter<"ShortTermListing"> | string
    country?: StringWithAggregatesFilter<"ShortTermListing"> | string
    latitude?: FloatNullableWithAggregatesFilter<"ShortTermListing"> | number | null
    longitude?: FloatNullableWithAggregatesFilter<"ShortTermListing"> | number | null
    nightPriceCents?: IntWithAggregatesFilter<"ShortTermListing"> | number
    beds?: IntWithAggregatesFilter<"ShortTermListing"> | number
    baths?: FloatWithAggregatesFilter<"ShortTermListing"> | number
    maxGuests?: IntWithAggregatesFilter<"ShortTermListing"> | number
    photos?: StringNullableListFilter<"ShortTermListing">
    verificationStatus?: EnumVerificationStatusWithAggregatesFilter<"ShortTermListing"> | $Enums.VerificationStatus
    cadastreNumber?: StringNullableWithAggregatesFilter<"ShortTermListing"> | string | null
    verificationDocUrl?: StringNullableWithAggregatesFilter<"ShortTermListing"> | string | null
    verifiedAt?: DateTimeNullableWithAggregatesFilter<"ShortTermListing"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ShortTermListing"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ShortTermListing"> | Date | string
    ownerId?: StringWithAggregatesFilter<"ShortTermListing"> | string
  }

  export type BookingWhereInput = {
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    id?: StringFilter<"Booking"> | string
    checkIn?: DateTimeFilter<"Booking"> | Date | string
    checkOut?: DateTimeFilter<"Booking"> | Date | string
    nights?: IntFilter<"Booking"> | number
    totalCents?: IntFilter<"Booking"> | number
    guestFeeCents?: IntFilter<"Booking"> | number
    hostFeeCents?: IntFilter<"Booking"> | number
    status?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    guestNotes?: StringNullableFilter<"Booking"> | string | null
    checkedInAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    checkedOutAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    guestId?: StringFilter<"Booking"> | string
    listingId?: StringFilter<"Booking"> | string
    guest?: XOR<UserRelationFilter, UserWhereInput>
    listing?: XOR<ShortTermListingRelationFilter, ShortTermListingWhereInput>
    payment?: XOR<PaymentNullableRelationFilter, PaymentWhereInput> | null
  }

  export type BookingOrderByWithRelationInput = {
    id?: SortOrder
    checkIn?: SortOrder
    checkOut?: SortOrder
    nights?: SortOrder
    totalCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    status?: SortOrder
    guestNotes?: SortOrderInput | SortOrder
    checkedInAt?: SortOrderInput | SortOrder
    checkedOutAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    guestId?: SortOrder
    listingId?: SortOrder
    guest?: UserOrderByWithRelationInput
    listing?: ShortTermListingOrderByWithRelationInput
    payment?: PaymentOrderByWithRelationInput
  }

  export type BookingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    checkIn?: DateTimeFilter<"Booking"> | Date | string
    checkOut?: DateTimeFilter<"Booking"> | Date | string
    nights?: IntFilter<"Booking"> | number
    totalCents?: IntFilter<"Booking"> | number
    guestFeeCents?: IntFilter<"Booking"> | number
    hostFeeCents?: IntFilter<"Booking"> | number
    status?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    guestNotes?: StringNullableFilter<"Booking"> | string | null
    checkedInAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    checkedOutAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    guestId?: StringFilter<"Booking"> | string
    listingId?: StringFilter<"Booking"> | string
    guest?: XOR<UserRelationFilter, UserWhereInput>
    listing?: XOR<ShortTermListingRelationFilter, ShortTermListingWhereInput>
    payment?: XOR<PaymentNullableRelationFilter, PaymentWhereInput> | null
  }, "id">

  export type BookingOrderByWithAggregationInput = {
    id?: SortOrder
    checkIn?: SortOrder
    checkOut?: SortOrder
    nights?: SortOrder
    totalCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    status?: SortOrder
    guestNotes?: SortOrderInput | SortOrder
    checkedInAt?: SortOrderInput | SortOrder
    checkedOutAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    guestId?: SortOrder
    listingId?: SortOrder
    _count?: BookingCountOrderByAggregateInput
    _avg?: BookingAvgOrderByAggregateInput
    _max?: BookingMaxOrderByAggregateInput
    _min?: BookingMinOrderByAggregateInput
    _sum?: BookingSumOrderByAggregateInput
  }

  export type BookingScalarWhereWithAggregatesInput = {
    AND?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    OR?: BookingScalarWhereWithAggregatesInput[]
    NOT?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Booking"> | string
    checkIn?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    checkOut?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    nights?: IntWithAggregatesFilter<"Booking"> | number
    totalCents?: IntWithAggregatesFilter<"Booking"> | number
    guestFeeCents?: IntWithAggregatesFilter<"Booking"> | number
    hostFeeCents?: IntWithAggregatesFilter<"Booking"> | number
    status?: EnumBookingStatusWithAggregatesFilter<"Booking"> | $Enums.BookingStatus
    guestNotes?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    checkedInAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    checkedOutAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    guestId?: StringWithAggregatesFilter<"Booking"> | string
    listingId?: StringWithAggregatesFilter<"Booking"> | string
  }

  export type PaymentWhereInput = {
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    id?: StringFilter<"Payment"> | string
    amountCents?: IntFilter<"Payment"> | number
    guestFeeCents?: IntFilter<"Payment"> | number
    hostFeeCents?: IntFilter<"Payment"> | number
    hostPayoutCents?: IntFilter<"Payment"> | number
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    stripePaymentId?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
    bookingId?: StringFilter<"Payment"> | string
    booking?: XOR<BookingRelationFilter, BookingWhereInput>
    intent?: XOR<PaymentIntentNullableRelationFilter, PaymentIntentWhereInput> | null
    transactions?: TransactionListRelationFilter
    payoutPayments?: PayoutPaymentListRelationFilter
  }

  export type PaymentOrderByWithRelationInput = {
    id?: SortOrder
    amountCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    hostPayoutCents?: SortOrder
    status?: SortOrder
    stripePaymentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    bookingId?: SortOrder
    booking?: BookingOrderByWithRelationInput
    intent?: PaymentIntentOrderByWithRelationInput
    transactions?: TransactionOrderByRelationAggregateInput
    payoutPayments?: PayoutPaymentOrderByRelationAggregateInput
  }

  export type PaymentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    bookingId?: string
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    amountCents?: IntFilter<"Payment"> | number
    guestFeeCents?: IntFilter<"Payment"> | number
    hostFeeCents?: IntFilter<"Payment"> | number
    hostPayoutCents?: IntFilter<"Payment"> | number
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    stripePaymentId?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
    booking?: XOR<BookingRelationFilter, BookingWhereInput>
    intent?: XOR<PaymentIntentNullableRelationFilter, PaymentIntentWhereInput> | null
    transactions?: TransactionListRelationFilter
    payoutPayments?: PayoutPaymentListRelationFilter
  }, "id" | "bookingId">

  export type PaymentOrderByWithAggregationInput = {
    id?: SortOrder
    amountCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    hostPayoutCents?: SortOrder
    status?: SortOrder
    stripePaymentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    bookingId?: SortOrder
    _count?: PaymentCountOrderByAggregateInput
    _avg?: PaymentAvgOrderByAggregateInput
    _max?: PaymentMaxOrderByAggregateInput
    _min?: PaymentMinOrderByAggregateInput
    _sum?: PaymentSumOrderByAggregateInput
  }

  export type PaymentScalarWhereWithAggregatesInput = {
    AND?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    OR?: PaymentScalarWhereWithAggregatesInput[]
    NOT?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Payment"> | string
    amountCents?: IntWithAggregatesFilter<"Payment"> | number
    guestFeeCents?: IntWithAggregatesFilter<"Payment"> | number
    hostFeeCents?: IntWithAggregatesFilter<"Payment"> | number
    hostPayoutCents?: IntWithAggregatesFilter<"Payment"> | number
    status?: EnumPaymentStatusWithAggregatesFilter<"Payment"> | $Enums.PaymentStatus
    stripePaymentId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
    bookingId?: StringWithAggregatesFilter<"Payment"> | string
  }

  export type PaymentIntentWhereInput = {
    AND?: PaymentIntentWhereInput | PaymentIntentWhereInput[]
    OR?: PaymentIntentWhereInput[]
    NOT?: PaymentIntentWhereInput | PaymentIntentWhereInput[]
    id?: StringFilter<"PaymentIntent"> | string
    bookingId?: StringFilter<"PaymentIntent"> | string
    paymentId?: StringFilter<"PaymentIntent"> | string
    amountCents?: IntFilter<"PaymentIntent"> | number
    currency?: StringFilter<"PaymentIntent"> | string
    providerIntentId?: StringNullableFilter<"PaymentIntent"> | string | null
    status?: EnumIntentStatusFilter<"PaymentIntent"> | $Enums.IntentStatus
    createdAt?: DateTimeFilter<"PaymentIntent"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentIntent"> | Date | string
    payment?: XOR<PaymentRelationFilter, PaymentWhereInput>
  }

  export type PaymentIntentOrderByWithRelationInput = {
    id?: SortOrder
    bookingId?: SortOrder
    paymentId?: SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    providerIntentId?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    payment?: PaymentOrderByWithRelationInput
  }

  export type PaymentIntentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    paymentId?: string
    AND?: PaymentIntentWhereInput | PaymentIntentWhereInput[]
    OR?: PaymentIntentWhereInput[]
    NOT?: PaymentIntentWhereInput | PaymentIntentWhereInput[]
    bookingId?: StringFilter<"PaymentIntent"> | string
    amountCents?: IntFilter<"PaymentIntent"> | number
    currency?: StringFilter<"PaymentIntent"> | string
    providerIntentId?: StringNullableFilter<"PaymentIntent"> | string | null
    status?: EnumIntentStatusFilter<"PaymentIntent"> | $Enums.IntentStatus
    createdAt?: DateTimeFilter<"PaymentIntent"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentIntent"> | Date | string
    payment?: XOR<PaymentRelationFilter, PaymentWhereInput>
  }, "id" | "paymentId">

  export type PaymentIntentOrderByWithAggregationInput = {
    id?: SortOrder
    bookingId?: SortOrder
    paymentId?: SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    providerIntentId?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PaymentIntentCountOrderByAggregateInput
    _avg?: PaymentIntentAvgOrderByAggregateInput
    _max?: PaymentIntentMaxOrderByAggregateInput
    _min?: PaymentIntentMinOrderByAggregateInput
    _sum?: PaymentIntentSumOrderByAggregateInput
  }

  export type PaymentIntentScalarWhereWithAggregatesInput = {
    AND?: PaymentIntentScalarWhereWithAggregatesInput | PaymentIntentScalarWhereWithAggregatesInput[]
    OR?: PaymentIntentScalarWhereWithAggregatesInput[]
    NOT?: PaymentIntentScalarWhereWithAggregatesInput | PaymentIntentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PaymentIntent"> | string
    bookingId?: StringWithAggregatesFilter<"PaymentIntent"> | string
    paymentId?: StringWithAggregatesFilter<"PaymentIntent"> | string
    amountCents?: IntWithAggregatesFilter<"PaymentIntent"> | number
    currency?: StringWithAggregatesFilter<"PaymentIntent"> | string
    providerIntentId?: StringNullableWithAggregatesFilter<"PaymentIntent"> | string | null
    status?: EnumIntentStatusWithAggregatesFilter<"PaymentIntent"> | $Enums.IntentStatus
    createdAt?: DateTimeWithAggregatesFilter<"PaymentIntent"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PaymentIntent"> | Date | string
  }

  export type TransactionWhereInput = {
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    id?: StringFilter<"Transaction"> | string
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    paymentId?: StringNullableFilter<"Transaction"> | string | null
    paymentIntentId?: StringNullableFilter<"Transaction"> | string | null
    payoutId?: StringNullableFilter<"Transaction"> | string | null
    amountCents?: IntFilter<"Transaction"> | number
    providerRef?: StringNullableFilter<"Transaction"> | string | null
    metadata?: StringNullableFilter<"Transaction"> | string | null
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    payment?: XOR<PaymentNullableRelationFilter, PaymentWhereInput> | null
    payout?: XOR<PayoutNullableRelationFilter, PayoutWhereInput> | null
  }

  export type TransactionOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    paymentId?: SortOrderInput | SortOrder
    paymentIntentId?: SortOrderInput | SortOrder
    payoutId?: SortOrderInput | SortOrder
    amountCents?: SortOrder
    providerRef?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    payment?: PaymentOrderByWithRelationInput
    payout?: PayoutOrderByWithRelationInput
  }

  export type TransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    paymentId?: StringNullableFilter<"Transaction"> | string | null
    paymentIntentId?: StringNullableFilter<"Transaction"> | string | null
    payoutId?: StringNullableFilter<"Transaction"> | string | null
    amountCents?: IntFilter<"Transaction"> | number
    providerRef?: StringNullableFilter<"Transaction"> | string | null
    metadata?: StringNullableFilter<"Transaction"> | string | null
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    payment?: XOR<PaymentNullableRelationFilter, PaymentWhereInput> | null
    payout?: XOR<PayoutNullableRelationFilter, PayoutWhereInput> | null
  }, "id">

  export type TransactionOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    paymentId?: SortOrderInput | SortOrder
    paymentIntentId?: SortOrderInput | SortOrder
    payoutId?: SortOrderInput | SortOrder
    amountCents?: SortOrder
    providerRef?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: TransactionCountOrderByAggregateInput
    _avg?: TransactionAvgOrderByAggregateInput
    _max?: TransactionMaxOrderByAggregateInput
    _min?: TransactionMinOrderByAggregateInput
    _sum?: TransactionSumOrderByAggregateInput
  }

  export type TransactionScalarWhereWithAggregatesInput = {
    AND?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    OR?: TransactionScalarWhereWithAggregatesInput[]
    NOT?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Transaction"> | string
    type?: EnumTransactionTypeWithAggregatesFilter<"Transaction"> | $Enums.TransactionType
    paymentId?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    paymentIntentId?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    payoutId?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    amountCents?: IntWithAggregatesFilter<"Transaction"> | number
    providerRef?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    metadata?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
  }

  export type PayoutWhereInput = {
    AND?: PayoutWhereInput | PayoutWhereInput[]
    OR?: PayoutWhereInput[]
    NOT?: PayoutWhereInput | PayoutWhereInput[]
    id?: StringFilter<"Payout"> | string
    hostId?: StringFilter<"Payout"> | string
    totalCents?: IntFilter<"Payout"> | number
    status?: EnumPayoutStatusFilter<"Payout"> | $Enums.PayoutStatus
    providerPayoutId?: StringNullableFilter<"Payout"> | string | null
    createdAt?: DateTimeFilter<"Payout"> | Date | string
    updatedAt?: DateTimeFilter<"Payout"> | Date | string
    payments?: PayoutPaymentListRelationFilter
    transactions?: TransactionListRelationFilter
  }

  export type PayoutOrderByWithRelationInput = {
    id?: SortOrder
    hostId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    providerPayoutId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    payments?: PayoutPaymentOrderByRelationAggregateInput
    transactions?: TransactionOrderByRelationAggregateInput
  }

  export type PayoutWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PayoutWhereInput | PayoutWhereInput[]
    OR?: PayoutWhereInput[]
    NOT?: PayoutWhereInput | PayoutWhereInput[]
    hostId?: StringFilter<"Payout"> | string
    totalCents?: IntFilter<"Payout"> | number
    status?: EnumPayoutStatusFilter<"Payout"> | $Enums.PayoutStatus
    providerPayoutId?: StringNullableFilter<"Payout"> | string | null
    createdAt?: DateTimeFilter<"Payout"> | Date | string
    updatedAt?: DateTimeFilter<"Payout"> | Date | string
    payments?: PayoutPaymentListRelationFilter
    transactions?: TransactionListRelationFilter
  }, "id">

  export type PayoutOrderByWithAggregationInput = {
    id?: SortOrder
    hostId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    providerPayoutId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PayoutCountOrderByAggregateInput
    _avg?: PayoutAvgOrderByAggregateInput
    _max?: PayoutMaxOrderByAggregateInput
    _min?: PayoutMinOrderByAggregateInput
    _sum?: PayoutSumOrderByAggregateInput
  }

  export type PayoutScalarWhereWithAggregatesInput = {
    AND?: PayoutScalarWhereWithAggregatesInput | PayoutScalarWhereWithAggregatesInput[]
    OR?: PayoutScalarWhereWithAggregatesInput[]
    NOT?: PayoutScalarWhereWithAggregatesInput | PayoutScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Payout"> | string
    hostId?: StringWithAggregatesFilter<"Payout"> | string
    totalCents?: IntWithAggregatesFilter<"Payout"> | number
    status?: EnumPayoutStatusWithAggregatesFilter<"Payout"> | $Enums.PayoutStatus
    providerPayoutId?: StringNullableWithAggregatesFilter<"Payout"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Payout"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Payout"> | Date | string
  }

  export type PayoutPaymentWhereInput = {
    AND?: PayoutPaymentWhereInput | PayoutPaymentWhereInput[]
    OR?: PayoutPaymentWhereInput[]
    NOT?: PayoutPaymentWhereInput | PayoutPaymentWhereInput[]
    payoutId?: StringFilter<"PayoutPayment"> | string
    paymentId?: StringFilter<"PayoutPayment"> | string
    createdAt?: DateTimeFilter<"PayoutPayment"> | Date | string
    payout?: XOR<PayoutRelationFilter, PayoutWhereInput>
    payment?: XOR<PaymentRelationFilter, PaymentWhereInput>
  }

  export type PayoutPaymentOrderByWithRelationInput = {
    payoutId?: SortOrder
    paymentId?: SortOrder
    createdAt?: SortOrder
    payout?: PayoutOrderByWithRelationInput
    payment?: PaymentOrderByWithRelationInput
  }

  export type PayoutPaymentWhereUniqueInput = Prisma.AtLeast<{
    payoutId_paymentId?: PayoutPaymentPayoutIdPaymentIdCompoundUniqueInput
    AND?: PayoutPaymentWhereInput | PayoutPaymentWhereInput[]
    OR?: PayoutPaymentWhereInput[]
    NOT?: PayoutPaymentWhereInput | PayoutPaymentWhereInput[]
    payoutId?: StringFilter<"PayoutPayment"> | string
    paymentId?: StringFilter<"PayoutPayment"> | string
    createdAt?: DateTimeFilter<"PayoutPayment"> | Date | string
    payout?: XOR<PayoutRelationFilter, PayoutWhereInput>
    payment?: XOR<PaymentRelationFilter, PaymentWhereInput>
  }, "payoutId_paymentId">

  export type PayoutPaymentOrderByWithAggregationInput = {
    payoutId?: SortOrder
    paymentId?: SortOrder
    createdAt?: SortOrder
    _count?: PayoutPaymentCountOrderByAggregateInput
    _max?: PayoutPaymentMaxOrderByAggregateInput
    _min?: PayoutPaymentMinOrderByAggregateInput
  }

  export type PayoutPaymentScalarWhereWithAggregatesInput = {
    AND?: PayoutPaymentScalarWhereWithAggregatesInput | PayoutPaymentScalarWhereWithAggregatesInput[]
    OR?: PayoutPaymentScalarWhereWithAggregatesInput[]
    NOT?: PayoutPaymentScalarWhereWithAggregatesInput | PayoutPaymentScalarWhereWithAggregatesInput[]
    payoutId?: StringWithAggregatesFilter<"PayoutPayment"> | string
    paymentId?: StringWithAggregatesFilter<"PayoutPayment"> | string
    createdAt?: DateTimeWithAggregatesFilter<"PayoutPayment"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    role?: $Enums.PlatformRole
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    shortTermListings?: ShortTermListingCreateNestedManyWithoutOwnerInput
    bookingsAsGuest?: BookingCreateNestedManyWithoutGuestInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    role?: $Enums.PlatformRole
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    shortTermListings?: ShortTermListingUncheckedCreateNestedManyWithoutOwnerInput
    bookingsAsGuest?: BookingUncheckedCreateNestedManyWithoutGuestInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumPlatformRoleFieldUpdateOperationsInput | $Enums.PlatformRole
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shortTermListings?: ShortTermListingUpdateManyWithoutOwnerNestedInput
    bookingsAsGuest?: BookingUpdateManyWithoutGuestNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumPlatformRoleFieldUpdateOperationsInput | $Enums.PlatformRole
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shortTermListings?: ShortTermListingUncheckedUpdateManyWithoutOwnerNestedInput
    bookingsAsGuest?: BookingUncheckedUpdateManyWithoutGuestNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    role?: $Enums.PlatformRole
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumPlatformRoleFieldUpdateOperationsInput | $Enums.PlatformRole
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumPlatformRoleFieldUpdateOperationsInput | $Enums.PlatformRole
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShortTermListingCreateInput = {
    id?: string
    title: string
    description?: string | null
    address: string
    city: string
    country?: string
    latitude?: number | null
    longitude?: number | null
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests?: number
    photos?: ShortTermListingCreatephotosInput | string[]
    verificationStatus?: $Enums.VerificationStatus
    cadastreNumber?: string | null
    verificationDocUrl?: string | null
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    owner: UserCreateNestedOneWithoutShortTermListingsInput
    bookings?: BookingCreateNestedManyWithoutListingInput
  }

  export type ShortTermListingUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    address: string
    city: string
    country?: string
    latitude?: number | null
    longitude?: number | null
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests?: number
    photos?: ShortTermListingCreatephotosInput | string[]
    verificationStatus?: $Enums.VerificationStatus
    cadastreNumber?: string | null
    verificationDocUrl?: string | null
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    ownerId: string
    bookings?: BookingUncheckedCreateNestedManyWithoutListingInput
  }

  export type ShortTermListingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    nightPriceCents?: IntFieldUpdateOperationsInput | number
    beds?: IntFieldUpdateOperationsInput | number
    baths?: FloatFieldUpdateOperationsInput | number
    maxGuests?: IntFieldUpdateOperationsInput | number
    photos?: ShortTermListingUpdatephotosInput | string[]
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    cadastreNumber?: NullableStringFieldUpdateOperationsInput | string | null
    verificationDocUrl?: NullableStringFieldUpdateOperationsInput | string | null
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneRequiredWithoutShortTermListingsNestedInput
    bookings?: BookingUpdateManyWithoutListingNestedInput
  }

  export type ShortTermListingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    nightPriceCents?: IntFieldUpdateOperationsInput | number
    beds?: IntFieldUpdateOperationsInput | number
    baths?: FloatFieldUpdateOperationsInput | number
    maxGuests?: IntFieldUpdateOperationsInput | number
    photos?: ShortTermListingUpdatephotosInput | string[]
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    cadastreNumber?: NullableStringFieldUpdateOperationsInput | string | null
    verificationDocUrl?: NullableStringFieldUpdateOperationsInput | string | null
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ownerId?: StringFieldUpdateOperationsInput | string
    bookings?: BookingUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ShortTermListingCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    address: string
    city: string
    country?: string
    latitude?: number | null
    longitude?: number | null
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests?: number
    photos?: ShortTermListingCreatephotosInput | string[]
    verificationStatus?: $Enums.VerificationStatus
    cadastreNumber?: string | null
    verificationDocUrl?: string | null
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    ownerId: string
  }

  export type ShortTermListingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    nightPriceCents?: IntFieldUpdateOperationsInput | number
    beds?: IntFieldUpdateOperationsInput | number
    baths?: FloatFieldUpdateOperationsInput | number
    maxGuests?: IntFieldUpdateOperationsInput | number
    photos?: ShortTermListingUpdatephotosInput | string[]
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    cadastreNumber?: NullableStringFieldUpdateOperationsInput | string | null
    verificationDocUrl?: NullableStringFieldUpdateOperationsInput | string | null
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShortTermListingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    nightPriceCents?: IntFieldUpdateOperationsInput | number
    beds?: IntFieldUpdateOperationsInput | number
    baths?: FloatFieldUpdateOperationsInput | number
    maxGuests?: IntFieldUpdateOperationsInput | number
    photos?: ShortTermListingUpdatephotosInput | string[]
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    cadastreNumber?: NullableStringFieldUpdateOperationsInput | string | null
    verificationDocUrl?: NullableStringFieldUpdateOperationsInput | string | null
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ownerId?: StringFieldUpdateOperationsInput | string
  }

  export type BookingCreateInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    guest: UserCreateNestedOneWithoutBookingsAsGuestInput
    listing: ShortTermListingCreateNestedOneWithoutBookingsInput
    payment?: PaymentCreateNestedOneWithoutBookingInput
  }

  export type BookingUncheckedCreateInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    guestId: string
    listingId: string
    payment?: PaymentUncheckedCreateNestedOneWithoutBookingInput
  }

  export type BookingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    guest?: UserUpdateOneRequiredWithoutBookingsAsGuestNestedInput
    listing?: ShortTermListingUpdateOneRequiredWithoutBookingsNestedInput
    payment?: PaymentUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    guestId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    payment?: PaymentUncheckedUpdateOneWithoutBookingNestedInput
  }

  export type BookingCreateManyInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    guestId: string
    listingId: string
  }

  export type BookingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    guestId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
  }

  export type PaymentCreateInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    booking: BookingCreateNestedOneWithoutPaymentInput
    intent?: PaymentIntentCreateNestedOneWithoutPaymentInput
    transactions?: TransactionCreateNestedManyWithoutPaymentInput
    payoutPayments?: PayoutPaymentCreateNestedManyWithoutPaymentInput
  }

  export type PaymentUncheckedCreateInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    bookingId: string
    intent?: PaymentIntentUncheckedCreateNestedOneWithoutPaymentInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutPaymentInput
    payoutPayments?: PayoutPaymentUncheckedCreateNestedManyWithoutPaymentInput
  }

  export type PaymentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    booking?: BookingUpdateOneRequiredWithoutPaymentNestedInput
    intent?: PaymentIntentUpdateOneWithoutPaymentNestedInput
    transactions?: TransactionUpdateManyWithoutPaymentNestedInput
    payoutPayments?: PayoutPaymentUpdateManyWithoutPaymentNestedInput
  }

  export type PaymentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookingId?: StringFieldUpdateOperationsInput | string
    intent?: PaymentIntentUncheckedUpdateOneWithoutPaymentNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutPaymentNestedInput
    payoutPayments?: PayoutPaymentUncheckedUpdateManyWithoutPaymentNestedInput
  }

  export type PaymentCreateManyInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    bookingId: string
  }

  export type PaymentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookingId?: StringFieldUpdateOperationsInput | string
  }

  export type PaymentIntentCreateInput = {
    id?: string
    bookingId: string
    amountCents: number
    currency?: string
    providerIntentId?: string | null
    status?: $Enums.IntentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    payment: PaymentCreateNestedOneWithoutIntentInput
  }

  export type PaymentIntentUncheckedCreateInput = {
    id?: string
    bookingId: string
    paymentId: string
    amountCents: number
    currency?: string
    providerIntentId?: string | null
    status?: $Enums.IntentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentIntentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    providerIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumIntentStatusFieldUpdateOperationsInput | $Enums.IntentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payment?: PaymentUpdateOneRequiredWithoutIntentNestedInput
  }

  export type PaymentIntentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    providerIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumIntentStatusFieldUpdateOperationsInput | $Enums.IntentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentIntentCreateManyInput = {
    id?: string
    bookingId: string
    paymentId: string
    amountCents: number
    currency?: string
    providerIntentId?: string | null
    status?: $Enums.IntentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentIntentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    providerIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumIntentStatusFieldUpdateOperationsInput | $Enums.IntentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentIntentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    providerIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumIntentStatusFieldUpdateOperationsInput | $Enums.IntentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateInput = {
    id?: string
    type: $Enums.TransactionType
    paymentIntentId?: string | null
    amountCents: number
    providerRef?: string | null
    metadata?: string | null
    createdAt?: Date | string
    payment?: PaymentCreateNestedOneWithoutTransactionsInput
    payout?: PayoutCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateInput = {
    id?: string
    type: $Enums.TransactionType
    paymentId?: string | null
    paymentIntentId?: string | null
    payoutId?: string | null
    amountCents: number
    providerRef?: string | null
    metadata?: string | null
    createdAt?: Date | string
  }

  export type TransactionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payment?: PaymentUpdateOneWithoutTransactionsNestedInput
    payout?: PayoutUpdateOneWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentId?: NullableStringFieldUpdateOperationsInput | string | null
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    payoutId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateManyInput = {
    id?: string
    type: $Enums.TransactionType
    paymentId?: string | null
    paymentIntentId?: string | null
    payoutId?: string | null
    amountCents: number
    providerRef?: string | null
    metadata?: string | null
    createdAt?: Date | string
  }

  export type TransactionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentId?: NullableStringFieldUpdateOperationsInput | string | null
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    payoutId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutCreateInput = {
    id?: string
    hostId: string
    totalCents: number
    status?: $Enums.PayoutStatus
    providerPayoutId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    payments?: PayoutPaymentCreateNestedManyWithoutPayoutInput
    transactions?: TransactionCreateNestedManyWithoutPayoutInput
  }

  export type PayoutUncheckedCreateInput = {
    id?: string
    hostId: string
    totalCents: number
    status?: $Enums.PayoutStatus
    providerPayoutId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    payments?: PayoutPaymentUncheckedCreateNestedManyWithoutPayoutInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutPayoutInput
  }

  export type PayoutUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    providerPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payments?: PayoutPaymentUpdateManyWithoutPayoutNestedInput
    transactions?: TransactionUpdateManyWithoutPayoutNestedInput
  }

  export type PayoutUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    providerPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payments?: PayoutPaymentUncheckedUpdateManyWithoutPayoutNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutPayoutNestedInput
  }

  export type PayoutCreateManyInput = {
    id?: string
    hostId: string
    totalCents: number
    status?: $Enums.PayoutStatus
    providerPayoutId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    providerPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    providerPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutPaymentCreateInput = {
    createdAt?: Date | string
    payout: PayoutCreateNestedOneWithoutPaymentsInput
    payment: PaymentCreateNestedOneWithoutPayoutPaymentsInput
  }

  export type PayoutPaymentUncheckedCreateInput = {
    payoutId: string
    paymentId: string
    createdAt?: Date | string
  }

  export type PayoutPaymentUpdateInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payout?: PayoutUpdateOneRequiredWithoutPaymentsNestedInput
    payment?: PaymentUpdateOneRequiredWithoutPayoutPaymentsNestedInput
  }

  export type PayoutPaymentUncheckedUpdateInput = {
    payoutId?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutPaymentCreateManyInput = {
    payoutId: string
    paymentId: string
    createdAt?: Date | string
  }

  export type PayoutPaymentUpdateManyMutationInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutPaymentUncheckedUpdateManyInput = {
    payoutId?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type EnumPlatformRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.PlatformRole | EnumPlatformRoleFieldRefInput<$PrismaModel>
    in?: $Enums.PlatformRole[] | ListEnumPlatformRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlatformRole[] | ListEnumPlatformRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumPlatformRoleFilter<$PrismaModel> | $Enums.PlatformRole
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

  export type ShortTermListingListRelationFilter = {
    every?: ShortTermListingWhereInput
    some?: ShortTermListingWhereInput
    none?: ShortTermListingWhereInput
  }

  export type BookingListRelationFilter = {
    every?: BookingWhereInput
    some?: BookingWhereInput
    none?: BookingWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ShortTermListingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BookingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    role?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    role?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    role?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
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

  export type EnumPlatformRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PlatformRole | EnumPlatformRoleFieldRefInput<$PrismaModel>
    in?: $Enums.PlatformRole[] | ListEnumPlatformRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlatformRole[] | ListEnumPlatformRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumPlatformRoleWithAggregatesFilter<$PrismaModel> | $Enums.PlatformRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPlatformRoleFilter<$PrismaModel>
    _max?: NestedEnumPlatformRoleFilter<$PrismaModel>
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

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
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

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type EnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus
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

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type ShortTermListingCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    address?: SortOrder
    city?: SortOrder
    country?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    nightPriceCents?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    maxGuests?: SortOrder
    photos?: SortOrder
    verificationStatus?: SortOrder
    cadastreNumber?: SortOrder
    verificationDocUrl?: SortOrder
    verifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ownerId?: SortOrder
  }

  export type ShortTermListingAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
    nightPriceCents?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    maxGuests?: SortOrder
  }

  export type ShortTermListingMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    address?: SortOrder
    city?: SortOrder
    country?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    nightPriceCents?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    maxGuests?: SortOrder
    verificationStatus?: SortOrder
    cadastreNumber?: SortOrder
    verificationDocUrl?: SortOrder
    verifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ownerId?: SortOrder
  }

  export type ShortTermListingMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    address?: SortOrder
    city?: SortOrder
    country?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    nightPriceCents?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    maxGuests?: SortOrder
    verificationStatus?: SortOrder
    cadastreNumber?: SortOrder
    verificationDocUrl?: SortOrder
    verifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ownerId?: SortOrder
  }

  export type ShortTermListingSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
    nightPriceCents?: SortOrder
    beds?: SortOrder
    baths?: SortOrder
    maxGuests?: SortOrder
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
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

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type EnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationStatusFilter<$PrismaModel>
    _max?: NestedEnumVerificationStatusFilter<$PrismaModel>
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

  export type EnumBookingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusFilter<$PrismaModel> | $Enums.BookingStatus
  }

  export type ShortTermListingRelationFilter = {
    is?: ShortTermListingWhereInput
    isNot?: ShortTermListingWhereInput
  }

  export type PaymentNullableRelationFilter = {
    is?: PaymentWhereInput | null
    isNot?: PaymentWhereInput | null
  }

  export type BookingCountOrderByAggregateInput = {
    id?: SortOrder
    checkIn?: SortOrder
    checkOut?: SortOrder
    nights?: SortOrder
    totalCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    status?: SortOrder
    guestNotes?: SortOrder
    checkedInAt?: SortOrder
    checkedOutAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    guestId?: SortOrder
    listingId?: SortOrder
  }

  export type BookingAvgOrderByAggregateInput = {
    nights?: SortOrder
    totalCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
  }

  export type BookingMaxOrderByAggregateInput = {
    id?: SortOrder
    checkIn?: SortOrder
    checkOut?: SortOrder
    nights?: SortOrder
    totalCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    status?: SortOrder
    guestNotes?: SortOrder
    checkedInAt?: SortOrder
    checkedOutAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    guestId?: SortOrder
    listingId?: SortOrder
  }

  export type BookingMinOrderByAggregateInput = {
    id?: SortOrder
    checkIn?: SortOrder
    checkOut?: SortOrder
    nights?: SortOrder
    totalCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    status?: SortOrder
    guestNotes?: SortOrder
    checkedInAt?: SortOrder
    checkedOutAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    guestId?: SortOrder
    listingId?: SortOrder
  }

  export type BookingSumOrderByAggregateInput = {
    nights?: SortOrder
    totalCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
  }

  export type EnumBookingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel> | $Enums.BookingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBookingStatusFilter<$PrismaModel>
    _max?: NestedEnumBookingStatusFilter<$PrismaModel>
  }

  export type EnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type BookingRelationFilter = {
    is?: BookingWhereInput
    isNot?: BookingWhereInput
  }

  export type PaymentIntentNullableRelationFilter = {
    is?: PaymentIntentWhereInput | null
    isNot?: PaymentIntentWhereInput | null
  }

  export type TransactionListRelationFilter = {
    every?: TransactionWhereInput
    some?: TransactionWhereInput
    none?: TransactionWhereInput
  }

  export type PayoutPaymentListRelationFilter = {
    every?: PayoutPaymentWhereInput
    some?: PayoutPaymentWhereInput
    none?: PayoutPaymentWhereInput
  }

  export type TransactionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PayoutPaymentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PaymentCountOrderByAggregateInput = {
    id?: SortOrder
    amountCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    hostPayoutCents?: SortOrder
    status?: SortOrder
    stripePaymentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    bookingId?: SortOrder
  }

  export type PaymentAvgOrderByAggregateInput = {
    amountCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    hostPayoutCents?: SortOrder
  }

  export type PaymentMaxOrderByAggregateInput = {
    id?: SortOrder
    amountCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    hostPayoutCents?: SortOrder
    status?: SortOrder
    stripePaymentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    bookingId?: SortOrder
  }

  export type PaymentMinOrderByAggregateInput = {
    id?: SortOrder
    amountCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    hostPayoutCents?: SortOrder
    status?: SortOrder
    stripePaymentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    bookingId?: SortOrder
  }

  export type PaymentSumOrderByAggregateInput = {
    amountCents?: SortOrder
    guestFeeCents?: SortOrder
    hostFeeCents?: SortOrder
    hostPayoutCents?: SortOrder
  }

  export type EnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type EnumIntentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.IntentStatus | EnumIntentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IntentStatus[] | ListEnumIntentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntentStatus[] | ListEnumIntentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIntentStatusFilter<$PrismaModel> | $Enums.IntentStatus
  }

  export type PaymentRelationFilter = {
    is?: PaymentWhereInput
    isNot?: PaymentWhereInput
  }

  export type PaymentIntentCountOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    paymentId?: SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    providerIntentId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentIntentAvgOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type PaymentIntentMaxOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    paymentId?: SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    providerIntentId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentIntentMinOrderByAggregateInput = {
    id?: SortOrder
    bookingId?: SortOrder
    paymentId?: SortOrder
    amountCents?: SortOrder
    currency?: SortOrder
    providerIntentId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentIntentSumOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type EnumIntentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntentStatus | EnumIntentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IntentStatus[] | ListEnumIntentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntentStatus[] | ListEnumIntentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIntentStatusWithAggregatesFilter<$PrismaModel> | $Enums.IntentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntentStatusFilter<$PrismaModel>
    _max?: NestedEnumIntentStatusFilter<$PrismaModel>
  }

  export type EnumTransactionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeFilter<$PrismaModel> | $Enums.TransactionType
  }

  export type PayoutNullableRelationFilter = {
    is?: PayoutWhereInput | null
    isNot?: PayoutWhereInput | null
  }

  export type TransactionCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    paymentId?: SortOrder
    paymentIntentId?: SortOrder
    payoutId?: SortOrder
    amountCents?: SortOrder
    providerRef?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionAvgOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type TransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    paymentId?: SortOrder
    paymentIntentId?: SortOrder
    payoutId?: SortOrder
    amountCents?: SortOrder
    providerRef?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    paymentId?: SortOrder
    paymentIntentId?: SortOrder
    payoutId?: SortOrder
    amountCents?: SortOrder
    providerRef?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionSumOrderByAggregateInput = {
    amountCents?: SortOrder
  }

  export type EnumTransactionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransactionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionTypeFilter<$PrismaModel>
    _max?: NestedEnumTransactionTypeFilter<$PrismaModel>
  }

  export type EnumPayoutStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PayoutStatus | EnumPayoutStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPayoutStatusFilter<$PrismaModel> | $Enums.PayoutStatus
  }

  export type PayoutCountOrderByAggregateInput = {
    id?: SortOrder
    hostId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    providerPayoutId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutAvgOrderByAggregateInput = {
    totalCents?: SortOrder
  }

  export type PayoutMaxOrderByAggregateInput = {
    id?: SortOrder
    hostId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    providerPayoutId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutMinOrderByAggregateInput = {
    id?: SortOrder
    hostId?: SortOrder
    totalCents?: SortOrder
    status?: SortOrder
    providerPayoutId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutSumOrderByAggregateInput = {
    totalCents?: SortOrder
  }

  export type EnumPayoutStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PayoutStatus | EnumPayoutStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPayoutStatusWithAggregatesFilter<$PrismaModel> | $Enums.PayoutStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPayoutStatusFilter<$PrismaModel>
    _max?: NestedEnumPayoutStatusFilter<$PrismaModel>
  }

  export type PayoutRelationFilter = {
    is?: PayoutWhereInput
    isNot?: PayoutWhereInput
  }

  export type PayoutPaymentPayoutIdPaymentIdCompoundUniqueInput = {
    payoutId: string
    paymentId: string
  }

  export type PayoutPaymentCountOrderByAggregateInput = {
    payoutId?: SortOrder
    paymentId?: SortOrder
    createdAt?: SortOrder
  }

  export type PayoutPaymentMaxOrderByAggregateInput = {
    payoutId?: SortOrder
    paymentId?: SortOrder
    createdAt?: SortOrder
  }

  export type PayoutPaymentMinOrderByAggregateInput = {
    payoutId?: SortOrder
    paymentId?: SortOrder
    createdAt?: SortOrder
  }

  export type ShortTermListingCreateNestedManyWithoutOwnerInput = {
    create?: XOR<ShortTermListingCreateWithoutOwnerInput, ShortTermListingUncheckedCreateWithoutOwnerInput> | ShortTermListingCreateWithoutOwnerInput[] | ShortTermListingUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: ShortTermListingCreateOrConnectWithoutOwnerInput | ShortTermListingCreateOrConnectWithoutOwnerInput[]
    createMany?: ShortTermListingCreateManyOwnerInputEnvelope
    connect?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
  }

  export type BookingCreateNestedManyWithoutGuestInput = {
    create?: XOR<BookingCreateWithoutGuestInput, BookingUncheckedCreateWithoutGuestInput> | BookingCreateWithoutGuestInput[] | BookingUncheckedCreateWithoutGuestInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutGuestInput | BookingCreateOrConnectWithoutGuestInput[]
    createMany?: BookingCreateManyGuestInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ShortTermListingUncheckedCreateNestedManyWithoutOwnerInput = {
    create?: XOR<ShortTermListingCreateWithoutOwnerInput, ShortTermListingUncheckedCreateWithoutOwnerInput> | ShortTermListingCreateWithoutOwnerInput[] | ShortTermListingUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: ShortTermListingCreateOrConnectWithoutOwnerInput | ShortTermListingCreateOrConnectWithoutOwnerInput[]
    createMany?: ShortTermListingCreateManyOwnerInputEnvelope
    connect?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
  }

  export type BookingUncheckedCreateNestedManyWithoutGuestInput = {
    create?: XOR<BookingCreateWithoutGuestInput, BookingUncheckedCreateWithoutGuestInput> | BookingCreateWithoutGuestInput[] | BookingUncheckedCreateWithoutGuestInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutGuestInput | BookingCreateOrConnectWithoutGuestInput[]
    createMany?: BookingCreateManyGuestInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumPlatformRoleFieldUpdateOperationsInput = {
    set?: $Enums.PlatformRole
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ShortTermListingUpdateManyWithoutOwnerNestedInput = {
    create?: XOR<ShortTermListingCreateWithoutOwnerInput, ShortTermListingUncheckedCreateWithoutOwnerInput> | ShortTermListingCreateWithoutOwnerInput[] | ShortTermListingUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: ShortTermListingCreateOrConnectWithoutOwnerInput | ShortTermListingCreateOrConnectWithoutOwnerInput[]
    upsert?: ShortTermListingUpsertWithWhereUniqueWithoutOwnerInput | ShortTermListingUpsertWithWhereUniqueWithoutOwnerInput[]
    createMany?: ShortTermListingCreateManyOwnerInputEnvelope
    set?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
    disconnect?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
    delete?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
    connect?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
    update?: ShortTermListingUpdateWithWhereUniqueWithoutOwnerInput | ShortTermListingUpdateWithWhereUniqueWithoutOwnerInput[]
    updateMany?: ShortTermListingUpdateManyWithWhereWithoutOwnerInput | ShortTermListingUpdateManyWithWhereWithoutOwnerInput[]
    deleteMany?: ShortTermListingScalarWhereInput | ShortTermListingScalarWhereInput[]
  }

  export type BookingUpdateManyWithoutGuestNestedInput = {
    create?: XOR<BookingCreateWithoutGuestInput, BookingUncheckedCreateWithoutGuestInput> | BookingCreateWithoutGuestInput[] | BookingUncheckedCreateWithoutGuestInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutGuestInput | BookingCreateOrConnectWithoutGuestInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutGuestInput | BookingUpsertWithWhereUniqueWithoutGuestInput[]
    createMany?: BookingCreateManyGuestInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutGuestInput | BookingUpdateWithWhereUniqueWithoutGuestInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutGuestInput | BookingUpdateManyWithWhereWithoutGuestInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ShortTermListingUncheckedUpdateManyWithoutOwnerNestedInput = {
    create?: XOR<ShortTermListingCreateWithoutOwnerInput, ShortTermListingUncheckedCreateWithoutOwnerInput> | ShortTermListingCreateWithoutOwnerInput[] | ShortTermListingUncheckedCreateWithoutOwnerInput[]
    connectOrCreate?: ShortTermListingCreateOrConnectWithoutOwnerInput | ShortTermListingCreateOrConnectWithoutOwnerInput[]
    upsert?: ShortTermListingUpsertWithWhereUniqueWithoutOwnerInput | ShortTermListingUpsertWithWhereUniqueWithoutOwnerInput[]
    createMany?: ShortTermListingCreateManyOwnerInputEnvelope
    set?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
    disconnect?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
    delete?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
    connect?: ShortTermListingWhereUniqueInput | ShortTermListingWhereUniqueInput[]
    update?: ShortTermListingUpdateWithWhereUniqueWithoutOwnerInput | ShortTermListingUpdateWithWhereUniqueWithoutOwnerInput[]
    updateMany?: ShortTermListingUpdateManyWithWhereWithoutOwnerInput | ShortTermListingUpdateManyWithWhereWithoutOwnerInput[]
    deleteMany?: ShortTermListingScalarWhereInput | ShortTermListingScalarWhereInput[]
  }

  export type BookingUncheckedUpdateManyWithoutGuestNestedInput = {
    create?: XOR<BookingCreateWithoutGuestInput, BookingUncheckedCreateWithoutGuestInput> | BookingCreateWithoutGuestInput[] | BookingUncheckedCreateWithoutGuestInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutGuestInput | BookingCreateOrConnectWithoutGuestInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutGuestInput | BookingUpsertWithWhereUniqueWithoutGuestInput[]
    createMany?: BookingCreateManyGuestInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutGuestInput | BookingUpdateWithWhereUniqueWithoutGuestInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutGuestInput | BookingUpdateManyWithWhereWithoutGuestInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ShortTermListingCreatephotosInput = {
    set: string[]
  }

  export type UserCreateNestedOneWithoutShortTermListingsInput = {
    create?: XOR<UserCreateWithoutShortTermListingsInput, UserUncheckedCreateWithoutShortTermListingsInput>
    connectOrCreate?: UserCreateOrConnectWithoutShortTermListingsInput
    connect?: UserWhereUniqueInput
  }

  export type BookingCreateNestedManyWithoutListingInput = {
    create?: XOR<BookingCreateWithoutListingInput, BookingUncheckedCreateWithoutListingInput> | BookingCreateWithoutListingInput[] | BookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutListingInput | BookingCreateOrConnectWithoutListingInput[]
    createMany?: BookingCreateManyListingInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type BookingUncheckedCreateNestedManyWithoutListingInput = {
    create?: XOR<BookingCreateWithoutListingInput, BookingUncheckedCreateWithoutListingInput> | BookingCreateWithoutListingInput[] | BookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutListingInput | BookingCreateOrConnectWithoutListingInput[]
    createMany?: BookingCreateManyListingInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ShortTermListingUpdatephotosInput = {
    set?: string[]
    push?: string | string[]
  }

  export type EnumVerificationStatusFieldUpdateOperationsInput = {
    set?: $Enums.VerificationStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type UserUpdateOneRequiredWithoutShortTermListingsNestedInput = {
    create?: XOR<UserCreateWithoutShortTermListingsInput, UserUncheckedCreateWithoutShortTermListingsInput>
    connectOrCreate?: UserCreateOrConnectWithoutShortTermListingsInput
    upsert?: UserUpsertWithoutShortTermListingsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutShortTermListingsInput, UserUpdateWithoutShortTermListingsInput>, UserUncheckedUpdateWithoutShortTermListingsInput>
  }

  export type BookingUpdateManyWithoutListingNestedInput = {
    create?: XOR<BookingCreateWithoutListingInput, BookingUncheckedCreateWithoutListingInput> | BookingCreateWithoutListingInput[] | BookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutListingInput | BookingCreateOrConnectWithoutListingInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutListingInput | BookingUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: BookingCreateManyListingInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutListingInput | BookingUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutListingInput | BookingUpdateManyWithWhereWithoutListingInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type BookingUncheckedUpdateManyWithoutListingNestedInput = {
    create?: XOR<BookingCreateWithoutListingInput, BookingUncheckedCreateWithoutListingInput> | BookingCreateWithoutListingInput[] | BookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutListingInput | BookingCreateOrConnectWithoutListingInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutListingInput | BookingUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: BookingCreateManyListingInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutListingInput | BookingUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutListingInput | BookingUpdateManyWithWhereWithoutListingInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutBookingsAsGuestInput = {
    create?: XOR<UserCreateWithoutBookingsAsGuestInput, UserUncheckedCreateWithoutBookingsAsGuestInput>
    connectOrCreate?: UserCreateOrConnectWithoutBookingsAsGuestInput
    connect?: UserWhereUniqueInput
  }

  export type ShortTermListingCreateNestedOneWithoutBookingsInput = {
    create?: XOR<ShortTermListingCreateWithoutBookingsInput, ShortTermListingUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: ShortTermListingCreateOrConnectWithoutBookingsInput
    connect?: ShortTermListingWhereUniqueInput
  }

  export type PaymentCreateNestedOneWithoutBookingInput = {
    create?: XOR<PaymentCreateWithoutBookingInput, PaymentUncheckedCreateWithoutBookingInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutBookingInput
    connect?: PaymentWhereUniqueInput
  }

  export type PaymentUncheckedCreateNestedOneWithoutBookingInput = {
    create?: XOR<PaymentCreateWithoutBookingInput, PaymentUncheckedCreateWithoutBookingInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutBookingInput
    connect?: PaymentWhereUniqueInput
  }

  export type EnumBookingStatusFieldUpdateOperationsInput = {
    set?: $Enums.BookingStatus
  }

  export type UserUpdateOneRequiredWithoutBookingsAsGuestNestedInput = {
    create?: XOR<UserCreateWithoutBookingsAsGuestInput, UserUncheckedCreateWithoutBookingsAsGuestInput>
    connectOrCreate?: UserCreateOrConnectWithoutBookingsAsGuestInput
    upsert?: UserUpsertWithoutBookingsAsGuestInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutBookingsAsGuestInput, UserUpdateWithoutBookingsAsGuestInput>, UserUncheckedUpdateWithoutBookingsAsGuestInput>
  }

  export type ShortTermListingUpdateOneRequiredWithoutBookingsNestedInput = {
    create?: XOR<ShortTermListingCreateWithoutBookingsInput, ShortTermListingUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: ShortTermListingCreateOrConnectWithoutBookingsInput
    upsert?: ShortTermListingUpsertWithoutBookingsInput
    connect?: ShortTermListingWhereUniqueInput
    update?: XOR<XOR<ShortTermListingUpdateToOneWithWhereWithoutBookingsInput, ShortTermListingUpdateWithoutBookingsInput>, ShortTermListingUncheckedUpdateWithoutBookingsInput>
  }

  export type PaymentUpdateOneWithoutBookingNestedInput = {
    create?: XOR<PaymentCreateWithoutBookingInput, PaymentUncheckedCreateWithoutBookingInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutBookingInput
    upsert?: PaymentUpsertWithoutBookingInput
    disconnect?: PaymentWhereInput | boolean
    delete?: PaymentWhereInput | boolean
    connect?: PaymentWhereUniqueInput
    update?: XOR<XOR<PaymentUpdateToOneWithWhereWithoutBookingInput, PaymentUpdateWithoutBookingInput>, PaymentUncheckedUpdateWithoutBookingInput>
  }

  export type PaymentUncheckedUpdateOneWithoutBookingNestedInput = {
    create?: XOR<PaymentCreateWithoutBookingInput, PaymentUncheckedCreateWithoutBookingInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutBookingInput
    upsert?: PaymentUpsertWithoutBookingInput
    disconnect?: PaymentWhereInput | boolean
    delete?: PaymentWhereInput | boolean
    connect?: PaymentWhereUniqueInput
    update?: XOR<XOR<PaymentUpdateToOneWithWhereWithoutBookingInput, PaymentUpdateWithoutBookingInput>, PaymentUncheckedUpdateWithoutBookingInput>
  }

  export type BookingCreateNestedOneWithoutPaymentInput = {
    create?: XOR<BookingCreateWithoutPaymentInput, BookingUncheckedCreateWithoutPaymentInput>
    connectOrCreate?: BookingCreateOrConnectWithoutPaymentInput
    connect?: BookingWhereUniqueInput
  }

  export type PaymentIntentCreateNestedOneWithoutPaymentInput = {
    create?: XOR<PaymentIntentCreateWithoutPaymentInput, PaymentIntentUncheckedCreateWithoutPaymentInput>
    connectOrCreate?: PaymentIntentCreateOrConnectWithoutPaymentInput
    connect?: PaymentIntentWhereUniqueInput
  }

  export type TransactionCreateNestedManyWithoutPaymentInput = {
    create?: XOR<TransactionCreateWithoutPaymentInput, TransactionUncheckedCreateWithoutPaymentInput> | TransactionCreateWithoutPaymentInput[] | TransactionUncheckedCreateWithoutPaymentInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutPaymentInput | TransactionCreateOrConnectWithoutPaymentInput[]
    createMany?: TransactionCreateManyPaymentInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type PayoutPaymentCreateNestedManyWithoutPaymentInput = {
    create?: XOR<PayoutPaymentCreateWithoutPaymentInput, PayoutPaymentUncheckedCreateWithoutPaymentInput> | PayoutPaymentCreateWithoutPaymentInput[] | PayoutPaymentUncheckedCreateWithoutPaymentInput[]
    connectOrCreate?: PayoutPaymentCreateOrConnectWithoutPaymentInput | PayoutPaymentCreateOrConnectWithoutPaymentInput[]
    createMany?: PayoutPaymentCreateManyPaymentInputEnvelope
    connect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
  }

  export type PaymentIntentUncheckedCreateNestedOneWithoutPaymentInput = {
    create?: XOR<PaymentIntentCreateWithoutPaymentInput, PaymentIntentUncheckedCreateWithoutPaymentInput>
    connectOrCreate?: PaymentIntentCreateOrConnectWithoutPaymentInput
    connect?: PaymentIntentWhereUniqueInput
  }

  export type TransactionUncheckedCreateNestedManyWithoutPaymentInput = {
    create?: XOR<TransactionCreateWithoutPaymentInput, TransactionUncheckedCreateWithoutPaymentInput> | TransactionCreateWithoutPaymentInput[] | TransactionUncheckedCreateWithoutPaymentInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutPaymentInput | TransactionCreateOrConnectWithoutPaymentInput[]
    createMany?: TransactionCreateManyPaymentInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type PayoutPaymentUncheckedCreateNestedManyWithoutPaymentInput = {
    create?: XOR<PayoutPaymentCreateWithoutPaymentInput, PayoutPaymentUncheckedCreateWithoutPaymentInput> | PayoutPaymentCreateWithoutPaymentInput[] | PayoutPaymentUncheckedCreateWithoutPaymentInput[]
    connectOrCreate?: PayoutPaymentCreateOrConnectWithoutPaymentInput | PayoutPaymentCreateOrConnectWithoutPaymentInput[]
    createMany?: PayoutPaymentCreateManyPaymentInputEnvelope
    connect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
  }

  export type EnumPaymentStatusFieldUpdateOperationsInput = {
    set?: $Enums.PaymentStatus
  }

  export type BookingUpdateOneRequiredWithoutPaymentNestedInput = {
    create?: XOR<BookingCreateWithoutPaymentInput, BookingUncheckedCreateWithoutPaymentInput>
    connectOrCreate?: BookingCreateOrConnectWithoutPaymentInput
    upsert?: BookingUpsertWithoutPaymentInput
    connect?: BookingWhereUniqueInput
    update?: XOR<XOR<BookingUpdateToOneWithWhereWithoutPaymentInput, BookingUpdateWithoutPaymentInput>, BookingUncheckedUpdateWithoutPaymentInput>
  }

  export type PaymentIntentUpdateOneWithoutPaymentNestedInput = {
    create?: XOR<PaymentIntentCreateWithoutPaymentInput, PaymentIntentUncheckedCreateWithoutPaymentInput>
    connectOrCreate?: PaymentIntentCreateOrConnectWithoutPaymentInput
    upsert?: PaymentIntentUpsertWithoutPaymentInput
    disconnect?: PaymentIntentWhereInput | boolean
    delete?: PaymentIntentWhereInput | boolean
    connect?: PaymentIntentWhereUniqueInput
    update?: XOR<XOR<PaymentIntentUpdateToOneWithWhereWithoutPaymentInput, PaymentIntentUpdateWithoutPaymentInput>, PaymentIntentUncheckedUpdateWithoutPaymentInput>
  }

  export type TransactionUpdateManyWithoutPaymentNestedInput = {
    create?: XOR<TransactionCreateWithoutPaymentInput, TransactionUncheckedCreateWithoutPaymentInput> | TransactionCreateWithoutPaymentInput[] | TransactionUncheckedCreateWithoutPaymentInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutPaymentInput | TransactionCreateOrConnectWithoutPaymentInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutPaymentInput | TransactionUpsertWithWhereUniqueWithoutPaymentInput[]
    createMany?: TransactionCreateManyPaymentInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutPaymentInput | TransactionUpdateWithWhereUniqueWithoutPaymentInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutPaymentInput | TransactionUpdateManyWithWhereWithoutPaymentInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type PayoutPaymentUpdateManyWithoutPaymentNestedInput = {
    create?: XOR<PayoutPaymentCreateWithoutPaymentInput, PayoutPaymentUncheckedCreateWithoutPaymentInput> | PayoutPaymentCreateWithoutPaymentInput[] | PayoutPaymentUncheckedCreateWithoutPaymentInput[]
    connectOrCreate?: PayoutPaymentCreateOrConnectWithoutPaymentInput | PayoutPaymentCreateOrConnectWithoutPaymentInput[]
    upsert?: PayoutPaymentUpsertWithWhereUniqueWithoutPaymentInput | PayoutPaymentUpsertWithWhereUniqueWithoutPaymentInput[]
    createMany?: PayoutPaymentCreateManyPaymentInputEnvelope
    set?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    disconnect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    delete?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    connect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    update?: PayoutPaymentUpdateWithWhereUniqueWithoutPaymentInput | PayoutPaymentUpdateWithWhereUniqueWithoutPaymentInput[]
    updateMany?: PayoutPaymentUpdateManyWithWhereWithoutPaymentInput | PayoutPaymentUpdateManyWithWhereWithoutPaymentInput[]
    deleteMany?: PayoutPaymentScalarWhereInput | PayoutPaymentScalarWhereInput[]
  }

  export type PaymentIntentUncheckedUpdateOneWithoutPaymentNestedInput = {
    create?: XOR<PaymentIntentCreateWithoutPaymentInput, PaymentIntentUncheckedCreateWithoutPaymentInput>
    connectOrCreate?: PaymentIntentCreateOrConnectWithoutPaymentInput
    upsert?: PaymentIntentUpsertWithoutPaymentInput
    disconnect?: PaymentIntentWhereInput | boolean
    delete?: PaymentIntentWhereInput | boolean
    connect?: PaymentIntentWhereUniqueInput
    update?: XOR<XOR<PaymentIntentUpdateToOneWithWhereWithoutPaymentInput, PaymentIntentUpdateWithoutPaymentInput>, PaymentIntentUncheckedUpdateWithoutPaymentInput>
  }

  export type TransactionUncheckedUpdateManyWithoutPaymentNestedInput = {
    create?: XOR<TransactionCreateWithoutPaymentInput, TransactionUncheckedCreateWithoutPaymentInput> | TransactionCreateWithoutPaymentInput[] | TransactionUncheckedCreateWithoutPaymentInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutPaymentInput | TransactionCreateOrConnectWithoutPaymentInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutPaymentInput | TransactionUpsertWithWhereUniqueWithoutPaymentInput[]
    createMany?: TransactionCreateManyPaymentInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutPaymentInput | TransactionUpdateWithWhereUniqueWithoutPaymentInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutPaymentInput | TransactionUpdateManyWithWhereWithoutPaymentInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type PayoutPaymentUncheckedUpdateManyWithoutPaymentNestedInput = {
    create?: XOR<PayoutPaymentCreateWithoutPaymentInput, PayoutPaymentUncheckedCreateWithoutPaymentInput> | PayoutPaymentCreateWithoutPaymentInput[] | PayoutPaymentUncheckedCreateWithoutPaymentInput[]
    connectOrCreate?: PayoutPaymentCreateOrConnectWithoutPaymentInput | PayoutPaymentCreateOrConnectWithoutPaymentInput[]
    upsert?: PayoutPaymentUpsertWithWhereUniqueWithoutPaymentInput | PayoutPaymentUpsertWithWhereUniqueWithoutPaymentInput[]
    createMany?: PayoutPaymentCreateManyPaymentInputEnvelope
    set?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    disconnect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    delete?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    connect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    update?: PayoutPaymentUpdateWithWhereUniqueWithoutPaymentInput | PayoutPaymentUpdateWithWhereUniqueWithoutPaymentInput[]
    updateMany?: PayoutPaymentUpdateManyWithWhereWithoutPaymentInput | PayoutPaymentUpdateManyWithWhereWithoutPaymentInput[]
    deleteMany?: PayoutPaymentScalarWhereInput | PayoutPaymentScalarWhereInput[]
  }

  export type PaymentCreateNestedOneWithoutIntentInput = {
    create?: XOR<PaymentCreateWithoutIntentInput, PaymentUncheckedCreateWithoutIntentInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutIntentInput
    connect?: PaymentWhereUniqueInput
  }

  export type EnumIntentStatusFieldUpdateOperationsInput = {
    set?: $Enums.IntentStatus
  }

  export type PaymentUpdateOneRequiredWithoutIntentNestedInput = {
    create?: XOR<PaymentCreateWithoutIntentInput, PaymentUncheckedCreateWithoutIntentInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutIntentInput
    upsert?: PaymentUpsertWithoutIntentInput
    connect?: PaymentWhereUniqueInput
    update?: XOR<XOR<PaymentUpdateToOneWithWhereWithoutIntentInput, PaymentUpdateWithoutIntentInput>, PaymentUncheckedUpdateWithoutIntentInput>
  }

  export type PaymentCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<PaymentCreateWithoutTransactionsInput, PaymentUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutTransactionsInput
    connect?: PaymentWhereUniqueInput
  }

  export type PayoutCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<PayoutCreateWithoutTransactionsInput, PayoutUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: PayoutCreateOrConnectWithoutTransactionsInput
    connect?: PayoutWhereUniqueInput
  }

  export type EnumTransactionTypeFieldUpdateOperationsInput = {
    set?: $Enums.TransactionType
  }

  export type PaymentUpdateOneWithoutTransactionsNestedInput = {
    create?: XOR<PaymentCreateWithoutTransactionsInput, PaymentUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutTransactionsInput
    upsert?: PaymentUpsertWithoutTransactionsInput
    disconnect?: PaymentWhereInput | boolean
    delete?: PaymentWhereInput | boolean
    connect?: PaymentWhereUniqueInput
    update?: XOR<XOR<PaymentUpdateToOneWithWhereWithoutTransactionsInput, PaymentUpdateWithoutTransactionsInput>, PaymentUncheckedUpdateWithoutTransactionsInput>
  }

  export type PayoutUpdateOneWithoutTransactionsNestedInput = {
    create?: XOR<PayoutCreateWithoutTransactionsInput, PayoutUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: PayoutCreateOrConnectWithoutTransactionsInput
    upsert?: PayoutUpsertWithoutTransactionsInput
    disconnect?: PayoutWhereInput | boolean
    delete?: PayoutWhereInput | boolean
    connect?: PayoutWhereUniqueInput
    update?: XOR<XOR<PayoutUpdateToOneWithWhereWithoutTransactionsInput, PayoutUpdateWithoutTransactionsInput>, PayoutUncheckedUpdateWithoutTransactionsInput>
  }

  export type PayoutPaymentCreateNestedManyWithoutPayoutInput = {
    create?: XOR<PayoutPaymentCreateWithoutPayoutInput, PayoutPaymentUncheckedCreateWithoutPayoutInput> | PayoutPaymentCreateWithoutPayoutInput[] | PayoutPaymentUncheckedCreateWithoutPayoutInput[]
    connectOrCreate?: PayoutPaymentCreateOrConnectWithoutPayoutInput | PayoutPaymentCreateOrConnectWithoutPayoutInput[]
    createMany?: PayoutPaymentCreateManyPayoutInputEnvelope
    connect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
  }

  export type TransactionCreateNestedManyWithoutPayoutInput = {
    create?: XOR<TransactionCreateWithoutPayoutInput, TransactionUncheckedCreateWithoutPayoutInput> | TransactionCreateWithoutPayoutInput[] | TransactionUncheckedCreateWithoutPayoutInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutPayoutInput | TransactionCreateOrConnectWithoutPayoutInput[]
    createMany?: TransactionCreateManyPayoutInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type PayoutPaymentUncheckedCreateNestedManyWithoutPayoutInput = {
    create?: XOR<PayoutPaymentCreateWithoutPayoutInput, PayoutPaymentUncheckedCreateWithoutPayoutInput> | PayoutPaymentCreateWithoutPayoutInput[] | PayoutPaymentUncheckedCreateWithoutPayoutInput[]
    connectOrCreate?: PayoutPaymentCreateOrConnectWithoutPayoutInput | PayoutPaymentCreateOrConnectWithoutPayoutInput[]
    createMany?: PayoutPaymentCreateManyPayoutInputEnvelope
    connect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutPayoutInput = {
    create?: XOR<TransactionCreateWithoutPayoutInput, TransactionUncheckedCreateWithoutPayoutInput> | TransactionCreateWithoutPayoutInput[] | TransactionUncheckedCreateWithoutPayoutInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutPayoutInput | TransactionCreateOrConnectWithoutPayoutInput[]
    createMany?: TransactionCreateManyPayoutInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type EnumPayoutStatusFieldUpdateOperationsInput = {
    set?: $Enums.PayoutStatus
  }

  export type PayoutPaymentUpdateManyWithoutPayoutNestedInput = {
    create?: XOR<PayoutPaymentCreateWithoutPayoutInput, PayoutPaymentUncheckedCreateWithoutPayoutInput> | PayoutPaymentCreateWithoutPayoutInput[] | PayoutPaymentUncheckedCreateWithoutPayoutInput[]
    connectOrCreate?: PayoutPaymentCreateOrConnectWithoutPayoutInput | PayoutPaymentCreateOrConnectWithoutPayoutInput[]
    upsert?: PayoutPaymentUpsertWithWhereUniqueWithoutPayoutInput | PayoutPaymentUpsertWithWhereUniqueWithoutPayoutInput[]
    createMany?: PayoutPaymentCreateManyPayoutInputEnvelope
    set?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    disconnect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    delete?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    connect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    update?: PayoutPaymentUpdateWithWhereUniqueWithoutPayoutInput | PayoutPaymentUpdateWithWhereUniqueWithoutPayoutInput[]
    updateMany?: PayoutPaymentUpdateManyWithWhereWithoutPayoutInput | PayoutPaymentUpdateManyWithWhereWithoutPayoutInput[]
    deleteMany?: PayoutPaymentScalarWhereInput | PayoutPaymentScalarWhereInput[]
  }

  export type TransactionUpdateManyWithoutPayoutNestedInput = {
    create?: XOR<TransactionCreateWithoutPayoutInput, TransactionUncheckedCreateWithoutPayoutInput> | TransactionCreateWithoutPayoutInput[] | TransactionUncheckedCreateWithoutPayoutInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutPayoutInput | TransactionCreateOrConnectWithoutPayoutInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutPayoutInput | TransactionUpsertWithWhereUniqueWithoutPayoutInput[]
    createMany?: TransactionCreateManyPayoutInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutPayoutInput | TransactionUpdateWithWhereUniqueWithoutPayoutInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutPayoutInput | TransactionUpdateManyWithWhereWithoutPayoutInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type PayoutPaymentUncheckedUpdateManyWithoutPayoutNestedInput = {
    create?: XOR<PayoutPaymentCreateWithoutPayoutInput, PayoutPaymentUncheckedCreateWithoutPayoutInput> | PayoutPaymentCreateWithoutPayoutInput[] | PayoutPaymentUncheckedCreateWithoutPayoutInput[]
    connectOrCreate?: PayoutPaymentCreateOrConnectWithoutPayoutInput | PayoutPaymentCreateOrConnectWithoutPayoutInput[]
    upsert?: PayoutPaymentUpsertWithWhereUniqueWithoutPayoutInput | PayoutPaymentUpsertWithWhereUniqueWithoutPayoutInput[]
    createMany?: PayoutPaymentCreateManyPayoutInputEnvelope
    set?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    disconnect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    delete?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    connect?: PayoutPaymentWhereUniqueInput | PayoutPaymentWhereUniqueInput[]
    update?: PayoutPaymentUpdateWithWhereUniqueWithoutPayoutInput | PayoutPaymentUpdateWithWhereUniqueWithoutPayoutInput[]
    updateMany?: PayoutPaymentUpdateManyWithWhereWithoutPayoutInput | PayoutPaymentUpdateManyWithWhereWithoutPayoutInput[]
    deleteMany?: PayoutPaymentScalarWhereInput | PayoutPaymentScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutPayoutNestedInput = {
    create?: XOR<TransactionCreateWithoutPayoutInput, TransactionUncheckedCreateWithoutPayoutInput> | TransactionCreateWithoutPayoutInput[] | TransactionUncheckedCreateWithoutPayoutInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutPayoutInput | TransactionCreateOrConnectWithoutPayoutInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutPayoutInput | TransactionUpsertWithWhereUniqueWithoutPayoutInput[]
    createMany?: TransactionCreateManyPayoutInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutPayoutInput | TransactionUpdateWithWhereUniqueWithoutPayoutInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutPayoutInput | TransactionUpdateManyWithWhereWithoutPayoutInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type PayoutCreateNestedOneWithoutPaymentsInput = {
    create?: XOR<PayoutCreateWithoutPaymentsInput, PayoutUncheckedCreateWithoutPaymentsInput>
    connectOrCreate?: PayoutCreateOrConnectWithoutPaymentsInput
    connect?: PayoutWhereUniqueInput
  }

  export type PaymentCreateNestedOneWithoutPayoutPaymentsInput = {
    create?: XOR<PaymentCreateWithoutPayoutPaymentsInput, PaymentUncheckedCreateWithoutPayoutPaymentsInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutPayoutPaymentsInput
    connect?: PaymentWhereUniqueInput
  }

  export type PayoutUpdateOneRequiredWithoutPaymentsNestedInput = {
    create?: XOR<PayoutCreateWithoutPaymentsInput, PayoutUncheckedCreateWithoutPaymentsInput>
    connectOrCreate?: PayoutCreateOrConnectWithoutPaymentsInput
    upsert?: PayoutUpsertWithoutPaymentsInput
    connect?: PayoutWhereUniqueInput
    update?: XOR<XOR<PayoutUpdateToOneWithWhereWithoutPaymentsInput, PayoutUpdateWithoutPaymentsInput>, PayoutUncheckedUpdateWithoutPaymentsInput>
  }

  export type PaymentUpdateOneRequiredWithoutPayoutPaymentsNestedInput = {
    create?: XOR<PaymentCreateWithoutPayoutPaymentsInput, PaymentUncheckedCreateWithoutPayoutPaymentsInput>
    connectOrCreate?: PaymentCreateOrConnectWithoutPayoutPaymentsInput
    upsert?: PaymentUpsertWithoutPayoutPaymentsInput
    connect?: PaymentWhereUniqueInput
    update?: XOR<XOR<PaymentUpdateToOneWithWhereWithoutPayoutPaymentsInput, PaymentUpdateWithoutPayoutPaymentsInput>, PaymentUncheckedUpdateWithoutPayoutPaymentsInput>
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

  export type NestedEnumPlatformRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.PlatformRole | EnumPlatformRoleFieldRefInput<$PrismaModel>
    in?: $Enums.PlatformRole[] | ListEnumPlatformRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlatformRole[] | ListEnumPlatformRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumPlatformRoleFilter<$PrismaModel> | $Enums.PlatformRole
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

  export type NestedEnumPlatformRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PlatformRole | EnumPlatformRoleFieldRefInput<$PrismaModel>
    in?: $Enums.PlatformRole[] | ListEnumPlatformRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.PlatformRole[] | ListEnumPlatformRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumPlatformRoleWithAggregatesFilter<$PrismaModel> | $Enums.PlatformRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPlatformRoleFilter<$PrismaModel>
    _max?: NestedEnumPlatformRoleFilter<$PrismaModel>
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

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
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

  export type NestedEnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus
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

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
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

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationStatusFilter<$PrismaModel>
    _max?: NestedEnumVerificationStatusFilter<$PrismaModel>
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

  export type NestedEnumBookingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusFilter<$PrismaModel> | $Enums.BookingStatus
  }

  export type NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel> | $Enums.BookingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBookingStatusFilter<$PrismaModel>
    _max?: NestedEnumBookingStatusFilter<$PrismaModel>
  }

  export type NestedEnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type NestedEnumIntentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.IntentStatus | EnumIntentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IntentStatus[] | ListEnumIntentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntentStatus[] | ListEnumIntentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIntentStatusFilter<$PrismaModel> | $Enums.IntentStatus
  }

  export type NestedEnumIntentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntentStatus | EnumIntentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.IntentStatus[] | ListEnumIntentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.IntentStatus[] | ListEnumIntentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumIntentStatusWithAggregatesFilter<$PrismaModel> | $Enums.IntentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumIntentStatusFilter<$PrismaModel>
    _max?: NestedEnumIntentStatusFilter<$PrismaModel>
  }

  export type NestedEnumTransactionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeFilter<$PrismaModel> | $Enums.TransactionType
  }

  export type NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransactionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionTypeFilter<$PrismaModel>
    _max?: NestedEnumTransactionTypeFilter<$PrismaModel>
  }

  export type NestedEnumPayoutStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PayoutStatus | EnumPayoutStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPayoutStatusFilter<$PrismaModel> | $Enums.PayoutStatus
  }

  export type NestedEnumPayoutStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PayoutStatus | EnumPayoutStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPayoutStatusWithAggregatesFilter<$PrismaModel> | $Enums.PayoutStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPayoutStatusFilter<$PrismaModel>
    _max?: NestedEnumPayoutStatusFilter<$PrismaModel>
  }

  export type ShortTermListingCreateWithoutOwnerInput = {
    id?: string
    title: string
    description?: string | null
    address: string
    city: string
    country?: string
    latitude?: number | null
    longitude?: number | null
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests?: number
    photos?: ShortTermListingCreatephotosInput | string[]
    verificationStatus?: $Enums.VerificationStatus
    cadastreNumber?: string | null
    verificationDocUrl?: string | null
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    bookings?: BookingCreateNestedManyWithoutListingInput
  }

  export type ShortTermListingUncheckedCreateWithoutOwnerInput = {
    id?: string
    title: string
    description?: string | null
    address: string
    city: string
    country?: string
    latitude?: number | null
    longitude?: number | null
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests?: number
    photos?: ShortTermListingCreatephotosInput | string[]
    verificationStatus?: $Enums.VerificationStatus
    cadastreNumber?: string | null
    verificationDocUrl?: string | null
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    bookings?: BookingUncheckedCreateNestedManyWithoutListingInput
  }

  export type ShortTermListingCreateOrConnectWithoutOwnerInput = {
    where: ShortTermListingWhereUniqueInput
    create: XOR<ShortTermListingCreateWithoutOwnerInput, ShortTermListingUncheckedCreateWithoutOwnerInput>
  }

  export type ShortTermListingCreateManyOwnerInputEnvelope = {
    data: ShortTermListingCreateManyOwnerInput | ShortTermListingCreateManyOwnerInput[]
    skipDuplicates?: boolean
  }

  export type BookingCreateWithoutGuestInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    listing: ShortTermListingCreateNestedOneWithoutBookingsInput
    payment?: PaymentCreateNestedOneWithoutBookingInput
  }

  export type BookingUncheckedCreateWithoutGuestInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    listingId: string
    payment?: PaymentUncheckedCreateNestedOneWithoutBookingInput
  }

  export type BookingCreateOrConnectWithoutGuestInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutGuestInput, BookingUncheckedCreateWithoutGuestInput>
  }

  export type BookingCreateManyGuestInputEnvelope = {
    data: BookingCreateManyGuestInput | BookingCreateManyGuestInput[]
    skipDuplicates?: boolean
  }

  export type ShortTermListingUpsertWithWhereUniqueWithoutOwnerInput = {
    where: ShortTermListingWhereUniqueInput
    update: XOR<ShortTermListingUpdateWithoutOwnerInput, ShortTermListingUncheckedUpdateWithoutOwnerInput>
    create: XOR<ShortTermListingCreateWithoutOwnerInput, ShortTermListingUncheckedCreateWithoutOwnerInput>
  }

  export type ShortTermListingUpdateWithWhereUniqueWithoutOwnerInput = {
    where: ShortTermListingWhereUniqueInput
    data: XOR<ShortTermListingUpdateWithoutOwnerInput, ShortTermListingUncheckedUpdateWithoutOwnerInput>
  }

  export type ShortTermListingUpdateManyWithWhereWithoutOwnerInput = {
    where: ShortTermListingScalarWhereInput
    data: XOR<ShortTermListingUpdateManyMutationInput, ShortTermListingUncheckedUpdateManyWithoutOwnerInput>
  }

  export type ShortTermListingScalarWhereInput = {
    AND?: ShortTermListingScalarWhereInput | ShortTermListingScalarWhereInput[]
    OR?: ShortTermListingScalarWhereInput[]
    NOT?: ShortTermListingScalarWhereInput | ShortTermListingScalarWhereInput[]
    id?: StringFilter<"ShortTermListing"> | string
    title?: StringFilter<"ShortTermListing"> | string
    description?: StringNullableFilter<"ShortTermListing"> | string | null
    address?: StringFilter<"ShortTermListing"> | string
    city?: StringFilter<"ShortTermListing"> | string
    country?: StringFilter<"ShortTermListing"> | string
    latitude?: FloatNullableFilter<"ShortTermListing"> | number | null
    longitude?: FloatNullableFilter<"ShortTermListing"> | number | null
    nightPriceCents?: IntFilter<"ShortTermListing"> | number
    beds?: IntFilter<"ShortTermListing"> | number
    baths?: FloatFilter<"ShortTermListing"> | number
    maxGuests?: IntFilter<"ShortTermListing"> | number
    photos?: StringNullableListFilter<"ShortTermListing">
    verificationStatus?: EnumVerificationStatusFilter<"ShortTermListing"> | $Enums.VerificationStatus
    cadastreNumber?: StringNullableFilter<"ShortTermListing"> | string | null
    verificationDocUrl?: StringNullableFilter<"ShortTermListing"> | string | null
    verifiedAt?: DateTimeNullableFilter<"ShortTermListing"> | Date | string | null
    createdAt?: DateTimeFilter<"ShortTermListing"> | Date | string
    updatedAt?: DateTimeFilter<"ShortTermListing"> | Date | string
    ownerId?: StringFilter<"ShortTermListing"> | string
  }

  export type BookingUpsertWithWhereUniqueWithoutGuestInput = {
    where: BookingWhereUniqueInput
    update: XOR<BookingUpdateWithoutGuestInput, BookingUncheckedUpdateWithoutGuestInput>
    create: XOR<BookingCreateWithoutGuestInput, BookingUncheckedCreateWithoutGuestInput>
  }

  export type BookingUpdateWithWhereUniqueWithoutGuestInput = {
    where: BookingWhereUniqueInput
    data: XOR<BookingUpdateWithoutGuestInput, BookingUncheckedUpdateWithoutGuestInput>
  }

  export type BookingUpdateManyWithWhereWithoutGuestInput = {
    where: BookingScalarWhereInput
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyWithoutGuestInput>
  }

  export type BookingScalarWhereInput = {
    AND?: BookingScalarWhereInput | BookingScalarWhereInput[]
    OR?: BookingScalarWhereInput[]
    NOT?: BookingScalarWhereInput | BookingScalarWhereInput[]
    id?: StringFilter<"Booking"> | string
    checkIn?: DateTimeFilter<"Booking"> | Date | string
    checkOut?: DateTimeFilter<"Booking"> | Date | string
    nights?: IntFilter<"Booking"> | number
    totalCents?: IntFilter<"Booking"> | number
    guestFeeCents?: IntFilter<"Booking"> | number
    hostFeeCents?: IntFilter<"Booking"> | number
    status?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    guestNotes?: StringNullableFilter<"Booking"> | string | null
    checkedInAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    checkedOutAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    guestId?: StringFilter<"Booking"> | string
    listingId?: StringFilter<"Booking"> | string
  }

  export type UserCreateWithoutShortTermListingsInput = {
    id?: string
    email: string
    role?: $Enums.PlatformRole
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    bookingsAsGuest?: BookingCreateNestedManyWithoutGuestInput
  }

  export type UserUncheckedCreateWithoutShortTermListingsInput = {
    id?: string
    email: string
    role?: $Enums.PlatformRole
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    bookingsAsGuest?: BookingUncheckedCreateNestedManyWithoutGuestInput
  }

  export type UserCreateOrConnectWithoutShortTermListingsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutShortTermListingsInput, UserUncheckedCreateWithoutShortTermListingsInput>
  }

  export type BookingCreateWithoutListingInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    guest: UserCreateNestedOneWithoutBookingsAsGuestInput
    payment?: PaymentCreateNestedOneWithoutBookingInput
  }

  export type BookingUncheckedCreateWithoutListingInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    guestId: string
    payment?: PaymentUncheckedCreateNestedOneWithoutBookingInput
  }

  export type BookingCreateOrConnectWithoutListingInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutListingInput, BookingUncheckedCreateWithoutListingInput>
  }

  export type BookingCreateManyListingInputEnvelope = {
    data: BookingCreateManyListingInput | BookingCreateManyListingInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutShortTermListingsInput = {
    update: XOR<UserUpdateWithoutShortTermListingsInput, UserUncheckedUpdateWithoutShortTermListingsInput>
    create: XOR<UserCreateWithoutShortTermListingsInput, UserUncheckedCreateWithoutShortTermListingsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutShortTermListingsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutShortTermListingsInput, UserUncheckedUpdateWithoutShortTermListingsInput>
  }

  export type UserUpdateWithoutShortTermListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumPlatformRoleFieldUpdateOperationsInput | $Enums.PlatformRole
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookingsAsGuest?: BookingUpdateManyWithoutGuestNestedInput
  }

  export type UserUncheckedUpdateWithoutShortTermListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumPlatformRoleFieldUpdateOperationsInput | $Enums.PlatformRole
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookingsAsGuest?: BookingUncheckedUpdateManyWithoutGuestNestedInput
  }

  export type BookingUpsertWithWhereUniqueWithoutListingInput = {
    where: BookingWhereUniqueInput
    update: XOR<BookingUpdateWithoutListingInput, BookingUncheckedUpdateWithoutListingInput>
    create: XOR<BookingCreateWithoutListingInput, BookingUncheckedCreateWithoutListingInput>
  }

  export type BookingUpdateWithWhereUniqueWithoutListingInput = {
    where: BookingWhereUniqueInput
    data: XOR<BookingUpdateWithoutListingInput, BookingUncheckedUpdateWithoutListingInput>
  }

  export type BookingUpdateManyWithWhereWithoutListingInput = {
    where: BookingScalarWhereInput
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyWithoutListingInput>
  }

  export type UserCreateWithoutBookingsAsGuestInput = {
    id?: string
    email: string
    role?: $Enums.PlatformRole
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    shortTermListings?: ShortTermListingCreateNestedManyWithoutOwnerInput
  }

  export type UserUncheckedCreateWithoutBookingsAsGuestInput = {
    id?: string
    email: string
    role?: $Enums.PlatformRole
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    shortTermListings?: ShortTermListingUncheckedCreateNestedManyWithoutOwnerInput
  }

  export type UserCreateOrConnectWithoutBookingsAsGuestInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutBookingsAsGuestInput, UserUncheckedCreateWithoutBookingsAsGuestInput>
  }

  export type ShortTermListingCreateWithoutBookingsInput = {
    id?: string
    title: string
    description?: string | null
    address: string
    city: string
    country?: string
    latitude?: number | null
    longitude?: number | null
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests?: number
    photos?: ShortTermListingCreatephotosInput | string[]
    verificationStatus?: $Enums.VerificationStatus
    cadastreNumber?: string | null
    verificationDocUrl?: string | null
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    owner: UserCreateNestedOneWithoutShortTermListingsInput
  }

  export type ShortTermListingUncheckedCreateWithoutBookingsInput = {
    id?: string
    title: string
    description?: string | null
    address: string
    city: string
    country?: string
    latitude?: number | null
    longitude?: number | null
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests?: number
    photos?: ShortTermListingCreatephotosInput | string[]
    verificationStatus?: $Enums.VerificationStatus
    cadastreNumber?: string | null
    verificationDocUrl?: string | null
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    ownerId: string
  }

  export type ShortTermListingCreateOrConnectWithoutBookingsInput = {
    where: ShortTermListingWhereUniqueInput
    create: XOR<ShortTermListingCreateWithoutBookingsInput, ShortTermListingUncheckedCreateWithoutBookingsInput>
  }

  export type PaymentCreateWithoutBookingInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    intent?: PaymentIntentCreateNestedOneWithoutPaymentInput
    transactions?: TransactionCreateNestedManyWithoutPaymentInput
    payoutPayments?: PayoutPaymentCreateNestedManyWithoutPaymentInput
  }

  export type PaymentUncheckedCreateWithoutBookingInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    intent?: PaymentIntentUncheckedCreateNestedOneWithoutPaymentInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutPaymentInput
    payoutPayments?: PayoutPaymentUncheckedCreateNestedManyWithoutPaymentInput
  }

  export type PaymentCreateOrConnectWithoutBookingInput = {
    where: PaymentWhereUniqueInput
    create: XOR<PaymentCreateWithoutBookingInput, PaymentUncheckedCreateWithoutBookingInput>
  }

  export type UserUpsertWithoutBookingsAsGuestInput = {
    update: XOR<UserUpdateWithoutBookingsAsGuestInput, UserUncheckedUpdateWithoutBookingsAsGuestInput>
    create: XOR<UserCreateWithoutBookingsAsGuestInput, UserUncheckedCreateWithoutBookingsAsGuestInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutBookingsAsGuestInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutBookingsAsGuestInput, UserUncheckedUpdateWithoutBookingsAsGuestInput>
  }

  export type UserUpdateWithoutBookingsAsGuestInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumPlatformRoleFieldUpdateOperationsInput | $Enums.PlatformRole
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shortTermListings?: ShortTermListingUpdateManyWithoutOwnerNestedInput
  }

  export type UserUncheckedUpdateWithoutBookingsAsGuestInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    role?: EnumPlatformRoleFieldUpdateOperationsInput | $Enums.PlatformRole
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shortTermListings?: ShortTermListingUncheckedUpdateManyWithoutOwnerNestedInput
  }

  export type ShortTermListingUpsertWithoutBookingsInput = {
    update: XOR<ShortTermListingUpdateWithoutBookingsInput, ShortTermListingUncheckedUpdateWithoutBookingsInput>
    create: XOR<ShortTermListingCreateWithoutBookingsInput, ShortTermListingUncheckedCreateWithoutBookingsInput>
    where?: ShortTermListingWhereInput
  }

  export type ShortTermListingUpdateToOneWithWhereWithoutBookingsInput = {
    where?: ShortTermListingWhereInput
    data: XOR<ShortTermListingUpdateWithoutBookingsInput, ShortTermListingUncheckedUpdateWithoutBookingsInput>
  }

  export type ShortTermListingUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    nightPriceCents?: IntFieldUpdateOperationsInput | number
    beds?: IntFieldUpdateOperationsInput | number
    baths?: FloatFieldUpdateOperationsInput | number
    maxGuests?: IntFieldUpdateOperationsInput | number
    photos?: ShortTermListingUpdatephotosInput | string[]
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    cadastreNumber?: NullableStringFieldUpdateOperationsInput | string | null
    verificationDocUrl?: NullableStringFieldUpdateOperationsInput | string | null
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    owner?: UserUpdateOneRequiredWithoutShortTermListingsNestedInput
  }

  export type ShortTermListingUncheckedUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    nightPriceCents?: IntFieldUpdateOperationsInput | number
    beds?: IntFieldUpdateOperationsInput | number
    baths?: FloatFieldUpdateOperationsInput | number
    maxGuests?: IntFieldUpdateOperationsInput | number
    photos?: ShortTermListingUpdatephotosInput | string[]
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    cadastreNumber?: NullableStringFieldUpdateOperationsInput | string | null
    verificationDocUrl?: NullableStringFieldUpdateOperationsInput | string | null
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ownerId?: StringFieldUpdateOperationsInput | string
  }

  export type PaymentUpsertWithoutBookingInput = {
    update: XOR<PaymentUpdateWithoutBookingInput, PaymentUncheckedUpdateWithoutBookingInput>
    create: XOR<PaymentCreateWithoutBookingInput, PaymentUncheckedCreateWithoutBookingInput>
    where?: PaymentWhereInput
  }

  export type PaymentUpdateToOneWithWhereWithoutBookingInput = {
    where?: PaymentWhereInput
    data: XOR<PaymentUpdateWithoutBookingInput, PaymentUncheckedUpdateWithoutBookingInput>
  }

  export type PaymentUpdateWithoutBookingInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    intent?: PaymentIntentUpdateOneWithoutPaymentNestedInput
    transactions?: TransactionUpdateManyWithoutPaymentNestedInput
    payoutPayments?: PayoutPaymentUpdateManyWithoutPaymentNestedInput
  }

  export type PaymentUncheckedUpdateWithoutBookingInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    intent?: PaymentIntentUncheckedUpdateOneWithoutPaymentNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutPaymentNestedInput
    payoutPayments?: PayoutPaymentUncheckedUpdateManyWithoutPaymentNestedInput
  }

  export type BookingCreateWithoutPaymentInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    guest: UserCreateNestedOneWithoutBookingsAsGuestInput
    listing: ShortTermListingCreateNestedOneWithoutBookingsInput
  }

  export type BookingUncheckedCreateWithoutPaymentInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    guestId: string
    listingId: string
  }

  export type BookingCreateOrConnectWithoutPaymentInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutPaymentInput, BookingUncheckedCreateWithoutPaymentInput>
  }

  export type PaymentIntentCreateWithoutPaymentInput = {
    id?: string
    bookingId: string
    amountCents: number
    currency?: string
    providerIntentId?: string | null
    status?: $Enums.IntentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentIntentUncheckedCreateWithoutPaymentInput = {
    id?: string
    bookingId: string
    amountCents: number
    currency?: string
    providerIntentId?: string | null
    status?: $Enums.IntentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentIntentCreateOrConnectWithoutPaymentInput = {
    where: PaymentIntentWhereUniqueInput
    create: XOR<PaymentIntentCreateWithoutPaymentInput, PaymentIntentUncheckedCreateWithoutPaymentInput>
  }

  export type TransactionCreateWithoutPaymentInput = {
    id?: string
    type: $Enums.TransactionType
    paymentIntentId?: string | null
    amountCents: number
    providerRef?: string | null
    metadata?: string | null
    createdAt?: Date | string
    payout?: PayoutCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateWithoutPaymentInput = {
    id?: string
    type: $Enums.TransactionType
    paymentIntentId?: string | null
    payoutId?: string | null
    amountCents: number
    providerRef?: string | null
    metadata?: string | null
    createdAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutPaymentInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutPaymentInput, TransactionUncheckedCreateWithoutPaymentInput>
  }

  export type TransactionCreateManyPaymentInputEnvelope = {
    data: TransactionCreateManyPaymentInput | TransactionCreateManyPaymentInput[]
    skipDuplicates?: boolean
  }

  export type PayoutPaymentCreateWithoutPaymentInput = {
    createdAt?: Date | string
    payout: PayoutCreateNestedOneWithoutPaymentsInput
  }

  export type PayoutPaymentUncheckedCreateWithoutPaymentInput = {
    payoutId: string
    createdAt?: Date | string
  }

  export type PayoutPaymentCreateOrConnectWithoutPaymentInput = {
    where: PayoutPaymentWhereUniqueInput
    create: XOR<PayoutPaymentCreateWithoutPaymentInput, PayoutPaymentUncheckedCreateWithoutPaymentInput>
  }

  export type PayoutPaymentCreateManyPaymentInputEnvelope = {
    data: PayoutPaymentCreateManyPaymentInput | PayoutPaymentCreateManyPaymentInput[]
    skipDuplicates?: boolean
  }

  export type BookingUpsertWithoutPaymentInput = {
    update: XOR<BookingUpdateWithoutPaymentInput, BookingUncheckedUpdateWithoutPaymentInput>
    create: XOR<BookingCreateWithoutPaymentInput, BookingUncheckedCreateWithoutPaymentInput>
    where?: BookingWhereInput
  }

  export type BookingUpdateToOneWithWhereWithoutPaymentInput = {
    where?: BookingWhereInput
    data: XOR<BookingUpdateWithoutPaymentInput, BookingUncheckedUpdateWithoutPaymentInput>
  }

  export type BookingUpdateWithoutPaymentInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    guest?: UserUpdateOneRequiredWithoutBookingsAsGuestNestedInput
    listing?: ShortTermListingUpdateOneRequiredWithoutBookingsNestedInput
  }

  export type BookingUncheckedUpdateWithoutPaymentInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    guestId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
  }

  export type PaymentIntentUpsertWithoutPaymentInput = {
    update: XOR<PaymentIntentUpdateWithoutPaymentInput, PaymentIntentUncheckedUpdateWithoutPaymentInput>
    create: XOR<PaymentIntentCreateWithoutPaymentInput, PaymentIntentUncheckedCreateWithoutPaymentInput>
    where?: PaymentIntentWhereInput
  }

  export type PaymentIntentUpdateToOneWithWhereWithoutPaymentInput = {
    where?: PaymentIntentWhereInput
    data: XOR<PaymentIntentUpdateWithoutPaymentInput, PaymentIntentUncheckedUpdateWithoutPaymentInput>
  }

  export type PaymentIntentUpdateWithoutPaymentInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    providerIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumIntentStatusFieldUpdateOperationsInput | $Enums.IntentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentIntentUncheckedUpdateWithoutPaymentInput = {
    id?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    providerIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumIntentStatusFieldUpdateOperationsInput | $Enums.IntentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUpsertWithWhereUniqueWithoutPaymentInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutPaymentInput, TransactionUncheckedUpdateWithoutPaymentInput>
    create: XOR<TransactionCreateWithoutPaymentInput, TransactionUncheckedCreateWithoutPaymentInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutPaymentInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutPaymentInput, TransactionUncheckedUpdateWithoutPaymentInput>
  }

  export type TransactionUpdateManyWithWhereWithoutPaymentInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutPaymentInput>
  }

  export type TransactionScalarWhereInput = {
    AND?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    OR?: TransactionScalarWhereInput[]
    NOT?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    id?: StringFilter<"Transaction"> | string
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    paymentId?: StringNullableFilter<"Transaction"> | string | null
    paymentIntentId?: StringNullableFilter<"Transaction"> | string | null
    payoutId?: StringNullableFilter<"Transaction"> | string | null
    amountCents?: IntFilter<"Transaction"> | number
    providerRef?: StringNullableFilter<"Transaction"> | string | null
    metadata?: StringNullableFilter<"Transaction"> | string | null
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
  }

  export type PayoutPaymentUpsertWithWhereUniqueWithoutPaymentInput = {
    where: PayoutPaymentWhereUniqueInput
    update: XOR<PayoutPaymentUpdateWithoutPaymentInput, PayoutPaymentUncheckedUpdateWithoutPaymentInput>
    create: XOR<PayoutPaymentCreateWithoutPaymentInput, PayoutPaymentUncheckedCreateWithoutPaymentInput>
  }

  export type PayoutPaymentUpdateWithWhereUniqueWithoutPaymentInput = {
    where: PayoutPaymentWhereUniqueInput
    data: XOR<PayoutPaymentUpdateWithoutPaymentInput, PayoutPaymentUncheckedUpdateWithoutPaymentInput>
  }

  export type PayoutPaymentUpdateManyWithWhereWithoutPaymentInput = {
    where: PayoutPaymentScalarWhereInput
    data: XOR<PayoutPaymentUpdateManyMutationInput, PayoutPaymentUncheckedUpdateManyWithoutPaymentInput>
  }

  export type PayoutPaymentScalarWhereInput = {
    AND?: PayoutPaymentScalarWhereInput | PayoutPaymentScalarWhereInput[]
    OR?: PayoutPaymentScalarWhereInput[]
    NOT?: PayoutPaymentScalarWhereInput | PayoutPaymentScalarWhereInput[]
    payoutId?: StringFilter<"PayoutPayment"> | string
    paymentId?: StringFilter<"PayoutPayment"> | string
    createdAt?: DateTimeFilter<"PayoutPayment"> | Date | string
  }

  export type PaymentCreateWithoutIntentInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    booking: BookingCreateNestedOneWithoutPaymentInput
    transactions?: TransactionCreateNestedManyWithoutPaymentInput
    payoutPayments?: PayoutPaymentCreateNestedManyWithoutPaymentInput
  }

  export type PaymentUncheckedCreateWithoutIntentInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    bookingId: string
    transactions?: TransactionUncheckedCreateNestedManyWithoutPaymentInput
    payoutPayments?: PayoutPaymentUncheckedCreateNestedManyWithoutPaymentInput
  }

  export type PaymentCreateOrConnectWithoutIntentInput = {
    where: PaymentWhereUniqueInput
    create: XOR<PaymentCreateWithoutIntentInput, PaymentUncheckedCreateWithoutIntentInput>
  }

  export type PaymentUpsertWithoutIntentInput = {
    update: XOR<PaymentUpdateWithoutIntentInput, PaymentUncheckedUpdateWithoutIntentInput>
    create: XOR<PaymentCreateWithoutIntentInput, PaymentUncheckedCreateWithoutIntentInput>
    where?: PaymentWhereInput
  }

  export type PaymentUpdateToOneWithWhereWithoutIntentInput = {
    where?: PaymentWhereInput
    data: XOR<PaymentUpdateWithoutIntentInput, PaymentUncheckedUpdateWithoutIntentInput>
  }

  export type PaymentUpdateWithoutIntentInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    booking?: BookingUpdateOneRequiredWithoutPaymentNestedInput
    transactions?: TransactionUpdateManyWithoutPaymentNestedInput
    payoutPayments?: PayoutPaymentUpdateManyWithoutPaymentNestedInput
  }

  export type PaymentUncheckedUpdateWithoutIntentInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookingId?: StringFieldUpdateOperationsInput | string
    transactions?: TransactionUncheckedUpdateManyWithoutPaymentNestedInput
    payoutPayments?: PayoutPaymentUncheckedUpdateManyWithoutPaymentNestedInput
  }

  export type PaymentCreateWithoutTransactionsInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    booking: BookingCreateNestedOneWithoutPaymentInput
    intent?: PaymentIntentCreateNestedOneWithoutPaymentInput
    payoutPayments?: PayoutPaymentCreateNestedManyWithoutPaymentInput
  }

  export type PaymentUncheckedCreateWithoutTransactionsInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    bookingId: string
    intent?: PaymentIntentUncheckedCreateNestedOneWithoutPaymentInput
    payoutPayments?: PayoutPaymentUncheckedCreateNestedManyWithoutPaymentInput
  }

  export type PaymentCreateOrConnectWithoutTransactionsInput = {
    where: PaymentWhereUniqueInput
    create: XOR<PaymentCreateWithoutTransactionsInput, PaymentUncheckedCreateWithoutTransactionsInput>
  }

  export type PayoutCreateWithoutTransactionsInput = {
    id?: string
    hostId: string
    totalCents: number
    status?: $Enums.PayoutStatus
    providerPayoutId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    payments?: PayoutPaymentCreateNestedManyWithoutPayoutInput
  }

  export type PayoutUncheckedCreateWithoutTransactionsInput = {
    id?: string
    hostId: string
    totalCents: number
    status?: $Enums.PayoutStatus
    providerPayoutId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    payments?: PayoutPaymentUncheckedCreateNestedManyWithoutPayoutInput
  }

  export type PayoutCreateOrConnectWithoutTransactionsInput = {
    where: PayoutWhereUniqueInput
    create: XOR<PayoutCreateWithoutTransactionsInput, PayoutUncheckedCreateWithoutTransactionsInput>
  }

  export type PaymentUpsertWithoutTransactionsInput = {
    update: XOR<PaymentUpdateWithoutTransactionsInput, PaymentUncheckedUpdateWithoutTransactionsInput>
    create: XOR<PaymentCreateWithoutTransactionsInput, PaymentUncheckedCreateWithoutTransactionsInput>
    where?: PaymentWhereInput
  }

  export type PaymentUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: PaymentWhereInput
    data: XOR<PaymentUpdateWithoutTransactionsInput, PaymentUncheckedUpdateWithoutTransactionsInput>
  }

  export type PaymentUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    booking?: BookingUpdateOneRequiredWithoutPaymentNestedInput
    intent?: PaymentIntentUpdateOneWithoutPaymentNestedInput
    payoutPayments?: PayoutPaymentUpdateManyWithoutPaymentNestedInput
  }

  export type PaymentUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookingId?: StringFieldUpdateOperationsInput | string
    intent?: PaymentIntentUncheckedUpdateOneWithoutPaymentNestedInput
    payoutPayments?: PayoutPaymentUncheckedUpdateManyWithoutPaymentNestedInput
  }

  export type PayoutUpsertWithoutTransactionsInput = {
    update: XOR<PayoutUpdateWithoutTransactionsInput, PayoutUncheckedUpdateWithoutTransactionsInput>
    create: XOR<PayoutCreateWithoutTransactionsInput, PayoutUncheckedCreateWithoutTransactionsInput>
    where?: PayoutWhereInput
  }

  export type PayoutUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: PayoutWhereInput
    data: XOR<PayoutUpdateWithoutTransactionsInput, PayoutUncheckedUpdateWithoutTransactionsInput>
  }

  export type PayoutUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    providerPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payments?: PayoutPaymentUpdateManyWithoutPayoutNestedInput
  }

  export type PayoutUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    providerPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payments?: PayoutPaymentUncheckedUpdateManyWithoutPayoutNestedInput
  }

  export type PayoutPaymentCreateWithoutPayoutInput = {
    createdAt?: Date | string
    payment: PaymentCreateNestedOneWithoutPayoutPaymentsInput
  }

  export type PayoutPaymentUncheckedCreateWithoutPayoutInput = {
    paymentId: string
    createdAt?: Date | string
  }

  export type PayoutPaymentCreateOrConnectWithoutPayoutInput = {
    where: PayoutPaymentWhereUniqueInput
    create: XOR<PayoutPaymentCreateWithoutPayoutInput, PayoutPaymentUncheckedCreateWithoutPayoutInput>
  }

  export type PayoutPaymentCreateManyPayoutInputEnvelope = {
    data: PayoutPaymentCreateManyPayoutInput | PayoutPaymentCreateManyPayoutInput[]
    skipDuplicates?: boolean
  }

  export type TransactionCreateWithoutPayoutInput = {
    id?: string
    type: $Enums.TransactionType
    paymentIntentId?: string | null
    amountCents: number
    providerRef?: string | null
    metadata?: string | null
    createdAt?: Date | string
    payment?: PaymentCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateWithoutPayoutInput = {
    id?: string
    type: $Enums.TransactionType
    paymentId?: string | null
    paymentIntentId?: string | null
    amountCents: number
    providerRef?: string | null
    metadata?: string | null
    createdAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutPayoutInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutPayoutInput, TransactionUncheckedCreateWithoutPayoutInput>
  }

  export type TransactionCreateManyPayoutInputEnvelope = {
    data: TransactionCreateManyPayoutInput | TransactionCreateManyPayoutInput[]
    skipDuplicates?: boolean
  }

  export type PayoutPaymentUpsertWithWhereUniqueWithoutPayoutInput = {
    where: PayoutPaymentWhereUniqueInput
    update: XOR<PayoutPaymentUpdateWithoutPayoutInput, PayoutPaymentUncheckedUpdateWithoutPayoutInput>
    create: XOR<PayoutPaymentCreateWithoutPayoutInput, PayoutPaymentUncheckedCreateWithoutPayoutInput>
  }

  export type PayoutPaymentUpdateWithWhereUniqueWithoutPayoutInput = {
    where: PayoutPaymentWhereUniqueInput
    data: XOR<PayoutPaymentUpdateWithoutPayoutInput, PayoutPaymentUncheckedUpdateWithoutPayoutInput>
  }

  export type PayoutPaymentUpdateManyWithWhereWithoutPayoutInput = {
    where: PayoutPaymentScalarWhereInput
    data: XOR<PayoutPaymentUpdateManyMutationInput, PayoutPaymentUncheckedUpdateManyWithoutPayoutInput>
  }

  export type TransactionUpsertWithWhereUniqueWithoutPayoutInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutPayoutInput, TransactionUncheckedUpdateWithoutPayoutInput>
    create: XOR<TransactionCreateWithoutPayoutInput, TransactionUncheckedCreateWithoutPayoutInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutPayoutInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutPayoutInput, TransactionUncheckedUpdateWithoutPayoutInput>
  }

  export type TransactionUpdateManyWithWhereWithoutPayoutInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutPayoutInput>
  }

  export type PayoutCreateWithoutPaymentsInput = {
    id?: string
    hostId: string
    totalCents: number
    status?: $Enums.PayoutStatus
    providerPayoutId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionCreateNestedManyWithoutPayoutInput
  }

  export type PayoutUncheckedCreateWithoutPaymentsInput = {
    id?: string
    hostId: string
    totalCents: number
    status?: $Enums.PayoutStatus
    providerPayoutId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutPayoutInput
  }

  export type PayoutCreateOrConnectWithoutPaymentsInput = {
    where: PayoutWhereUniqueInput
    create: XOR<PayoutCreateWithoutPaymentsInput, PayoutUncheckedCreateWithoutPaymentsInput>
  }

  export type PaymentCreateWithoutPayoutPaymentsInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    booking: BookingCreateNestedOneWithoutPaymentInput
    intent?: PaymentIntentCreateNestedOneWithoutPaymentInput
    transactions?: TransactionCreateNestedManyWithoutPaymentInput
  }

  export type PaymentUncheckedCreateWithoutPayoutPaymentsInput = {
    id?: string
    amountCents: number
    guestFeeCents: number
    hostFeeCents: number
    hostPayoutCents: number
    status?: $Enums.PaymentStatus
    stripePaymentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    bookingId: string
    intent?: PaymentIntentUncheckedCreateNestedOneWithoutPaymentInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutPaymentInput
  }

  export type PaymentCreateOrConnectWithoutPayoutPaymentsInput = {
    where: PaymentWhereUniqueInput
    create: XOR<PaymentCreateWithoutPayoutPaymentsInput, PaymentUncheckedCreateWithoutPayoutPaymentsInput>
  }

  export type PayoutUpsertWithoutPaymentsInput = {
    update: XOR<PayoutUpdateWithoutPaymentsInput, PayoutUncheckedUpdateWithoutPaymentsInput>
    create: XOR<PayoutCreateWithoutPaymentsInput, PayoutUncheckedCreateWithoutPaymentsInput>
    where?: PayoutWhereInput
  }

  export type PayoutUpdateToOneWithWhereWithoutPaymentsInput = {
    where?: PayoutWhereInput
    data: XOR<PayoutUpdateWithoutPaymentsInput, PayoutUncheckedUpdateWithoutPaymentsInput>
  }

  export type PayoutUpdateWithoutPaymentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    providerPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUpdateManyWithoutPayoutNestedInput
  }

  export type PayoutUncheckedUpdateWithoutPaymentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    totalCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    providerPayoutId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutPayoutNestedInput
  }

  export type PaymentUpsertWithoutPayoutPaymentsInput = {
    update: XOR<PaymentUpdateWithoutPayoutPaymentsInput, PaymentUncheckedUpdateWithoutPayoutPaymentsInput>
    create: XOR<PaymentCreateWithoutPayoutPaymentsInput, PaymentUncheckedCreateWithoutPayoutPaymentsInput>
    where?: PaymentWhereInput
  }

  export type PaymentUpdateToOneWithWhereWithoutPayoutPaymentsInput = {
    where?: PaymentWhereInput
    data: XOR<PaymentUpdateWithoutPayoutPaymentsInput, PaymentUncheckedUpdateWithoutPayoutPaymentsInput>
  }

  export type PaymentUpdateWithoutPayoutPaymentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    booking?: BookingUpdateOneRequiredWithoutPaymentNestedInput
    intent?: PaymentIntentUpdateOneWithoutPaymentNestedInput
    transactions?: TransactionUpdateManyWithoutPaymentNestedInput
  }

  export type PaymentUncheckedUpdateWithoutPayoutPaymentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    amountCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    hostPayoutCents?: IntFieldUpdateOperationsInput | number
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    stripePaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookingId?: StringFieldUpdateOperationsInput | string
    intent?: PaymentIntentUncheckedUpdateOneWithoutPaymentNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutPaymentNestedInput
  }

  export type ShortTermListingCreateManyOwnerInput = {
    id?: string
    title: string
    description?: string | null
    address: string
    city: string
    country?: string
    latitude?: number | null
    longitude?: number | null
    nightPriceCents: number
    beds: number
    baths: number
    maxGuests?: number
    photos?: ShortTermListingCreatephotosInput | string[]
    verificationStatus?: $Enums.VerificationStatus
    cadastreNumber?: string | null
    verificationDocUrl?: string | null
    verifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BookingCreateManyGuestInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    listingId: string
  }

  export type ShortTermListingUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    nightPriceCents?: IntFieldUpdateOperationsInput | number
    beds?: IntFieldUpdateOperationsInput | number
    baths?: FloatFieldUpdateOperationsInput | number
    maxGuests?: IntFieldUpdateOperationsInput | number
    photos?: ShortTermListingUpdatephotosInput | string[]
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    cadastreNumber?: NullableStringFieldUpdateOperationsInput | string | null
    verificationDocUrl?: NullableStringFieldUpdateOperationsInput | string | null
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookings?: BookingUpdateManyWithoutListingNestedInput
  }

  export type ShortTermListingUncheckedUpdateWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    nightPriceCents?: IntFieldUpdateOperationsInput | number
    beds?: IntFieldUpdateOperationsInput | number
    baths?: FloatFieldUpdateOperationsInput | number
    maxGuests?: IntFieldUpdateOperationsInput | number
    photos?: ShortTermListingUpdatephotosInput | string[]
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    cadastreNumber?: NullableStringFieldUpdateOperationsInput | string | null
    verificationDocUrl?: NullableStringFieldUpdateOperationsInput | string | null
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookings?: BookingUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ShortTermListingUncheckedUpdateManyWithoutOwnerInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    nightPriceCents?: IntFieldUpdateOperationsInput | number
    beds?: IntFieldUpdateOperationsInput | number
    baths?: FloatFieldUpdateOperationsInput | number
    maxGuests?: IntFieldUpdateOperationsInput | number
    photos?: ShortTermListingUpdatephotosInput | string[]
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    cadastreNumber?: NullableStringFieldUpdateOperationsInput | string | null
    verificationDocUrl?: NullableStringFieldUpdateOperationsInput | string | null
    verifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUpdateWithoutGuestInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listing?: ShortTermListingUpdateOneRequiredWithoutBookingsNestedInput
    payment?: PaymentUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateWithoutGuestInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listingId?: StringFieldUpdateOperationsInput | string
    payment?: PaymentUncheckedUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateManyWithoutGuestInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listingId?: StringFieldUpdateOperationsInput | string
  }

  export type BookingCreateManyListingInput = {
    id?: string
    checkIn: Date | string
    checkOut: Date | string
    nights: number
    totalCents: number
    guestFeeCents?: number
    hostFeeCents?: number
    status?: $Enums.BookingStatus
    guestNotes?: string | null
    checkedInAt?: Date | string | null
    checkedOutAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    guestId: string
  }

  export type BookingUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    guest?: UserUpdateOneRequiredWithoutBookingsAsGuestNestedInput
    payment?: PaymentUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    guestId?: StringFieldUpdateOperationsInput | string
    payment?: PaymentUncheckedUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateManyWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    checkIn?: DateTimeFieldUpdateOperationsInput | Date | string
    checkOut?: DateTimeFieldUpdateOperationsInput | Date | string
    nights?: IntFieldUpdateOperationsInput | number
    totalCents?: IntFieldUpdateOperationsInput | number
    guestFeeCents?: IntFieldUpdateOperationsInput | number
    hostFeeCents?: IntFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    guestNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkedInAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    checkedOutAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    guestId?: StringFieldUpdateOperationsInput | string
  }

  export type TransactionCreateManyPaymentInput = {
    id?: string
    type: $Enums.TransactionType
    paymentIntentId?: string | null
    payoutId?: string | null
    amountCents: number
    providerRef?: string | null
    metadata?: string | null
    createdAt?: Date | string
  }

  export type PayoutPaymentCreateManyPaymentInput = {
    payoutId: string
    createdAt?: Date | string
  }

  export type TransactionUpdateWithoutPaymentInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payout?: PayoutUpdateOneWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateWithoutPaymentInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    payoutId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyWithoutPaymentInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    payoutId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutPaymentUpdateWithoutPaymentInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payout?: PayoutUpdateOneRequiredWithoutPaymentsNestedInput
  }

  export type PayoutPaymentUncheckedUpdateWithoutPaymentInput = {
    payoutId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutPaymentUncheckedUpdateManyWithoutPaymentInput = {
    payoutId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutPaymentCreateManyPayoutInput = {
    paymentId: string
    createdAt?: Date | string
  }

  export type TransactionCreateManyPayoutInput = {
    id?: string
    type: $Enums.TransactionType
    paymentId?: string | null
    paymentIntentId?: string | null
    amountCents: number
    providerRef?: string | null
    metadata?: string | null
    createdAt?: Date | string
  }

  export type PayoutPaymentUpdateWithoutPayoutInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payment?: PaymentUpdateOneRequiredWithoutPayoutPaymentsNestedInput
  }

  export type PayoutPaymentUncheckedUpdateWithoutPayoutInput = {
    paymentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutPaymentUncheckedUpdateManyWithoutPayoutInput = {
    paymentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUpdateWithoutPayoutInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    payment?: PaymentUpdateOneWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateWithoutPayoutInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentId?: NullableStringFieldUpdateOperationsInput | string | null
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyWithoutPayoutInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    paymentId?: NullableStringFieldUpdateOperationsInput | string | null
    paymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    providerRef?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ShortTermListingCountOutputTypeDefaultArgs instead
     */
    export type ShortTermListingCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ShortTermListingCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PaymentCountOutputTypeDefaultArgs instead
     */
    export type PaymentCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PaymentCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PayoutCountOutputTypeDefaultArgs instead
     */
    export type PayoutCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PayoutCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ShortTermListingDefaultArgs instead
     */
    export type ShortTermListingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ShortTermListingDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BookingDefaultArgs instead
     */
    export type BookingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BookingDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PaymentDefaultArgs instead
     */
    export type PaymentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PaymentDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PaymentIntentDefaultArgs instead
     */
    export type PaymentIntentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PaymentIntentDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TransactionDefaultArgs instead
     */
    export type TransactionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TransactionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PayoutDefaultArgs instead
     */
    export type PayoutArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PayoutDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PayoutPaymentDefaultArgs instead
     */
    export type PayoutPaymentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PayoutPaymentDefaultArgs<ExtArgs>

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