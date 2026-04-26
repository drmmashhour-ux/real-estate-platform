
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Listing
 * 
 */
export type Listing = $Result.DefaultSelection<Prisma.$ListingPayload>
/**
 * Model Booking
 * 
 */
export type Booking = $Result.DefaultSelection<Prisma.$BookingPayload>
/**
 * Model MarketplacePaymentLedger
 * Order 67 — one append-only row per successful Stripe Checkout session (idempotent on `stripeCheckoutSessionId`).
 */
export type MarketplacePaymentLedger = $Result.DefaultSelection<Prisma.$MarketplacePaymentLedgerPayload>
/**
 * Model ListingBooking
 * Aligns with monolith `listing_bookings` (user ↔ `listings` interaction).
 */
export type ListingBooking = $Result.DefaultSelection<Prisma.$ListingBookingPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Listings
 * const listings = await prisma.listing.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Listings
   * const listings = await prisma.listing.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
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
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
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
   * Read more in our [docs](https://pris.ly/d/raw-queries).
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
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.listing`: Exposes CRUD operations for the **Listing** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Listings
    * const listings = await prisma.listing.findMany()
    * ```
    */
  get listing(): Prisma.ListingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.booking`: Exposes CRUD operations for the **Booking** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Bookings
    * const bookings = await prisma.booking.findMany()
    * ```
    */
  get booking(): Prisma.BookingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.marketplacePaymentLedger`: Exposes CRUD operations for the **MarketplacePaymentLedger** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MarketplacePaymentLedgers
    * const marketplacePaymentLedgers = await prisma.marketplacePaymentLedger.findMany()
    * ```
    */
  get marketplacePaymentLedger(): Prisma.MarketplacePaymentLedgerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.listingBooking`: Exposes CRUD operations for the **ListingBooking** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ListingBookings
    * const listingBookings = await prisma.listingBooking.findMany()
    * ```
    */
  get listingBooking(): Prisma.ListingBookingDelegate<ExtArgs, ClientOptions>;
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
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
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
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
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
    Listing: 'Listing',
    Booking: 'Booking',
    MarketplacePaymentLedger: 'MarketplacePaymentLedger',
    ListingBooking: 'ListingBooking'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "listing" | "booking" | "marketplacePaymentLedger" | "listingBooking"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Listing: {
        payload: Prisma.$ListingPayload<ExtArgs>
        fields: Prisma.ListingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ListingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ListingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          findFirst: {
            args: Prisma.ListingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ListingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          findMany: {
            args: Prisma.ListingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>[]
          }
          create: {
            args: Prisma.ListingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          createMany: {
            args: Prisma.ListingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ListingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>[]
          }
          delete: {
            args: Prisma.ListingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          update: {
            args: Prisma.ListingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          deleteMany: {
            args: Prisma.ListingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ListingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ListingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>[]
          }
          upsert: {
            args: Prisma.ListingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          aggregate: {
            args: Prisma.ListingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateListing>
          }
          groupBy: {
            args: Prisma.ListingGroupByArgs<ExtArgs>
            result: $Utils.Optional<ListingGroupByOutputType>[]
          }
          count: {
            args: Prisma.ListingCountArgs<ExtArgs>
            result: $Utils.Optional<ListingCountAggregateOutputType> | number
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
          updateManyAndReturn: {
            args: Prisma.BookingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
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
      MarketplacePaymentLedger: {
        payload: Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>
        fields: Prisma.MarketplacePaymentLedgerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MarketplacePaymentLedgerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MarketplacePaymentLedgerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload>
          }
          findFirst: {
            args: Prisma.MarketplacePaymentLedgerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MarketplacePaymentLedgerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload>
          }
          findMany: {
            args: Prisma.MarketplacePaymentLedgerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload>[]
          }
          create: {
            args: Prisma.MarketplacePaymentLedgerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload>
          }
          createMany: {
            args: Prisma.MarketplacePaymentLedgerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MarketplacePaymentLedgerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload>[]
          }
          delete: {
            args: Prisma.MarketplacePaymentLedgerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload>
          }
          update: {
            args: Prisma.MarketplacePaymentLedgerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload>
          }
          deleteMany: {
            args: Prisma.MarketplacePaymentLedgerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MarketplacePaymentLedgerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MarketplacePaymentLedgerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload>[]
          }
          upsert: {
            args: Prisma.MarketplacePaymentLedgerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MarketplacePaymentLedgerPayload>
          }
          aggregate: {
            args: Prisma.MarketplacePaymentLedgerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMarketplacePaymentLedger>
          }
          groupBy: {
            args: Prisma.MarketplacePaymentLedgerGroupByArgs<ExtArgs>
            result: $Utils.Optional<MarketplacePaymentLedgerGroupByOutputType>[]
          }
          count: {
            args: Prisma.MarketplacePaymentLedgerCountArgs<ExtArgs>
            result: $Utils.Optional<MarketplacePaymentLedgerCountAggregateOutputType> | number
          }
        }
      }
      ListingBooking: {
        payload: Prisma.$ListingBookingPayload<ExtArgs>
        fields: Prisma.ListingBookingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ListingBookingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ListingBookingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload>
          }
          findFirst: {
            args: Prisma.ListingBookingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ListingBookingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload>
          }
          findMany: {
            args: Prisma.ListingBookingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload>[]
          }
          create: {
            args: Prisma.ListingBookingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload>
          }
          createMany: {
            args: Prisma.ListingBookingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ListingBookingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload>[]
          }
          delete: {
            args: Prisma.ListingBookingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload>
          }
          update: {
            args: Prisma.ListingBookingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload>
          }
          deleteMany: {
            args: Prisma.ListingBookingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ListingBookingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ListingBookingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload>[]
          }
          upsert: {
            args: Prisma.ListingBookingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingBookingPayload>
          }
          aggregate: {
            args: Prisma.ListingBookingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateListingBooking>
          }
          groupBy: {
            args: Prisma.ListingBookingGroupByArgs<ExtArgs>
            result: $Utils.Optional<ListingBookingGroupByOutputType>[]
          }
          count: {
            args: Prisma.ListingBookingCountArgs<ExtArgs>
            result: $Utils.Optional<ListingBookingCountAggregateOutputType> | number
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
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
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
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    listing?: ListingOmit
    booking?: BookingOmit
    marketplacePaymentLedger?: MarketplacePaymentLedgerOmit
    listingBooking?: ListingBookingOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

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
    | 'updateManyAndReturn'
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
   * Count Type ListingCountOutputType
   */

  export type ListingCountOutputType = {
    listingBookings: number
    bookings: number
  }

  export type ListingCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    listingBookings?: boolean | ListingCountOutputTypeCountListingBookingsArgs
    bookings?: boolean | ListingCountOutputTypeCountBookingsArgs
  }

  // Custom InputTypes
  /**
   * ListingCountOutputType without action
   */
  export type ListingCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingCountOutputType
     */
    select?: ListingCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ListingCountOutputType without action
   */
  export type ListingCountOutputTypeCountListingBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ListingBookingWhereInput
  }

  /**
   * ListingCountOutputType without action
   */
  export type ListingCountOutputTypeCountBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Listing
   */

  export type AggregateListing = {
    _count: ListingCountAggregateOutputType | null
    _avg: ListingAvgAggregateOutputType | null
    _sum: ListingSumAggregateOutputType | null
    _min: ListingMinAggregateOutputType | null
    _max: ListingMaxAggregateOutputType | null
  }

  export type ListingAvgAggregateOutputType = {
    price: number | null
  }

  export type ListingSumAggregateOutputType = {
    price: number | null
  }

  export type ListingMinAggregateOutputType = {
    id: string | null
    title: string | null
    price: number | null
    city: string | null
    country: string | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ListingMaxAggregateOutputType = {
    id: string | null
    title: string | null
    price: number | null
    city: string | null
    country: string | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ListingCountAggregateOutputType = {
    id: number
    title: number
    price: number
    city: number
    country: number
    userId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ListingAvgAggregateInputType = {
    price?: true
  }

  export type ListingSumAggregateInputType = {
    price?: true
  }

  export type ListingMinAggregateInputType = {
    id?: true
    title?: true
    price?: true
    city?: true
    country?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ListingMaxAggregateInputType = {
    id?: true
    title?: true
    price?: true
    city?: true
    country?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ListingCountAggregateInputType = {
    id?: true
    title?: true
    price?: true
    city?: true
    country?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ListingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Listing to aggregate.
     */
    where?: ListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Listings to fetch.
     */
    orderBy?: ListingOrderByWithRelationInput | ListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Listings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Listings
    **/
    _count?: true | ListingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ListingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ListingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ListingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ListingMaxAggregateInputType
  }

  export type GetListingAggregateType<T extends ListingAggregateArgs> = {
        [P in keyof T & keyof AggregateListing]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateListing[P]>
      : GetScalarType<T[P], AggregateListing[P]>
  }




  export type ListingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ListingWhereInput
    orderBy?: ListingOrderByWithAggregationInput | ListingOrderByWithAggregationInput[]
    by: ListingScalarFieldEnum[] | ListingScalarFieldEnum
    having?: ListingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ListingCountAggregateInputType | true
    _avg?: ListingAvgAggregateInputType
    _sum?: ListingSumAggregateInputType
    _min?: ListingMinAggregateInputType
    _max?: ListingMaxAggregateInputType
  }

  export type ListingGroupByOutputType = {
    id: string
    title: string
    price: number
    city: string
    country: string
    userId: string
    createdAt: Date
    updatedAt: Date
    _count: ListingCountAggregateOutputType | null
    _avg: ListingAvgAggregateOutputType | null
    _sum: ListingSumAggregateOutputType | null
    _min: ListingMinAggregateOutputType | null
    _max: ListingMaxAggregateOutputType | null
  }

  type GetListingGroupByPayload<T extends ListingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ListingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ListingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ListingGroupByOutputType[P]>
            : GetScalarType<T[P], ListingGroupByOutputType[P]>
        }
      >
    >


  export type ListingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    price?: boolean
    city?: boolean
    country?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    listingBookings?: boolean | Listing$listingBookingsArgs<ExtArgs>
    bookings?: boolean | Listing$bookingsArgs<ExtArgs>
    _count?: boolean | ListingCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["listing"]>

  export type ListingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    price?: boolean
    city?: boolean
    country?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["listing"]>

  export type ListingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    price?: boolean
    city?: boolean
    country?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["listing"]>

  export type ListingSelectScalar = {
    id?: boolean
    title?: boolean
    price?: boolean
    city?: boolean
    country?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ListingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "price" | "city" | "country" | "userId" | "createdAt" | "updatedAt", ExtArgs["result"]["listing"]>
  export type ListingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    listingBookings?: boolean | Listing$listingBookingsArgs<ExtArgs>
    bookings?: boolean | Listing$bookingsArgs<ExtArgs>
    _count?: boolean | ListingCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ListingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ListingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ListingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Listing"
    objects: {
      listingBookings: Prisma.$ListingBookingPayload<ExtArgs>[]
      bookings: Prisma.$BookingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      price: number
      city: string
      country: string
      /**
       * FK to `users.id` — no `User` relation (cross-client).
       */
      userId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["listing"]>
    composites: {}
  }

  type ListingGetPayload<S extends boolean | null | undefined | ListingDefaultArgs> = $Result.GetResult<Prisma.$ListingPayload, S>

  type ListingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ListingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ListingCountAggregateInputType | true
    }

  export interface ListingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Listing'], meta: { name: 'Listing' } }
    /**
     * Find zero or one Listing that matches the filter.
     * @param {ListingFindUniqueArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ListingFindUniqueArgs>(args: SelectSubset<T, ListingFindUniqueArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Listing that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ListingFindUniqueOrThrowArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ListingFindUniqueOrThrowArgs>(args: SelectSubset<T, ListingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Listing that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFindFirstArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ListingFindFirstArgs>(args?: SelectSubset<T, ListingFindFirstArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Listing that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFindFirstOrThrowArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ListingFindFirstOrThrowArgs>(args?: SelectSubset<T, ListingFindFirstOrThrowArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Listings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Listings
     * const listings = await prisma.listing.findMany()
     * 
     * // Get first 10 Listings
     * const listings = await prisma.listing.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const listingWithIdOnly = await prisma.listing.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ListingFindManyArgs>(args?: SelectSubset<T, ListingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Listing.
     * @param {ListingCreateArgs} args - Arguments to create a Listing.
     * @example
     * // Create one Listing
     * const Listing = await prisma.listing.create({
     *   data: {
     *     // ... data to create a Listing
     *   }
     * })
     * 
     */
    create<T extends ListingCreateArgs>(args: SelectSubset<T, ListingCreateArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Listings.
     * @param {ListingCreateManyArgs} args - Arguments to create many Listings.
     * @example
     * // Create many Listings
     * const listing = await prisma.listing.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ListingCreateManyArgs>(args?: SelectSubset<T, ListingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Listings and returns the data saved in the database.
     * @param {ListingCreateManyAndReturnArgs} args - Arguments to create many Listings.
     * @example
     * // Create many Listings
     * const listing = await prisma.listing.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Listings and only return the `id`
     * const listingWithIdOnly = await prisma.listing.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ListingCreateManyAndReturnArgs>(args?: SelectSubset<T, ListingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Listing.
     * @param {ListingDeleteArgs} args - Arguments to delete one Listing.
     * @example
     * // Delete one Listing
     * const Listing = await prisma.listing.delete({
     *   where: {
     *     // ... filter to delete one Listing
     *   }
     * })
     * 
     */
    delete<T extends ListingDeleteArgs>(args: SelectSubset<T, ListingDeleteArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Listing.
     * @param {ListingUpdateArgs} args - Arguments to update one Listing.
     * @example
     * // Update one Listing
     * const listing = await prisma.listing.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ListingUpdateArgs>(args: SelectSubset<T, ListingUpdateArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Listings.
     * @param {ListingDeleteManyArgs} args - Arguments to filter Listings to delete.
     * @example
     * // Delete a few Listings
     * const { count } = await prisma.listing.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ListingDeleteManyArgs>(args?: SelectSubset<T, ListingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Listings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Listings
     * const listing = await prisma.listing.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ListingUpdateManyArgs>(args: SelectSubset<T, ListingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Listings and returns the data updated in the database.
     * @param {ListingUpdateManyAndReturnArgs} args - Arguments to update many Listings.
     * @example
     * // Update many Listings
     * const listing = await prisma.listing.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Listings and only return the `id`
     * const listingWithIdOnly = await prisma.listing.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ListingUpdateManyAndReturnArgs>(args: SelectSubset<T, ListingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Listing.
     * @param {ListingUpsertArgs} args - Arguments to update or create a Listing.
     * @example
     * // Update or create a Listing
     * const listing = await prisma.listing.upsert({
     *   create: {
     *     // ... data to create a Listing
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Listing we want to update
     *   }
     * })
     */
    upsert<T extends ListingUpsertArgs>(args: SelectSubset<T, ListingUpsertArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Listings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingCountArgs} args - Arguments to filter Listings to count.
     * @example
     * // Count the number of Listings
     * const count = await prisma.listing.count({
     *   where: {
     *     // ... the filter for the Listings we want to count
     *   }
     * })
    **/
    count<T extends ListingCountArgs>(
      args?: Subset<T, ListingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ListingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Listing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ListingAggregateArgs>(args: Subset<T, ListingAggregateArgs>): Prisma.PrismaPromise<GetListingAggregateType<T>>

    /**
     * Group by Listing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingGroupByArgs} args - Group by arguments.
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
      T extends ListingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ListingGroupByArgs['orderBy'] }
        : { orderBy?: ListingGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ListingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetListingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Listing model
   */
  readonly fields: ListingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Listing.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ListingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    listingBookings<T extends Listing$listingBookingsArgs<ExtArgs> = {}>(args?: Subset<T, Listing$listingBookingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    bookings<T extends Listing$bookingsArgs<ExtArgs> = {}>(args?: Subset<T, Listing$bookingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the Listing model
   */
  interface ListingFieldRefs {
    readonly id: FieldRef<"Listing", 'String'>
    readonly title: FieldRef<"Listing", 'String'>
    readonly price: FieldRef<"Listing", 'Float'>
    readonly city: FieldRef<"Listing", 'String'>
    readonly country: FieldRef<"Listing", 'String'>
    readonly userId: FieldRef<"Listing", 'String'>
    readonly createdAt: FieldRef<"Listing", 'DateTime'>
    readonly updatedAt: FieldRef<"Listing", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Listing findUnique
   */
  export type ListingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listing to fetch.
     */
    where: ListingWhereUniqueInput
  }

  /**
   * Listing findUniqueOrThrow
   */
  export type ListingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listing to fetch.
     */
    where: ListingWhereUniqueInput
  }

  /**
   * Listing findFirst
   */
  export type ListingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listing to fetch.
     */
    where?: ListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Listings to fetch.
     */
    orderBy?: ListingOrderByWithRelationInput | ListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Listings.
     */
    cursor?: ListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Listings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Listings.
     */
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * Listing findFirstOrThrow
   */
  export type ListingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listing to fetch.
     */
    where?: ListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Listings to fetch.
     */
    orderBy?: ListingOrderByWithRelationInput | ListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Listings.
     */
    cursor?: ListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Listings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Listings.
     */
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * Listing findMany
   */
  export type ListingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listings to fetch.
     */
    where?: ListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Listings to fetch.
     */
    orderBy?: ListingOrderByWithRelationInput | ListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Listings.
     */
    cursor?: ListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Listings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Listings.
     */
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * Listing create
   */
  export type ListingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * The data needed to create a Listing.
     */
    data: XOR<ListingCreateInput, ListingUncheckedCreateInput>
  }

  /**
   * Listing createMany
   */
  export type ListingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Listings.
     */
    data: ListingCreateManyInput | ListingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Listing createManyAndReturn
   */
  export type ListingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * The data used to create many Listings.
     */
    data: ListingCreateManyInput | ListingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Listing update
   */
  export type ListingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * The data needed to update a Listing.
     */
    data: XOR<ListingUpdateInput, ListingUncheckedUpdateInput>
    /**
     * Choose, which Listing to update.
     */
    where: ListingWhereUniqueInput
  }

  /**
   * Listing updateMany
   */
  export type ListingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Listings.
     */
    data: XOR<ListingUpdateManyMutationInput, ListingUncheckedUpdateManyInput>
    /**
     * Filter which Listings to update
     */
    where?: ListingWhereInput
    /**
     * Limit how many Listings to update.
     */
    limit?: number
  }

  /**
   * Listing updateManyAndReturn
   */
  export type ListingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * The data used to update Listings.
     */
    data: XOR<ListingUpdateManyMutationInput, ListingUncheckedUpdateManyInput>
    /**
     * Filter which Listings to update
     */
    where?: ListingWhereInput
    /**
     * Limit how many Listings to update.
     */
    limit?: number
  }

  /**
   * Listing upsert
   */
  export type ListingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * The filter to search for the Listing to update in case it exists.
     */
    where: ListingWhereUniqueInput
    /**
     * In case the Listing found by the `where` argument doesn't exist, create a new Listing with this data.
     */
    create: XOR<ListingCreateInput, ListingUncheckedCreateInput>
    /**
     * In case the Listing was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ListingUpdateInput, ListingUncheckedUpdateInput>
  }

  /**
   * Listing delete
   */
  export type ListingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter which Listing to delete.
     */
    where: ListingWhereUniqueInput
  }

  /**
   * Listing deleteMany
   */
  export type ListingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Listings to delete
     */
    where?: ListingWhereInput
    /**
     * Limit how many Listings to delete.
     */
    limit?: number
  }

  /**
   * Listing.listingBookings
   */
  export type Listing$listingBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    where?: ListingBookingWhereInput
    orderBy?: ListingBookingOrderByWithRelationInput | ListingBookingOrderByWithRelationInput[]
    cursor?: ListingBookingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ListingBookingScalarFieldEnum | ListingBookingScalarFieldEnum[]
  }

  /**
   * Listing.bookings
   */
  export type Listing$bookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
   * Listing without action
   */
  export type ListingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
  }


  /**
   * Model Booking
   */

  export type AggregateBooking = {
    _count: BookingCountAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  export type BookingMinAggregateOutputType = {
    id: string | null
    listingId: string | null
    userId: string | null
    startDate: Date | null
    endDate: Date | null
    status: string | null
    expiresAt: Date | null
    cancelledAt: Date | null
    stripePaymentIntentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BookingMaxAggregateOutputType = {
    id: string | null
    listingId: string | null
    userId: string | null
    startDate: Date | null
    endDate: Date | null
    status: string | null
    expiresAt: Date | null
    cancelledAt: Date | null
    stripePaymentIntentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BookingCountAggregateOutputType = {
    id: number
    listingId: number
    userId: number
    startDate: number
    endDate: number
    status: number
    expiresAt: number
    cancelledAt: number
    stripePaymentIntentId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BookingMinAggregateInputType = {
    id?: true
    listingId?: true
    userId?: true
    startDate?: true
    endDate?: true
    status?: true
    expiresAt?: true
    cancelledAt?: true
    stripePaymentIntentId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BookingMaxAggregateInputType = {
    id?: true
    listingId?: true
    userId?: true
    startDate?: true
    endDate?: true
    status?: true
    expiresAt?: true
    cancelledAt?: true
    stripePaymentIntentId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BookingCountAggregateInputType = {
    id?: true
    listingId?: true
    userId?: true
    startDate?: true
    endDate?: true
    status?: true
    expiresAt?: true
    cancelledAt?: true
    stripePaymentIntentId?: true
    createdAt?: true
    updatedAt?: true
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
    _min?: BookingMinAggregateInputType
    _max?: BookingMaxAggregateInputType
  }

  export type BookingGroupByOutputType = {
    id: string
    listingId: string
    userId: string
    startDate: Date
    endDate: Date
    status: string
    expiresAt: Date | null
    cancelledAt: Date | null
    stripePaymentIntentId: string | null
    createdAt: Date
    updatedAt: Date
    _count: BookingCountAggregateOutputType | null
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
    listingId?: boolean
    userId?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    expiresAt?: boolean
    cancelledAt?: boolean
    stripePaymentIntentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    listingId?: boolean
    userId?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    expiresAt?: boolean
    cancelledAt?: boolean
    stripePaymentIntentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    listingId?: boolean
    userId?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    expiresAt?: boolean
    cancelledAt?: boolean
    stripePaymentIntentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectScalar = {
    id?: boolean
    listingId?: boolean
    userId?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    expiresAt?: boolean
    cancelledAt?: boolean
    stripePaymentIntentId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BookingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "listingId" | "userId" | "startDate" | "endDate" | "status" | "expiresAt" | "cancelledAt" | "stripePaymentIntentId" | "createdAt" | "updatedAt", ExtArgs["result"]["booking"]>
  export type BookingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }
  export type BookingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }
  export type BookingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }

  export type $BookingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Booking"
    objects: {
      listing: Prisma.$ListingPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      listingId: string
      /**
       * FK to `users.id` — no `User` relation (cross-client).
       */
      userId: string
      /**
       * Order 61: `DATE` only — no time component; avoids tz drift in inventory/pricing.
       */
      startDate: Date
      endDate: Date
      /**
       * `pending` = unpaid hold, `confirmed` = paid, `expired` = hold lapsed (Order 57).
       */
      status: string
      /**
       * When a `pending` hold may no longer block inventory; cleared when `confirmed`.
       */
      expiresAt: Date | null
      /**
       * Set when a guest (or system) cancels; releases inventory.
       */
      cancelledAt: Date | null
      /**
       * Stripe `pi_*` for marketplace checkouts; used for refund on cancel (Orders 57–59).
       */
      stripePaymentIntentId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["booking"]>
    composites: {}
  }

  type BookingGetPayload<S extends boolean | null | undefined | BookingDefaultArgs> = $Result.GetResult<Prisma.$BookingPayload, S>

  type BookingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BookingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BookingCountAggregateInputType | true
    }

  export interface BookingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
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
    findUnique<T extends BookingFindUniqueArgs>(args: SelectSubset<T, BookingFindUniqueArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findUniqueOrThrow<T extends BookingFindUniqueOrThrowArgs>(args: SelectSubset<T, BookingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findFirst<T extends BookingFindFirstArgs>(args?: SelectSubset<T, BookingFindFirstArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findFirstOrThrow<T extends BookingFindFirstOrThrowArgs>(args?: SelectSubset<T, BookingFindFirstOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findMany<T extends BookingFindManyArgs>(args?: SelectSubset<T, BookingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

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
    create<T extends BookingCreateArgs>(args: SelectSubset<T, BookingCreateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    createManyAndReturn<T extends BookingCreateManyAndReturnArgs>(args?: SelectSubset<T, BookingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

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
    delete<T extends BookingDeleteArgs>(args: SelectSubset<T, BookingDeleteArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    update<T extends BookingUpdateArgs>(args: SelectSubset<T, BookingUpdateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
     * Update zero or more Bookings and returns the data updated in the database.
     * @param {BookingUpdateManyAndReturnArgs} args - Arguments to update many Bookings.
     * @example
     * // Update many Bookings
     * const booking = await prisma.booking.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Bookings and only return the `id`
     * const bookingWithIdOnly = await prisma.booking.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BookingUpdateManyAndReturnArgs>(args: SelectSubset<T, BookingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

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
    upsert<T extends BookingUpsertArgs>(args: SelectSubset<T, BookingUpsertArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


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
  export interface Prisma__BookingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    listing<T extends ListingDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ListingDefaultArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
    readonly listingId: FieldRef<"Booking", 'String'>
    readonly userId: FieldRef<"Booking", 'String'>
    readonly startDate: FieldRef<"Booking", 'DateTime'>
    readonly endDate: FieldRef<"Booking", 'DateTime'>
    readonly status: FieldRef<"Booking", 'String'>
    readonly expiresAt: FieldRef<"Booking", 'DateTime'>
    readonly cancelledAt: FieldRef<"Booking", 'DateTime'>
    readonly stripePaymentIntentId: FieldRef<"Booking", 'String'>
    readonly createdAt: FieldRef<"Booking", 'DateTime'>
    readonly updatedAt: FieldRef<"Booking", 'DateTime'>
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
    /**
     * Limit how many Bookings to update.
     */
    limit?: number
  }

  /**
   * Booking updateManyAndReturn
   */
  export type BookingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * The data used to update Bookings.
     */
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyInput>
    /**
     * Filter which Bookings to update
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingIncludeUpdateManyAndReturn<ExtArgs> | null
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
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
    /**
     * Limit how many Bookings to delete.
     */
    limit?: number
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
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
  }


  /**
   * Model MarketplacePaymentLedger
   */

  export type AggregateMarketplacePaymentLedger = {
    _count: MarketplacePaymentLedgerCountAggregateOutputType | null
    _avg: MarketplacePaymentLedgerAvgAggregateOutputType | null
    _sum: MarketplacePaymentLedgerSumAggregateOutputType | null
    _min: MarketplacePaymentLedgerMinAggregateOutputType | null
    _max: MarketplacePaymentLedgerMaxAggregateOutputType | null
  }

  export type MarketplacePaymentLedgerAvgAggregateOutputType = {
    amountCents: number | null
    applicationFeeCents: number | null
  }

  export type MarketplacePaymentLedgerSumAggregateOutputType = {
    amountCents: number | null
    applicationFeeCents: number | null
  }

  export type MarketplacePaymentLedgerMinAggregateOutputType = {
    id: string | null
    listingId: string | null
    bookingId: string | null
    amountCents: number | null
    applicationFeeCents: number | null
    stripePaymentIntentId: string | null
    stripeCheckoutSessionId: string | null
    destinationAccountId: string | null
    createdAt: Date | null
  }

  export type MarketplacePaymentLedgerMaxAggregateOutputType = {
    id: string | null
    listingId: string | null
    bookingId: string | null
    amountCents: number | null
    applicationFeeCents: number | null
    stripePaymentIntentId: string | null
    stripeCheckoutSessionId: string | null
    destinationAccountId: string | null
    createdAt: Date | null
  }

  export type MarketplacePaymentLedgerCountAggregateOutputType = {
    id: number
    listingId: number
    bookingId: number
    amountCents: number
    applicationFeeCents: number
    stripePaymentIntentId: number
    stripeCheckoutSessionId: number
    destinationAccountId: number
    createdAt: number
    _all: number
  }


  export type MarketplacePaymentLedgerAvgAggregateInputType = {
    amountCents?: true
    applicationFeeCents?: true
  }

  export type MarketplacePaymentLedgerSumAggregateInputType = {
    amountCents?: true
    applicationFeeCents?: true
  }

  export type MarketplacePaymentLedgerMinAggregateInputType = {
    id?: true
    listingId?: true
    bookingId?: true
    amountCents?: true
    applicationFeeCents?: true
    stripePaymentIntentId?: true
    stripeCheckoutSessionId?: true
    destinationAccountId?: true
    createdAt?: true
  }

  export type MarketplacePaymentLedgerMaxAggregateInputType = {
    id?: true
    listingId?: true
    bookingId?: true
    amountCents?: true
    applicationFeeCents?: true
    stripePaymentIntentId?: true
    stripeCheckoutSessionId?: true
    destinationAccountId?: true
    createdAt?: true
  }

  export type MarketplacePaymentLedgerCountAggregateInputType = {
    id?: true
    listingId?: true
    bookingId?: true
    amountCents?: true
    applicationFeeCents?: true
    stripePaymentIntentId?: true
    stripeCheckoutSessionId?: true
    destinationAccountId?: true
    createdAt?: true
    _all?: true
  }

  export type MarketplacePaymentLedgerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MarketplacePaymentLedger to aggregate.
     */
    where?: MarketplacePaymentLedgerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketplacePaymentLedgers to fetch.
     */
    orderBy?: MarketplacePaymentLedgerOrderByWithRelationInput | MarketplacePaymentLedgerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MarketplacePaymentLedgerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketplacePaymentLedgers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketplacePaymentLedgers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MarketplacePaymentLedgers
    **/
    _count?: true | MarketplacePaymentLedgerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MarketplacePaymentLedgerAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MarketplacePaymentLedgerSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MarketplacePaymentLedgerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MarketplacePaymentLedgerMaxAggregateInputType
  }

  export type GetMarketplacePaymentLedgerAggregateType<T extends MarketplacePaymentLedgerAggregateArgs> = {
        [P in keyof T & keyof AggregateMarketplacePaymentLedger]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMarketplacePaymentLedger[P]>
      : GetScalarType<T[P], AggregateMarketplacePaymentLedger[P]>
  }




  export type MarketplacePaymentLedgerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MarketplacePaymentLedgerWhereInput
    orderBy?: MarketplacePaymentLedgerOrderByWithAggregationInput | MarketplacePaymentLedgerOrderByWithAggregationInput[]
    by: MarketplacePaymentLedgerScalarFieldEnum[] | MarketplacePaymentLedgerScalarFieldEnum
    having?: MarketplacePaymentLedgerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MarketplacePaymentLedgerCountAggregateInputType | true
    _avg?: MarketplacePaymentLedgerAvgAggregateInputType
    _sum?: MarketplacePaymentLedgerSumAggregateInputType
    _min?: MarketplacePaymentLedgerMinAggregateInputType
    _max?: MarketplacePaymentLedgerMaxAggregateInputType
  }

  export type MarketplacePaymentLedgerGroupByOutputType = {
    id: string
    listingId: string | null
    bookingId: string | null
    amountCents: number
    applicationFeeCents: number
    stripePaymentIntentId: string | null
    stripeCheckoutSessionId: string
    destinationAccountId: string | null
    createdAt: Date
    _count: MarketplacePaymentLedgerCountAggregateOutputType | null
    _avg: MarketplacePaymentLedgerAvgAggregateOutputType | null
    _sum: MarketplacePaymentLedgerSumAggregateOutputType | null
    _min: MarketplacePaymentLedgerMinAggregateOutputType | null
    _max: MarketplacePaymentLedgerMaxAggregateOutputType | null
  }

  type GetMarketplacePaymentLedgerGroupByPayload<T extends MarketplacePaymentLedgerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MarketplacePaymentLedgerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MarketplacePaymentLedgerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MarketplacePaymentLedgerGroupByOutputType[P]>
            : GetScalarType<T[P], MarketplacePaymentLedgerGroupByOutputType[P]>
        }
      >
    >


  export type MarketplacePaymentLedgerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    listingId?: boolean
    bookingId?: boolean
    amountCents?: boolean
    applicationFeeCents?: boolean
    stripePaymentIntentId?: boolean
    stripeCheckoutSessionId?: boolean
    destinationAccountId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["marketplacePaymentLedger"]>

  export type MarketplacePaymentLedgerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    listingId?: boolean
    bookingId?: boolean
    amountCents?: boolean
    applicationFeeCents?: boolean
    stripePaymentIntentId?: boolean
    stripeCheckoutSessionId?: boolean
    destinationAccountId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["marketplacePaymentLedger"]>

  export type MarketplacePaymentLedgerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    listingId?: boolean
    bookingId?: boolean
    amountCents?: boolean
    applicationFeeCents?: boolean
    stripePaymentIntentId?: boolean
    stripeCheckoutSessionId?: boolean
    destinationAccountId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["marketplacePaymentLedger"]>

  export type MarketplacePaymentLedgerSelectScalar = {
    id?: boolean
    listingId?: boolean
    bookingId?: boolean
    amountCents?: boolean
    applicationFeeCents?: boolean
    stripePaymentIntentId?: boolean
    stripeCheckoutSessionId?: boolean
    destinationAccountId?: boolean
    createdAt?: boolean
  }

  export type MarketplacePaymentLedgerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "listingId" | "bookingId" | "amountCents" | "applicationFeeCents" | "stripePaymentIntentId" | "stripeCheckoutSessionId" | "destinationAccountId" | "createdAt", ExtArgs["result"]["marketplacePaymentLedger"]>

  export type $MarketplacePaymentLedgerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MarketplacePaymentLedger"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      listingId: string | null
      bookingId: string | null
      /**
       * Gross amount charged to the guest (Stripe `amount_total`, minor units).
       */
      amountCents: number
      /**
       * Platform application fee in minor units (Connect `application_fee_amount` or metadata echo).
       */
      applicationFeeCents: number
      stripePaymentIntentId: string | null
      /**
       * Idempotency: webhook retries / duplicate events do not double-log finance rows.
       */
      stripeCheckoutSessionId: string
      /**
       * Connect `transfer_data.destination` (`acct_...`) when set at session creation.
       */
      destinationAccountId: string | null
      createdAt: Date
    }, ExtArgs["result"]["marketplacePaymentLedger"]>
    composites: {}
  }

  type MarketplacePaymentLedgerGetPayload<S extends boolean | null | undefined | MarketplacePaymentLedgerDefaultArgs> = $Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload, S>

  type MarketplacePaymentLedgerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MarketplacePaymentLedgerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MarketplacePaymentLedgerCountAggregateInputType | true
    }

  export interface MarketplacePaymentLedgerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MarketplacePaymentLedger'], meta: { name: 'MarketplacePaymentLedger' } }
    /**
     * Find zero or one MarketplacePaymentLedger that matches the filter.
     * @param {MarketplacePaymentLedgerFindUniqueArgs} args - Arguments to find a MarketplacePaymentLedger
     * @example
     * // Get one MarketplacePaymentLedger
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MarketplacePaymentLedgerFindUniqueArgs>(args: SelectSubset<T, MarketplacePaymentLedgerFindUniqueArgs<ExtArgs>>): Prisma__MarketplacePaymentLedgerClient<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MarketplacePaymentLedger that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MarketplacePaymentLedgerFindUniqueOrThrowArgs} args - Arguments to find a MarketplacePaymentLedger
     * @example
     * // Get one MarketplacePaymentLedger
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MarketplacePaymentLedgerFindUniqueOrThrowArgs>(args: SelectSubset<T, MarketplacePaymentLedgerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MarketplacePaymentLedgerClient<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MarketplacePaymentLedger that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketplacePaymentLedgerFindFirstArgs} args - Arguments to find a MarketplacePaymentLedger
     * @example
     * // Get one MarketplacePaymentLedger
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MarketplacePaymentLedgerFindFirstArgs>(args?: SelectSubset<T, MarketplacePaymentLedgerFindFirstArgs<ExtArgs>>): Prisma__MarketplacePaymentLedgerClient<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MarketplacePaymentLedger that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketplacePaymentLedgerFindFirstOrThrowArgs} args - Arguments to find a MarketplacePaymentLedger
     * @example
     * // Get one MarketplacePaymentLedger
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MarketplacePaymentLedgerFindFirstOrThrowArgs>(args?: SelectSubset<T, MarketplacePaymentLedgerFindFirstOrThrowArgs<ExtArgs>>): Prisma__MarketplacePaymentLedgerClient<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MarketplacePaymentLedgers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketplacePaymentLedgerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MarketplacePaymentLedgers
     * const marketplacePaymentLedgers = await prisma.marketplacePaymentLedger.findMany()
     * 
     * // Get first 10 MarketplacePaymentLedgers
     * const marketplacePaymentLedgers = await prisma.marketplacePaymentLedger.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const marketplacePaymentLedgerWithIdOnly = await prisma.marketplacePaymentLedger.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MarketplacePaymentLedgerFindManyArgs>(args?: SelectSubset<T, MarketplacePaymentLedgerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MarketplacePaymentLedger.
     * @param {MarketplacePaymentLedgerCreateArgs} args - Arguments to create a MarketplacePaymentLedger.
     * @example
     * // Create one MarketplacePaymentLedger
     * const MarketplacePaymentLedger = await prisma.marketplacePaymentLedger.create({
     *   data: {
     *     // ... data to create a MarketplacePaymentLedger
     *   }
     * })
     * 
     */
    create<T extends MarketplacePaymentLedgerCreateArgs>(args: SelectSubset<T, MarketplacePaymentLedgerCreateArgs<ExtArgs>>): Prisma__MarketplacePaymentLedgerClient<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MarketplacePaymentLedgers.
     * @param {MarketplacePaymentLedgerCreateManyArgs} args - Arguments to create many MarketplacePaymentLedgers.
     * @example
     * // Create many MarketplacePaymentLedgers
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MarketplacePaymentLedgerCreateManyArgs>(args?: SelectSubset<T, MarketplacePaymentLedgerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MarketplacePaymentLedgers and returns the data saved in the database.
     * @param {MarketplacePaymentLedgerCreateManyAndReturnArgs} args - Arguments to create many MarketplacePaymentLedgers.
     * @example
     * // Create many MarketplacePaymentLedgers
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MarketplacePaymentLedgers and only return the `id`
     * const marketplacePaymentLedgerWithIdOnly = await prisma.marketplacePaymentLedger.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MarketplacePaymentLedgerCreateManyAndReturnArgs>(args?: SelectSubset<T, MarketplacePaymentLedgerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MarketplacePaymentLedger.
     * @param {MarketplacePaymentLedgerDeleteArgs} args - Arguments to delete one MarketplacePaymentLedger.
     * @example
     * // Delete one MarketplacePaymentLedger
     * const MarketplacePaymentLedger = await prisma.marketplacePaymentLedger.delete({
     *   where: {
     *     // ... filter to delete one MarketplacePaymentLedger
     *   }
     * })
     * 
     */
    delete<T extends MarketplacePaymentLedgerDeleteArgs>(args: SelectSubset<T, MarketplacePaymentLedgerDeleteArgs<ExtArgs>>): Prisma__MarketplacePaymentLedgerClient<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MarketplacePaymentLedger.
     * @param {MarketplacePaymentLedgerUpdateArgs} args - Arguments to update one MarketplacePaymentLedger.
     * @example
     * // Update one MarketplacePaymentLedger
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MarketplacePaymentLedgerUpdateArgs>(args: SelectSubset<T, MarketplacePaymentLedgerUpdateArgs<ExtArgs>>): Prisma__MarketplacePaymentLedgerClient<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MarketplacePaymentLedgers.
     * @param {MarketplacePaymentLedgerDeleteManyArgs} args - Arguments to filter MarketplacePaymentLedgers to delete.
     * @example
     * // Delete a few MarketplacePaymentLedgers
     * const { count } = await prisma.marketplacePaymentLedger.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MarketplacePaymentLedgerDeleteManyArgs>(args?: SelectSubset<T, MarketplacePaymentLedgerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MarketplacePaymentLedgers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketplacePaymentLedgerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MarketplacePaymentLedgers
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MarketplacePaymentLedgerUpdateManyArgs>(args: SelectSubset<T, MarketplacePaymentLedgerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MarketplacePaymentLedgers and returns the data updated in the database.
     * @param {MarketplacePaymentLedgerUpdateManyAndReturnArgs} args - Arguments to update many MarketplacePaymentLedgers.
     * @example
     * // Update many MarketplacePaymentLedgers
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MarketplacePaymentLedgers and only return the `id`
     * const marketplacePaymentLedgerWithIdOnly = await prisma.marketplacePaymentLedger.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MarketplacePaymentLedgerUpdateManyAndReturnArgs>(args: SelectSubset<T, MarketplacePaymentLedgerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MarketplacePaymentLedger.
     * @param {MarketplacePaymentLedgerUpsertArgs} args - Arguments to update or create a MarketplacePaymentLedger.
     * @example
     * // Update or create a MarketplacePaymentLedger
     * const marketplacePaymentLedger = await prisma.marketplacePaymentLedger.upsert({
     *   create: {
     *     // ... data to create a MarketplacePaymentLedger
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MarketplacePaymentLedger we want to update
     *   }
     * })
     */
    upsert<T extends MarketplacePaymentLedgerUpsertArgs>(args: SelectSubset<T, MarketplacePaymentLedgerUpsertArgs<ExtArgs>>): Prisma__MarketplacePaymentLedgerClient<$Result.GetResult<Prisma.$MarketplacePaymentLedgerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MarketplacePaymentLedgers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketplacePaymentLedgerCountArgs} args - Arguments to filter MarketplacePaymentLedgers to count.
     * @example
     * // Count the number of MarketplacePaymentLedgers
     * const count = await prisma.marketplacePaymentLedger.count({
     *   where: {
     *     // ... the filter for the MarketplacePaymentLedgers we want to count
     *   }
     * })
    **/
    count<T extends MarketplacePaymentLedgerCountArgs>(
      args?: Subset<T, MarketplacePaymentLedgerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MarketplacePaymentLedgerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MarketplacePaymentLedger.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketplacePaymentLedgerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends MarketplacePaymentLedgerAggregateArgs>(args: Subset<T, MarketplacePaymentLedgerAggregateArgs>): Prisma.PrismaPromise<GetMarketplacePaymentLedgerAggregateType<T>>

    /**
     * Group by MarketplacePaymentLedger.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MarketplacePaymentLedgerGroupByArgs} args - Group by arguments.
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
      T extends MarketplacePaymentLedgerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MarketplacePaymentLedgerGroupByArgs['orderBy'] }
        : { orderBy?: MarketplacePaymentLedgerGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, MarketplacePaymentLedgerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMarketplacePaymentLedgerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MarketplacePaymentLedger model
   */
  readonly fields: MarketplacePaymentLedgerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MarketplacePaymentLedger.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MarketplacePaymentLedgerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the MarketplacePaymentLedger model
   */
  interface MarketplacePaymentLedgerFieldRefs {
    readonly id: FieldRef<"MarketplacePaymentLedger", 'String'>
    readonly listingId: FieldRef<"MarketplacePaymentLedger", 'String'>
    readonly bookingId: FieldRef<"MarketplacePaymentLedger", 'String'>
    readonly amountCents: FieldRef<"MarketplacePaymentLedger", 'Int'>
    readonly applicationFeeCents: FieldRef<"MarketplacePaymentLedger", 'Int'>
    readonly stripePaymentIntentId: FieldRef<"MarketplacePaymentLedger", 'String'>
    readonly stripeCheckoutSessionId: FieldRef<"MarketplacePaymentLedger", 'String'>
    readonly destinationAccountId: FieldRef<"MarketplacePaymentLedger", 'String'>
    readonly createdAt: FieldRef<"MarketplacePaymentLedger", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MarketplacePaymentLedger findUnique
   */
  export type MarketplacePaymentLedgerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * Filter, which MarketplacePaymentLedger to fetch.
     */
    where: MarketplacePaymentLedgerWhereUniqueInput
  }

  /**
   * MarketplacePaymentLedger findUniqueOrThrow
   */
  export type MarketplacePaymentLedgerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * Filter, which MarketplacePaymentLedger to fetch.
     */
    where: MarketplacePaymentLedgerWhereUniqueInput
  }

  /**
   * MarketplacePaymentLedger findFirst
   */
  export type MarketplacePaymentLedgerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * Filter, which MarketplacePaymentLedger to fetch.
     */
    where?: MarketplacePaymentLedgerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketplacePaymentLedgers to fetch.
     */
    orderBy?: MarketplacePaymentLedgerOrderByWithRelationInput | MarketplacePaymentLedgerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MarketplacePaymentLedgers.
     */
    cursor?: MarketplacePaymentLedgerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketplacePaymentLedgers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketplacePaymentLedgers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarketplacePaymentLedgers.
     */
    distinct?: MarketplacePaymentLedgerScalarFieldEnum | MarketplacePaymentLedgerScalarFieldEnum[]
  }

  /**
   * MarketplacePaymentLedger findFirstOrThrow
   */
  export type MarketplacePaymentLedgerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * Filter, which MarketplacePaymentLedger to fetch.
     */
    where?: MarketplacePaymentLedgerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketplacePaymentLedgers to fetch.
     */
    orderBy?: MarketplacePaymentLedgerOrderByWithRelationInput | MarketplacePaymentLedgerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MarketplacePaymentLedgers.
     */
    cursor?: MarketplacePaymentLedgerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketplacePaymentLedgers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketplacePaymentLedgers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarketplacePaymentLedgers.
     */
    distinct?: MarketplacePaymentLedgerScalarFieldEnum | MarketplacePaymentLedgerScalarFieldEnum[]
  }

  /**
   * MarketplacePaymentLedger findMany
   */
  export type MarketplacePaymentLedgerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * Filter, which MarketplacePaymentLedgers to fetch.
     */
    where?: MarketplacePaymentLedgerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MarketplacePaymentLedgers to fetch.
     */
    orderBy?: MarketplacePaymentLedgerOrderByWithRelationInput | MarketplacePaymentLedgerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MarketplacePaymentLedgers.
     */
    cursor?: MarketplacePaymentLedgerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MarketplacePaymentLedgers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MarketplacePaymentLedgers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MarketplacePaymentLedgers.
     */
    distinct?: MarketplacePaymentLedgerScalarFieldEnum | MarketplacePaymentLedgerScalarFieldEnum[]
  }

  /**
   * MarketplacePaymentLedger create
   */
  export type MarketplacePaymentLedgerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * The data needed to create a MarketplacePaymentLedger.
     */
    data: XOR<MarketplacePaymentLedgerCreateInput, MarketplacePaymentLedgerUncheckedCreateInput>
  }

  /**
   * MarketplacePaymentLedger createMany
   */
  export type MarketplacePaymentLedgerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MarketplacePaymentLedgers.
     */
    data: MarketplacePaymentLedgerCreateManyInput | MarketplacePaymentLedgerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MarketplacePaymentLedger createManyAndReturn
   */
  export type MarketplacePaymentLedgerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * The data used to create many MarketplacePaymentLedgers.
     */
    data: MarketplacePaymentLedgerCreateManyInput | MarketplacePaymentLedgerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MarketplacePaymentLedger update
   */
  export type MarketplacePaymentLedgerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * The data needed to update a MarketplacePaymentLedger.
     */
    data: XOR<MarketplacePaymentLedgerUpdateInput, MarketplacePaymentLedgerUncheckedUpdateInput>
    /**
     * Choose, which MarketplacePaymentLedger to update.
     */
    where: MarketplacePaymentLedgerWhereUniqueInput
  }

  /**
   * MarketplacePaymentLedger updateMany
   */
  export type MarketplacePaymentLedgerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MarketplacePaymentLedgers.
     */
    data: XOR<MarketplacePaymentLedgerUpdateManyMutationInput, MarketplacePaymentLedgerUncheckedUpdateManyInput>
    /**
     * Filter which MarketplacePaymentLedgers to update
     */
    where?: MarketplacePaymentLedgerWhereInput
    /**
     * Limit how many MarketplacePaymentLedgers to update.
     */
    limit?: number
  }

  /**
   * MarketplacePaymentLedger updateManyAndReturn
   */
  export type MarketplacePaymentLedgerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * The data used to update MarketplacePaymentLedgers.
     */
    data: XOR<MarketplacePaymentLedgerUpdateManyMutationInput, MarketplacePaymentLedgerUncheckedUpdateManyInput>
    /**
     * Filter which MarketplacePaymentLedgers to update
     */
    where?: MarketplacePaymentLedgerWhereInput
    /**
     * Limit how many MarketplacePaymentLedgers to update.
     */
    limit?: number
  }

  /**
   * MarketplacePaymentLedger upsert
   */
  export type MarketplacePaymentLedgerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * The filter to search for the MarketplacePaymentLedger to update in case it exists.
     */
    where: MarketplacePaymentLedgerWhereUniqueInput
    /**
     * In case the MarketplacePaymentLedger found by the `where` argument doesn't exist, create a new MarketplacePaymentLedger with this data.
     */
    create: XOR<MarketplacePaymentLedgerCreateInput, MarketplacePaymentLedgerUncheckedCreateInput>
    /**
     * In case the MarketplacePaymentLedger was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MarketplacePaymentLedgerUpdateInput, MarketplacePaymentLedgerUncheckedUpdateInput>
  }

  /**
   * MarketplacePaymentLedger delete
   */
  export type MarketplacePaymentLedgerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
    /**
     * Filter which MarketplacePaymentLedger to delete.
     */
    where: MarketplacePaymentLedgerWhereUniqueInput
  }

  /**
   * MarketplacePaymentLedger deleteMany
   */
  export type MarketplacePaymentLedgerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MarketplacePaymentLedgers to delete
     */
    where?: MarketplacePaymentLedgerWhereInput
    /**
     * Limit how many MarketplacePaymentLedgers to delete.
     */
    limit?: number
  }

  /**
   * MarketplacePaymentLedger without action
   */
  export type MarketplacePaymentLedgerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MarketplacePaymentLedger
     */
    select?: MarketplacePaymentLedgerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MarketplacePaymentLedger
     */
    omit?: MarketplacePaymentLedgerOmit<ExtArgs> | null
  }


  /**
   * Model ListingBooking
   */

  export type AggregateListingBooking = {
    _count: ListingBookingCountAggregateOutputType | null
    _min: ListingBookingMinAggregateOutputType | null
    _max: ListingBookingMaxAggregateOutputType | null
  }

  export type ListingBookingMinAggregateOutputType = {
    id: string | null
    userId: string | null
    listingId: string | null
    startDate: Date | null
    endDate: Date | null
    createdAt: Date | null
  }

  export type ListingBookingMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    listingId: string | null
    startDate: Date | null
    endDate: Date | null
    createdAt: Date | null
  }

  export type ListingBookingCountAggregateOutputType = {
    id: number
    userId: number
    listingId: number
    startDate: number
    endDate: number
    createdAt: number
    _all: number
  }


  export type ListingBookingMinAggregateInputType = {
    id?: true
    userId?: true
    listingId?: true
    startDate?: true
    endDate?: true
    createdAt?: true
  }

  export type ListingBookingMaxAggregateInputType = {
    id?: true
    userId?: true
    listingId?: true
    startDate?: true
    endDate?: true
    createdAt?: true
  }

  export type ListingBookingCountAggregateInputType = {
    id?: true
    userId?: true
    listingId?: true
    startDate?: true
    endDate?: true
    createdAt?: true
    _all?: true
  }

  export type ListingBookingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ListingBooking to aggregate.
     */
    where?: ListingBookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListingBookings to fetch.
     */
    orderBy?: ListingBookingOrderByWithRelationInput | ListingBookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ListingBookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListingBookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListingBookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ListingBookings
    **/
    _count?: true | ListingBookingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ListingBookingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ListingBookingMaxAggregateInputType
  }

  export type GetListingBookingAggregateType<T extends ListingBookingAggregateArgs> = {
        [P in keyof T & keyof AggregateListingBooking]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateListingBooking[P]>
      : GetScalarType<T[P], AggregateListingBooking[P]>
  }




  export type ListingBookingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ListingBookingWhereInput
    orderBy?: ListingBookingOrderByWithAggregationInput | ListingBookingOrderByWithAggregationInput[]
    by: ListingBookingScalarFieldEnum[] | ListingBookingScalarFieldEnum
    having?: ListingBookingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ListingBookingCountAggregateInputType | true
    _min?: ListingBookingMinAggregateInputType
    _max?: ListingBookingMaxAggregateInputType
  }

  export type ListingBookingGroupByOutputType = {
    id: string
    userId: string
    listingId: string
    startDate: Date
    endDate: Date
    createdAt: Date
    _count: ListingBookingCountAggregateOutputType | null
    _min: ListingBookingMinAggregateOutputType | null
    _max: ListingBookingMaxAggregateOutputType | null
  }

  type GetListingBookingGroupByPayload<T extends ListingBookingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ListingBookingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ListingBookingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ListingBookingGroupByOutputType[P]>
            : GetScalarType<T[P], ListingBookingGroupByOutputType[P]>
        }
      >
    >


  export type ListingBookingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    listingId?: boolean
    startDate?: boolean
    endDate?: boolean
    createdAt?: boolean
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["listingBooking"]>

  export type ListingBookingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    listingId?: boolean
    startDate?: boolean
    endDate?: boolean
    createdAt?: boolean
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["listingBooking"]>

  export type ListingBookingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    listingId?: boolean
    startDate?: boolean
    endDate?: boolean
    createdAt?: boolean
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["listingBooking"]>

  export type ListingBookingSelectScalar = {
    id?: boolean
    userId?: boolean
    listingId?: boolean
    startDate?: boolean
    endDate?: boolean
    createdAt?: boolean
  }

  export type ListingBookingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "listingId" | "startDate" | "endDate" | "createdAt", ExtArgs["result"]["listingBooking"]>
  export type ListingBookingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }
  export type ListingBookingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }
  export type ListingBookingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }

  export type $ListingBookingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ListingBooking"
    objects: {
      listing: Prisma.$ListingPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      /**
       * FK to `users.id` — no `User` relation (cross-client).
       */
      userId: string
      listingId: string
      startDate: Date
      endDate: Date
      createdAt: Date
    }, ExtArgs["result"]["listingBooking"]>
    composites: {}
  }

  type ListingBookingGetPayload<S extends boolean | null | undefined | ListingBookingDefaultArgs> = $Result.GetResult<Prisma.$ListingBookingPayload, S>

  type ListingBookingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ListingBookingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ListingBookingCountAggregateInputType | true
    }

  export interface ListingBookingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ListingBooking'], meta: { name: 'ListingBooking' } }
    /**
     * Find zero or one ListingBooking that matches the filter.
     * @param {ListingBookingFindUniqueArgs} args - Arguments to find a ListingBooking
     * @example
     * // Get one ListingBooking
     * const listingBooking = await prisma.listingBooking.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ListingBookingFindUniqueArgs>(args: SelectSubset<T, ListingBookingFindUniqueArgs<ExtArgs>>): Prisma__ListingBookingClient<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ListingBooking that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ListingBookingFindUniqueOrThrowArgs} args - Arguments to find a ListingBooking
     * @example
     * // Get one ListingBooking
     * const listingBooking = await prisma.listingBooking.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ListingBookingFindUniqueOrThrowArgs>(args: SelectSubset<T, ListingBookingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ListingBookingClient<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ListingBooking that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingBookingFindFirstArgs} args - Arguments to find a ListingBooking
     * @example
     * // Get one ListingBooking
     * const listingBooking = await prisma.listingBooking.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ListingBookingFindFirstArgs>(args?: SelectSubset<T, ListingBookingFindFirstArgs<ExtArgs>>): Prisma__ListingBookingClient<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ListingBooking that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingBookingFindFirstOrThrowArgs} args - Arguments to find a ListingBooking
     * @example
     * // Get one ListingBooking
     * const listingBooking = await prisma.listingBooking.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ListingBookingFindFirstOrThrowArgs>(args?: SelectSubset<T, ListingBookingFindFirstOrThrowArgs<ExtArgs>>): Prisma__ListingBookingClient<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ListingBookings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingBookingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ListingBookings
     * const listingBookings = await prisma.listingBooking.findMany()
     * 
     * // Get first 10 ListingBookings
     * const listingBookings = await prisma.listingBooking.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const listingBookingWithIdOnly = await prisma.listingBooking.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ListingBookingFindManyArgs>(args?: SelectSubset<T, ListingBookingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ListingBooking.
     * @param {ListingBookingCreateArgs} args - Arguments to create a ListingBooking.
     * @example
     * // Create one ListingBooking
     * const ListingBooking = await prisma.listingBooking.create({
     *   data: {
     *     // ... data to create a ListingBooking
     *   }
     * })
     * 
     */
    create<T extends ListingBookingCreateArgs>(args: SelectSubset<T, ListingBookingCreateArgs<ExtArgs>>): Prisma__ListingBookingClient<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ListingBookings.
     * @param {ListingBookingCreateManyArgs} args - Arguments to create many ListingBookings.
     * @example
     * // Create many ListingBookings
     * const listingBooking = await prisma.listingBooking.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ListingBookingCreateManyArgs>(args?: SelectSubset<T, ListingBookingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ListingBookings and returns the data saved in the database.
     * @param {ListingBookingCreateManyAndReturnArgs} args - Arguments to create many ListingBookings.
     * @example
     * // Create many ListingBookings
     * const listingBooking = await prisma.listingBooking.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ListingBookings and only return the `id`
     * const listingBookingWithIdOnly = await prisma.listingBooking.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ListingBookingCreateManyAndReturnArgs>(args?: SelectSubset<T, ListingBookingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ListingBooking.
     * @param {ListingBookingDeleteArgs} args - Arguments to delete one ListingBooking.
     * @example
     * // Delete one ListingBooking
     * const ListingBooking = await prisma.listingBooking.delete({
     *   where: {
     *     // ... filter to delete one ListingBooking
     *   }
     * })
     * 
     */
    delete<T extends ListingBookingDeleteArgs>(args: SelectSubset<T, ListingBookingDeleteArgs<ExtArgs>>): Prisma__ListingBookingClient<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ListingBooking.
     * @param {ListingBookingUpdateArgs} args - Arguments to update one ListingBooking.
     * @example
     * // Update one ListingBooking
     * const listingBooking = await prisma.listingBooking.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ListingBookingUpdateArgs>(args: SelectSubset<T, ListingBookingUpdateArgs<ExtArgs>>): Prisma__ListingBookingClient<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ListingBookings.
     * @param {ListingBookingDeleteManyArgs} args - Arguments to filter ListingBookings to delete.
     * @example
     * // Delete a few ListingBookings
     * const { count } = await prisma.listingBooking.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ListingBookingDeleteManyArgs>(args?: SelectSubset<T, ListingBookingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ListingBookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingBookingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ListingBookings
     * const listingBooking = await prisma.listingBooking.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ListingBookingUpdateManyArgs>(args: SelectSubset<T, ListingBookingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ListingBookings and returns the data updated in the database.
     * @param {ListingBookingUpdateManyAndReturnArgs} args - Arguments to update many ListingBookings.
     * @example
     * // Update many ListingBookings
     * const listingBooking = await prisma.listingBooking.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ListingBookings and only return the `id`
     * const listingBookingWithIdOnly = await prisma.listingBooking.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ListingBookingUpdateManyAndReturnArgs>(args: SelectSubset<T, ListingBookingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ListingBooking.
     * @param {ListingBookingUpsertArgs} args - Arguments to update or create a ListingBooking.
     * @example
     * // Update or create a ListingBooking
     * const listingBooking = await prisma.listingBooking.upsert({
     *   create: {
     *     // ... data to create a ListingBooking
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ListingBooking we want to update
     *   }
     * })
     */
    upsert<T extends ListingBookingUpsertArgs>(args: SelectSubset<T, ListingBookingUpsertArgs<ExtArgs>>): Prisma__ListingBookingClient<$Result.GetResult<Prisma.$ListingBookingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ListingBookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingBookingCountArgs} args - Arguments to filter ListingBookings to count.
     * @example
     * // Count the number of ListingBookings
     * const count = await prisma.listingBooking.count({
     *   where: {
     *     // ... the filter for the ListingBookings we want to count
     *   }
     * })
    **/
    count<T extends ListingBookingCountArgs>(
      args?: Subset<T, ListingBookingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ListingBookingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ListingBooking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingBookingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ListingBookingAggregateArgs>(args: Subset<T, ListingBookingAggregateArgs>): Prisma.PrismaPromise<GetListingBookingAggregateType<T>>

    /**
     * Group by ListingBooking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingBookingGroupByArgs} args - Group by arguments.
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
      T extends ListingBookingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ListingBookingGroupByArgs['orderBy'] }
        : { orderBy?: ListingBookingGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ListingBookingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetListingBookingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ListingBooking model
   */
  readonly fields: ListingBookingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ListingBooking.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ListingBookingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    listing<T extends ListingDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ListingDefaultArgs<ExtArgs>>): Prisma__ListingClient<$Result.GetResult<Prisma.$ListingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the ListingBooking model
   */
  interface ListingBookingFieldRefs {
    readonly id: FieldRef<"ListingBooking", 'String'>
    readonly userId: FieldRef<"ListingBooking", 'String'>
    readonly listingId: FieldRef<"ListingBooking", 'String'>
    readonly startDate: FieldRef<"ListingBooking", 'DateTime'>
    readonly endDate: FieldRef<"ListingBooking", 'DateTime'>
    readonly createdAt: FieldRef<"ListingBooking", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ListingBooking findUnique
   */
  export type ListingBookingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    /**
     * Filter, which ListingBooking to fetch.
     */
    where: ListingBookingWhereUniqueInput
  }

  /**
   * ListingBooking findUniqueOrThrow
   */
  export type ListingBookingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    /**
     * Filter, which ListingBooking to fetch.
     */
    where: ListingBookingWhereUniqueInput
  }

  /**
   * ListingBooking findFirst
   */
  export type ListingBookingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    /**
     * Filter, which ListingBooking to fetch.
     */
    where?: ListingBookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListingBookings to fetch.
     */
    orderBy?: ListingBookingOrderByWithRelationInput | ListingBookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ListingBookings.
     */
    cursor?: ListingBookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListingBookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListingBookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ListingBookings.
     */
    distinct?: ListingBookingScalarFieldEnum | ListingBookingScalarFieldEnum[]
  }

  /**
   * ListingBooking findFirstOrThrow
   */
  export type ListingBookingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    /**
     * Filter, which ListingBooking to fetch.
     */
    where?: ListingBookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListingBookings to fetch.
     */
    orderBy?: ListingBookingOrderByWithRelationInput | ListingBookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ListingBookings.
     */
    cursor?: ListingBookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListingBookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListingBookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ListingBookings.
     */
    distinct?: ListingBookingScalarFieldEnum | ListingBookingScalarFieldEnum[]
  }

  /**
   * ListingBooking findMany
   */
  export type ListingBookingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    /**
     * Filter, which ListingBookings to fetch.
     */
    where?: ListingBookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ListingBookings to fetch.
     */
    orderBy?: ListingBookingOrderByWithRelationInput | ListingBookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ListingBookings.
     */
    cursor?: ListingBookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ListingBookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ListingBookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ListingBookings.
     */
    distinct?: ListingBookingScalarFieldEnum | ListingBookingScalarFieldEnum[]
  }

  /**
   * ListingBooking create
   */
  export type ListingBookingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    /**
     * The data needed to create a ListingBooking.
     */
    data: XOR<ListingBookingCreateInput, ListingBookingUncheckedCreateInput>
  }

  /**
   * ListingBooking createMany
   */
  export type ListingBookingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ListingBookings.
     */
    data: ListingBookingCreateManyInput | ListingBookingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ListingBooking createManyAndReturn
   */
  export type ListingBookingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * The data used to create many ListingBookings.
     */
    data: ListingBookingCreateManyInput | ListingBookingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ListingBooking update
   */
  export type ListingBookingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    /**
     * The data needed to update a ListingBooking.
     */
    data: XOR<ListingBookingUpdateInput, ListingBookingUncheckedUpdateInput>
    /**
     * Choose, which ListingBooking to update.
     */
    where: ListingBookingWhereUniqueInput
  }

  /**
   * ListingBooking updateMany
   */
  export type ListingBookingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ListingBookings.
     */
    data: XOR<ListingBookingUpdateManyMutationInput, ListingBookingUncheckedUpdateManyInput>
    /**
     * Filter which ListingBookings to update
     */
    where?: ListingBookingWhereInput
    /**
     * Limit how many ListingBookings to update.
     */
    limit?: number
  }

  /**
   * ListingBooking updateManyAndReturn
   */
  export type ListingBookingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * The data used to update ListingBookings.
     */
    data: XOR<ListingBookingUpdateManyMutationInput, ListingBookingUncheckedUpdateManyInput>
    /**
     * Filter which ListingBookings to update
     */
    where?: ListingBookingWhereInput
    /**
     * Limit how many ListingBookings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ListingBooking upsert
   */
  export type ListingBookingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    /**
     * The filter to search for the ListingBooking to update in case it exists.
     */
    where: ListingBookingWhereUniqueInput
    /**
     * In case the ListingBooking found by the `where` argument doesn't exist, create a new ListingBooking with this data.
     */
    create: XOR<ListingBookingCreateInput, ListingBookingUncheckedCreateInput>
    /**
     * In case the ListingBooking was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ListingBookingUpdateInput, ListingBookingUncheckedUpdateInput>
  }

  /**
   * ListingBooking delete
   */
  export type ListingBookingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
    /**
     * Filter which ListingBooking to delete.
     */
    where: ListingBookingWhereUniqueInput
  }

  /**
   * ListingBooking deleteMany
   */
  export type ListingBookingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ListingBookings to delete
     */
    where?: ListingBookingWhereInput
    /**
     * Limit how many ListingBookings to delete.
     */
    limit?: number
  }

  /**
   * ListingBooking without action
   */
  export type ListingBookingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ListingBooking
     */
    select?: ListingBookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingBooking
     */
    omit?: ListingBookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingBookingInclude<ExtArgs> | null
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


  export const ListingScalarFieldEnum: {
    id: 'id',
    title: 'title',
    price: 'price',
    city: 'city',
    country: 'country',
    userId: 'userId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ListingScalarFieldEnum = (typeof ListingScalarFieldEnum)[keyof typeof ListingScalarFieldEnum]


  export const BookingScalarFieldEnum: {
    id: 'id',
    listingId: 'listingId',
    userId: 'userId',
    startDate: 'startDate',
    endDate: 'endDate',
    status: 'status',
    expiresAt: 'expiresAt',
    cancelledAt: 'cancelledAt',
    stripePaymentIntentId: 'stripePaymentIntentId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BookingScalarFieldEnum = (typeof BookingScalarFieldEnum)[keyof typeof BookingScalarFieldEnum]


  export const MarketplacePaymentLedgerScalarFieldEnum: {
    id: 'id',
    listingId: 'listingId',
    bookingId: 'bookingId',
    amountCents: 'amountCents',
    applicationFeeCents: 'applicationFeeCents',
    stripePaymentIntentId: 'stripePaymentIntentId',
    stripeCheckoutSessionId: 'stripeCheckoutSessionId',
    destinationAccountId: 'destinationAccountId',
    createdAt: 'createdAt'
  };

  export type MarketplacePaymentLedgerScalarFieldEnum = (typeof MarketplacePaymentLedgerScalarFieldEnum)[keyof typeof MarketplacePaymentLedgerScalarFieldEnum]


  export const ListingBookingScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    listingId: 'listingId',
    startDate: 'startDate',
    endDate: 'endDate',
    createdAt: 'createdAt'
  };

  export type ListingBookingScalarFieldEnum = (typeof ListingBookingScalarFieldEnum)[keyof typeof ListingBookingScalarFieldEnum]


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
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type ListingWhereInput = {
    AND?: ListingWhereInput | ListingWhereInput[]
    OR?: ListingWhereInput[]
    NOT?: ListingWhereInput | ListingWhereInput[]
    id?: StringFilter<"Listing"> | string
    title?: StringFilter<"Listing"> | string
    price?: FloatFilter<"Listing"> | number
    city?: StringFilter<"Listing"> | string
    country?: StringFilter<"Listing"> | string
    userId?: StringFilter<"Listing"> | string
    createdAt?: DateTimeFilter<"Listing"> | Date | string
    updatedAt?: DateTimeFilter<"Listing"> | Date | string
    listingBookings?: ListingBookingListRelationFilter
    bookings?: BookingListRelationFilter
  }

  export type ListingOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    price?: SortOrder
    city?: SortOrder
    country?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    listingBookings?: ListingBookingOrderByRelationAggregateInput
    bookings?: BookingOrderByRelationAggregateInput
  }

  export type ListingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ListingWhereInput | ListingWhereInput[]
    OR?: ListingWhereInput[]
    NOT?: ListingWhereInput | ListingWhereInput[]
    title?: StringFilter<"Listing"> | string
    price?: FloatFilter<"Listing"> | number
    city?: StringFilter<"Listing"> | string
    country?: StringFilter<"Listing"> | string
    userId?: StringFilter<"Listing"> | string
    createdAt?: DateTimeFilter<"Listing"> | Date | string
    updatedAt?: DateTimeFilter<"Listing"> | Date | string
    listingBookings?: ListingBookingListRelationFilter
    bookings?: BookingListRelationFilter
  }, "id">

  export type ListingOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    price?: SortOrder
    city?: SortOrder
    country?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ListingCountOrderByAggregateInput
    _avg?: ListingAvgOrderByAggregateInput
    _max?: ListingMaxOrderByAggregateInput
    _min?: ListingMinOrderByAggregateInput
    _sum?: ListingSumOrderByAggregateInput
  }

  export type ListingScalarWhereWithAggregatesInput = {
    AND?: ListingScalarWhereWithAggregatesInput | ListingScalarWhereWithAggregatesInput[]
    OR?: ListingScalarWhereWithAggregatesInput[]
    NOT?: ListingScalarWhereWithAggregatesInput | ListingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Listing"> | string
    title?: StringWithAggregatesFilter<"Listing"> | string
    price?: FloatWithAggregatesFilter<"Listing"> | number
    city?: StringWithAggregatesFilter<"Listing"> | string
    country?: StringWithAggregatesFilter<"Listing"> | string
    userId?: StringWithAggregatesFilter<"Listing"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Listing"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Listing"> | Date | string
  }

  export type BookingWhereInput = {
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    id?: StringFilter<"Booking"> | string
    listingId?: StringFilter<"Booking"> | string
    userId?: StringFilter<"Booking"> | string
    startDate?: DateTimeFilter<"Booking"> | Date | string
    endDate?: DateTimeFilter<"Booking"> | Date | string
    status?: StringFilter<"Booking"> | string
    expiresAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    stripePaymentIntentId?: StringNullableFilter<"Booking"> | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
  }

  export type BookingOrderByWithRelationInput = {
    id?: SortOrder
    listingId?: SortOrder
    userId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    expiresAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    stripePaymentIntentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    listing?: ListingOrderByWithRelationInput
  }

  export type BookingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_listingId_startDate_endDate?: BookingUserIdListingIdStartDateEndDateCompoundUniqueInput
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    listingId?: StringFilter<"Booking"> | string
    userId?: StringFilter<"Booking"> | string
    startDate?: DateTimeFilter<"Booking"> | Date | string
    endDate?: DateTimeFilter<"Booking"> | Date | string
    status?: StringFilter<"Booking"> | string
    expiresAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    stripePaymentIntentId?: StringNullableFilter<"Booking"> | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
  }, "id" | "userId_listingId_startDate_endDate">

  export type BookingOrderByWithAggregationInput = {
    id?: SortOrder
    listingId?: SortOrder
    userId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    expiresAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    stripePaymentIntentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BookingCountOrderByAggregateInput
    _max?: BookingMaxOrderByAggregateInput
    _min?: BookingMinOrderByAggregateInput
  }

  export type BookingScalarWhereWithAggregatesInput = {
    AND?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    OR?: BookingScalarWhereWithAggregatesInput[]
    NOT?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Booking"> | string
    listingId?: StringWithAggregatesFilter<"Booking"> | string
    userId?: StringWithAggregatesFilter<"Booking"> | string
    startDate?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    endDate?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    status?: StringWithAggregatesFilter<"Booking"> | string
    expiresAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    cancelledAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    stripePaymentIntentId?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
  }

  export type MarketplacePaymentLedgerWhereInput = {
    AND?: MarketplacePaymentLedgerWhereInput | MarketplacePaymentLedgerWhereInput[]
    OR?: MarketplacePaymentLedgerWhereInput[]
    NOT?: MarketplacePaymentLedgerWhereInput | MarketplacePaymentLedgerWhereInput[]
    id?: StringFilter<"MarketplacePaymentLedger"> | string
    listingId?: StringNullableFilter<"MarketplacePaymentLedger"> | string | null
    bookingId?: StringNullableFilter<"MarketplacePaymentLedger"> | string | null
    amountCents?: IntFilter<"MarketplacePaymentLedger"> | number
    applicationFeeCents?: IntFilter<"MarketplacePaymentLedger"> | number
    stripePaymentIntentId?: StringNullableFilter<"MarketplacePaymentLedger"> | string | null
    stripeCheckoutSessionId?: StringFilter<"MarketplacePaymentLedger"> | string
    destinationAccountId?: StringNullableFilter<"MarketplacePaymentLedger"> | string | null
    createdAt?: DateTimeFilter<"MarketplacePaymentLedger"> | Date | string
  }

  export type MarketplacePaymentLedgerOrderByWithRelationInput = {
    id?: SortOrder
    listingId?: SortOrderInput | SortOrder
    bookingId?: SortOrderInput | SortOrder
    amountCents?: SortOrder
    applicationFeeCents?: SortOrder
    stripePaymentIntentId?: SortOrderInput | SortOrder
    stripeCheckoutSessionId?: SortOrder
    destinationAccountId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type MarketplacePaymentLedgerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    stripeCheckoutSessionId?: string
    AND?: MarketplacePaymentLedgerWhereInput | MarketplacePaymentLedgerWhereInput[]
    OR?: MarketplacePaymentLedgerWhereInput[]
    NOT?: MarketplacePaymentLedgerWhereInput | MarketplacePaymentLedgerWhereInput[]
    listingId?: StringNullableFilter<"MarketplacePaymentLedger"> | string | null
    bookingId?: StringNullableFilter<"MarketplacePaymentLedger"> | string | null
    amountCents?: IntFilter<"MarketplacePaymentLedger"> | number
    applicationFeeCents?: IntFilter<"MarketplacePaymentLedger"> | number
    stripePaymentIntentId?: StringNullableFilter<"MarketplacePaymentLedger"> | string | null
    destinationAccountId?: StringNullableFilter<"MarketplacePaymentLedger"> | string | null
    createdAt?: DateTimeFilter<"MarketplacePaymentLedger"> | Date | string
  }, "id" | "stripeCheckoutSessionId">

  export type MarketplacePaymentLedgerOrderByWithAggregationInput = {
    id?: SortOrder
    listingId?: SortOrderInput | SortOrder
    bookingId?: SortOrderInput | SortOrder
    amountCents?: SortOrder
    applicationFeeCents?: SortOrder
    stripePaymentIntentId?: SortOrderInput | SortOrder
    stripeCheckoutSessionId?: SortOrder
    destinationAccountId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: MarketplacePaymentLedgerCountOrderByAggregateInput
    _avg?: MarketplacePaymentLedgerAvgOrderByAggregateInput
    _max?: MarketplacePaymentLedgerMaxOrderByAggregateInput
    _min?: MarketplacePaymentLedgerMinOrderByAggregateInput
    _sum?: MarketplacePaymentLedgerSumOrderByAggregateInput
  }

  export type MarketplacePaymentLedgerScalarWhereWithAggregatesInput = {
    AND?: MarketplacePaymentLedgerScalarWhereWithAggregatesInput | MarketplacePaymentLedgerScalarWhereWithAggregatesInput[]
    OR?: MarketplacePaymentLedgerScalarWhereWithAggregatesInput[]
    NOT?: MarketplacePaymentLedgerScalarWhereWithAggregatesInput | MarketplacePaymentLedgerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MarketplacePaymentLedger"> | string
    listingId?: StringNullableWithAggregatesFilter<"MarketplacePaymentLedger"> | string | null
    bookingId?: StringNullableWithAggregatesFilter<"MarketplacePaymentLedger"> | string | null
    amountCents?: IntWithAggregatesFilter<"MarketplacePaymentLedger"> | number
    applicationFeeCents?: IntWithAggregatesFilter<"MarketplacePaymentLedger"> | number
    stripePaymentIntentId?: StringNullableWithAggregatesFilter<"MarketplacePaymentLedger"> | string | null
    stripeCheckoutSessionId?: StringWithAggregatesFilter<"MarketplacePaymentLedger"> | string
    destinationAccountId?: StringNullableWithAggregatesFilter<"MarketplacePaymentLedger"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"MarketplacePaymentLedger"> | Date | string
  }

  export type ListingBookingWhereInput = {
    AND?: ListingBookingWhereInput | ListingBookingWhereInput[]
    OR?: ListingBookingWhereInput[]
    NOT?: ListingBookingWhereInput | ListingBookingWhereInput[]
    id?: StringFilter<"ListingBooking"> | string
    userId?: StringFilter<"ListingBooking"> | string
    listingId?: StringFilter<"ListingBooking"> | string
    startDate?: DateTimeFilter<"ListingBooking"> | Date | string
    endDate?: DateTimeFilter<"ListingBooking"> | Date | string
    createdAt?: DateTimeFilter<"ListingBooking"> | Date | string
    listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
  }

  export type ListingBookingOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    createdAt?: SortOrder
    listing?: ListingOrderByWithRelationInput
  }

  export type ListingBookingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ListingBookingWhereInput | ListingBookingWhereInput[]
    OR?: ListingBookingWhereInput[]
    NOT?: ListingBookingWhereInput | ListingBookingWhereInput[]
    userId?: StringFilter<"ListingBooking"> | string
    listingId?: StringFilter<"ListingBooking"> | string
    startDate?: DateTimeFilter<"ListingBooking"> | Date | string
    endDate?: DateTimeFilter<"ListingBooking"> | Date | string
    createdAt?: DateTimeFilter<"ListingBooking"> | Date | string
    listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
  }, "id">

  export type ListingBookingOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    createdAt?: SortOrder
    _count?: ListingBookingCountOrderByAggregateInput
    _max?: ListingBookingMaxOrderByAggregateInput
    _min?: ListingBookingMinOrderByAggregateInput
  }

  export type ListingBookingScalarWhereWithAggregatesInput = {
    AND?: ListingBookingScalarWhereWithAggregatesInput | ListingBookingScalarWhereWithAggregatesInput[]
    OR?: ListingBookingScalarWhereWithAggregatesInput[]
    NOT?: ListingBookingScalarWhereWithAggregatesInput | ListingBookingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ListingBooking"> | string
    userId?: StringWithAggregatesFilter<"ListingBooking"> | string
    listingId?: StringWithAggregatesFilter<"ListingBooking"> | string
    startDate?: DateTimeWithAggregatesFilter<"ListingBooking"> | Date | string
    endDate?: DateTimeWithAggregatesFilter<"ListingBooking"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"ListingBooking"> | Date | string
  }

  export type ListingCreateInput = {
    id?: string
    title: string
    price: number
    city?: string
    country?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    listingBookings?: ListingBookingCreateNestedManyWithoutListingInput
    bookings?: BookingCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateInput = {
    id?: string
    title: string
    price: number
    city?: string
    country?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    listingBookings?: ListingBookingUncheckedCreateNestedManyWithoutListingInput
    bookings?: BookingUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listingBookings?: ListingBookingUpdateManyWithoutListingNestedInput
    bookings?: BookingUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listingBookings?: ListingBookingUncheckedUpdateManyWithoutListingNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ListingCreateManyInput = {
    id?: string
    title: string
    price: number
    city?: string
    country?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingCreateInput = {
    id?: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    expiresAt?: Date | string | null
    cancelledAt?: Date | string | null
    stripePaymentIntentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    listing: ListingCreateNestedOneWithoutBookingsInput
  }

  export type BookingUncheckedCreateInput = {
    id?: string
    listingId: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    expiresAt?: Date | string | null
    cancelledAt?: Date | string | null
    stripePaymentIntentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BookingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listing?: ListingUpdateOneRequiredWithoutBookingsNestedInput
  }

  export type BookingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingCreateManyInput = {
    id?: string
    listingId: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    expiresAt?: Date | string | null
    cancelledAt?: Date | string | null
    stripePaymentIntentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BookingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketplacePaymentLedgerCreateInput = {
    id?: string
    listingId?: string | null
    bookingId?: string | null
    amountCents: number
    applicationFeeCents?: number
    stripePaymentIntentId?: string | null
    stripeCheckoutSessionId: string
    destinationAccountId?: string | null
    createdAt?: Date | string
  }

  export type MarketplacePaymentLedgerUncheckedCreateInput = {
    id?: string
    listingId?: string | null
    bookingId?: string | null
    amountCents: number
    applicationFeeCents?: number
    stripePaymentIntentId?: string | null
    stripeCheckoutSessionId: string
    destinationAccountId?: string | null
    createdAt?: Date | string
  }

  export type MarketplacePaymentLedgerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    bookingId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    applicationFeeCents?: IntFieldUpdateOperationsInput | number
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCheckoutSessionId?: StringFieldUpdateOperationsInput | string
    destinationAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketplacePaymentLedgerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    bookingId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    applicationFeeCents?: IntFieldUpdateOperationsInput | number
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCheckoutSessionId?: StringFieldUpdateOperationsInput | string
    destinationAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketplacePaymentLedgerCreateManyInput = {
    id?: string
    listingId?: string | null
    bookingId?: string | null
    amountCents: number
    applicationFeeCents?: number
    stripePaymentIntentId?: string | null
    stripeCheckoutSessionId: string
    destinationAccountId?: string | null
    createdAt?: Date | string
  }

  export type MarketplacePaymentLedgerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    bookingId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    applicationFeeCents?: IntFieldUpdateOperationsInput | number
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCheckoutSessionId?: StringFieldUpdateOperationsInput | string
    destinationAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MarketplacePaymentLedgerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: NullableStringFieldUpdateOperationsInput | string | null
    bookingId?: NullableStringFieldUpdateOperationsInput | string | null
    amountCents?: IntFieldUpdateOperationsInput | number
    applicationFeeCents?: IntFieldUpdateOperationsInput | number
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCheckoutSessionId?: StringFieldUpdateOperationsInput | string
    destinationAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingBookingCreateInput = {
    id?: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    createdAt?: Date | string
    listing: ListingCreateNestedOneWithoutListingBookingsInput
  }

  export type ListingBookingUncheckedCreateInput = {
    id?: string
    userId: string
    listingId: string
    startDate: Date | string
    endDate: Date | string
    createdAt?: Date | string
  }

  export type ListingBookingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listing?: ListingUpdateOneRequiredWithoutListingBookingsNestedInput
  }

  export type ListingBookingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingBookingCreateManyInput = {
    id?: string
    userId: string
    listingId: string
    startDate: Date | string
    endDate: Date | string
    createdAt?: Date | string
  }

  export type ListingBookingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingBookingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type ListingBookingListRelationFilter = {
    every?: ListingBookingWhereInput
    some?: ListingBookingWhereInput
    none?: ListingBookingWhereInput
  }

  export type BookingListRelationFilter = {
    every?: BookingWhereInput
    some?: BookingWhereInput
    none?: BookingWhereInput
  }

  export type ListingBookingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BookingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ListingCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    price?: SortOrder
    city?: SortOrder
    country?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ListingAvgOrderByAggregateInput = {
    price?: SortOrder
  }

  export type ListingMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    price?: SortOrder
    city?: SortOrder
    country?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ListingMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    price?: SortOrder
    city?: SortOrder
    country?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ListingSumOrderByAggregateInput = {
    price?: SortOrder
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

  export type ListingScalarRelationFilter = {
    is?: ListingWhereInput
    isNot?: ListingWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type BookingUserIdListingIdStartDateEndDateCompoundUniqueInput = {
    userId: string
    listingId: string
    startDate: Date | string
    endDate: Date | string
  }

  export type BookingCountOrderByAggregateInput = {
    id?: SortOrder
    listingId?: SortOrder
    userId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    expiresAt?: SortOrder
    cancelledAt?: SortOrder
    stripePaymentIntentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BookingMaxOrderByAggregateInput = {
    id?: SortOrder
    listingId?: SortOrder
    userId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    expiresAt?: SortOrder
    cancelledAt?: SortOrder
    stripePaymentIntentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BookingMinOrderByAggregateInput = {
    id?: SortOrder
    listingId?: SortOrder
    userId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    expiresAt?: SortOrder
    cancelledAt?: SortOrder
    stripePaymentIntentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
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

  export type MarketplacePaymentLedgerCountOrderByAggregateInput = {
    id?: SortOrder
    listingId?: SortOrder
    bookingId?: SortOrder
    amountCents?: SortOrder
    applicationFeeCents?: SortOrder
    stripePaymentIntentId?: SortOrder
    stripeCheckoutSessionId?: SortOrder
    destinationAccountId?: SortOrder
    createdAt?: SortOrder
  }

  export type MarketplacePaymentLedgerAvgOrderByAggregateInput = {
    amountCents?: SortOrder
    applicationFeeCents?: SortOrder
  }

  export type MarketplacePaymentLedgerMaxOrderByAggregateInput = {
    id?: SortOrder
    listingId?: SortOrder
    bookingId?: SortOrder
    amountCents?: SortOrder
    applicationFeeCents?: SortOrder
    stripePaymentIntentId?: SortOrder
    stripeCheckoutSessionId?: SortOrder
    destinationAccountId?: SortOrder
    createdAt?: SortOrder
  }

  export type MarketplacePaymentLedgerMinOrderByAggregateInput = {
    id?: SortOrder
    listingId?: SortOrder
    bookingId?: SortOrder
    amountCents?: SortOrder
    applicationFeeCents?: SortOrder
    stripePaymentIntentId?: SortOrder
    stripeCheckoutSessionId?: SortOrder
    destinationAccountId?: SortOrder
    createdAt?: SortOrder
  }

  export type MarketplacePaymentLedgerSumOrderByAggregateInput = {
    amountCents?: SortOrder
    applicationFeeCents?: SortOrder
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

  export type ListingBookingCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    createdAt?: SortOrder
  }

  export type ListingBookingMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    createdAt?: SortOrder
  }

  export type ListingBookingMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    createdAt?: SortOrder
  }

  export type ListingBookingCreateNestedManyWithoutListingInput = {
    create?: XOR<ListingBookingCreateWithoutListingInput, ListingBookingUncheckedCreateWithoutListingInput> | ListingBookingCreateWithoutListingInput[] | ListingBookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: ListingBookingCreateOrConnectWithoutListingInput | ListingBookingCreateOrConnectWithoutListingInput[]
    createMany?: ListingBookingCreateManyListingInputEnvelope
    connect?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
  }

  export type BookingCreateNestedManyWithoutListingInput = {
    create?: XOR<BookingCreateWithoutListingInput, BookingUncheckedCreateWithoutListingInput> | BookingCreateWithoutListingInput[] | BookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutListingInput | BookingCreateOrConnectWithoutListingInput[]
    createMany?: BookingCreateManyListingInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ListingBookingUncheckedCreateNestedManyWithoutListingInput = {
    create?: XOR<ListingBookingCreateWithoutListingInput, ListingBookingUncheckedCreateWithoutListingInput> | ListingBookingCreateWithoutListingInput[] | ListingBookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: ListingBookingCreateOrConnectWithoutListingInput | ListingBookingCreateOrConnectWithoutListingInput[]
    createMany?: ListingBookingCreateManyListingInputEnvelope
    connect?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
  }

  export type BookingUncheckedCreateNestedManyWithoutListingInput = {
    create?: XOR<BookingCreateWithoutListingInput, BookingUncheckedCreateWithoutListingInput> | BookingCreateWithoutListingInput[] | BookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutListingInput | BookingCreateOrConnectWithoutListingInput[]
    createMany?: BookingCreateManyListingInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ListingBookingUpdateManyWithoutListingNestedInput = {
    create?: XOR<ListingBookingCreateWithoutListingInput, ListingBookingUncheckedCreateWithoutListingInput> | ListingBookingCreateWithoutListingInput[] | ListingBookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: ListingBookingCreateOrConnectWithoutListingInput | ListingBookingCreateOrConnectWithoutListingInput[]
    upsert?: ListingBookingUpsertWithWhereUniqueWithoutListingInput | ListingBookingUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: ListingBookingCreateManyListingInputEnvelope
    set?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
    disconnect?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
    delete?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
    connect?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
    update?: ListingBookingUpdateWithWhereUniqueWithoutListingInput | ListingBookingUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?: ListingBookingUpdateManyWithWhereWithoutListingInput | ListingBookingUpdateManyWithWhereWithoutListingInput[]
    deleteMany?: ListingBookingScalarWhereInput | ListingBookingScalarWhereInput[]
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

  export type ListingBookingUncheckedUpdateManyWithoutListingNestedInput = {
    create?: XOR<ListingBookingCreateWithoutListingInput, ListingBookingUncheckedCreateWithoutListingInput> | ListingBookingCreateWithoutListingInput[] | ListingBookingUncheckedCreateWithoutListingInput[]
    connectOrCreate?: ListingBookingCreateOrConnectWithoutListingInput | ListingBookingCreateOrConnectWithoutListingInput[]
    upsert?: ListingBookingUpsertWithWhereUniqueWithoutListingInput | ListingBookingUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: ListingBookingCreateManyListingInputEnvelope
    set?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
    disconnect?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
    delete?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
    connect?: ListingBookingWhereUniqueInput | ListingBookingWhereUniqueInput[]
    update?: ListingBookingUpdateWithWhereUniqueWithoutListingInput | ListingBookingUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?: ListingBookingUpdateManyWithWhereWithoutListingInput | ListingBookingUpdateManyWithWhereWithoutListingInput[]
    deleteMany?: ListingBookingScalarWhereInput | ListingBookingScalarWhereInput[]
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

  export type ListingCreateNestedOneWithoutBookingsInput = {
    create?: XOR<ListingCreateWithoutBookingsInput, ListingUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: ListingCreateOrConnectWithoutBookingsInput
    connect?: ListingWhereUniqueInput
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type ListingUpdateOneRequiredWithoutBookingsNestedInput = {
    create?: XOR<ListingCreateWithoutBookingsInput, ListingUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: ListingCreateOrConnectWithoutBookingsInput
    upsert?: ListingUpsertWithoutBookingsInput
    connect?: ListingWhereUniqueInput
    update?: XOR<XOR<ListingUpdateToOneWithWhereWithoutBookingsInput, ListingUpdateWithoutBookingsInput>, ListingUncheckedUpdateWithoutBookingsInput>
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ListingCreateNestedOneWithoutListingBookingsInput = {
    create?: XOR<ListingCreateWithoutListingBookingsInput, ListingUncheckedCreateWithoutListingBookingsInput>
    connectOrCreate?: ListingCreateOrConnectWithoutListingBookingsInput
    connect?: ListingWhereUniqueInput
  }

  export type ListingUpdateOneRequiredWithoutListingBookingsNestedInput = {
    create?: XOR<ListingCreateWithoutListingBookingsInput, ListingUncheckedCreateWithoutListingBookingsInput>
    connectOrCreate?: ListingCreateOrConnectWithoutListingBookingsInput
    upsert?: ListingUpsertWithoutListingBookingsInput
    connect?: ListingWhereUniqueInput
    update?: XOR<XOR<ListingUpdateToOneWithWhereWithoutListingBookingsInput, ListingUpdateWithoutListingBookingsInput>, ListingUncheckedUpdateWithoutListingBookingsInput>
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

  export type ListingBookingCreateWithoutListingInput = {
    id?: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    createdAt?: Date | string
  }

  export type ListingBookingUncheckedCreateWithoutListingInput = {
    id?: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    createdAt?: Date | string
  }

  export type ListingBookingCreateOrConnectWithoutListingInput = {
    where: ListingBookingWhereUniqueInput
    create: XOR<ListingBookingCreateWithoutListingInput, ListingBookingUncheckedCreateWithoutListingInput>
  }

  export type ListingBookingCreateManyListingInputEnvelope = {
    data: ListingBookingCreateManyListingInput | ListingBookingCreateManyListingInput[]
    skipDuplicates?: boolean
  }

  export type BookingCreateWithoutListingInput = {
    id?: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    expiresAt?: Date | string | null
    cancelledAt?: Date | string | null
    stripePaymentIntentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BookingUncheckedCreateWithoutListingInput = {
    id?: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    expiresAt?: Date | string | null
    cancelledAt?: Date | string | null
    stripePaymentIntentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BookingCreateOrConnectWithoutListingInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutListingInput, BookingUncheckedCreateWithoutListingInput>
  }

  export type BookingCreateManyListingInputEnvelope = {
    data: BookingCreateManyListingInput | BookingCreateManyListingInput[]
    skipDuplicates?: boolean
  }

  export type ListingBookingUpsertWithWhereUniqueWithoutListingInput = {
    where: ListingBookingWhereUniqueInput
    update: XOR<ListingBookingUpdateWithoutListingInput, ListingBookingUncheckedUpdateWithoutListingInput>
    create: XOR<ListingBookingCreateWithoutListingInput, ListingBookingUncheckedCreateWithoutListingInput>
  }

  export type ListingBookingUpdateWithWhereUniqueWithoutListingInput = {
    where: ListingBookingWhereUniqueInput
    data: XOR<ListingBookingUpdateWithoutListingInput, ListingBookingUncheckedUpdateWithoutListingInput>
  }

  export type ListingBookingUpdateManyWithWhereWithoutListingInput = {
    where: ListingBookingScalarWhereInput
    data: XOR<ListingBookingUpdateManyMutationInput, ListingBookingUncheckedUpdateManyWithoutListingInput>
  }

  export type ListingBookingScalarWhereInput = {
    AND?: ListingBookingScalarWhereInput | ListingBookingScalarWhereInput[]
    OR?: ListingBookingScalarWhereInput[]
    NOT?: ListingBookingScalarWhereInput | ListingBookingScalarWhereInput[]
    id?: StringFilter<"ListingBooking"> | string
    userId?: StringFilter<"ListingBooking"> | string
    listingId?: StringFilter<"ListingBooking"> | string
    startDate?: DateTimeFilter<"ListingBooking"> | Date | string
    endDate?: DateTimeFilter<"ListingBooking"> | Date | string
    createdAt?: DateTimeFilter<"ListingBooking"> | Date | string
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

  export type BookingScalarWhereInput = {
    AND?: BookingScalarWhereInput | BookingScalarWhereInput[]
    OR?: BookingScalarWhereInput[]
    NOT?: BookingScalarWhereInput | BookingScalarWhereInput[]
    id?: StringFilter<"Booking"> | string
    listingId?: StringFilter<"Booking"> | string
    userId?: StringFilter<"Booking"> | string
    startDate?: DateTimeFilter<"Booking"> | Date | string
    endDate?: DateTimeFilter<"Booking"> | Date | string
    status?: StringFilter<"Booking"> | string
    expiresAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    stripePaymentIntentId?: StringNullableFilter<"Booking"> | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
  }

  export type ListingCreateWithoutBookingsInput = {
    id?: string
    title: string
    price: number
    city?: string
    country?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    listingBookings?: ListingBookingCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutBookingsInput = {
    id?: string
    title: string
    price: number
    city?: string
    country?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    listingBookings?: ListingBookingUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutBookingsInput = {
    where: ListingWhereUniqueInput
    create: XOR<ListingCreateWithoutBookingsInput, ListingUncheckedCreateWithoutBookingsInput>
  }

  export type ListingUpsertWithoutBookingsInput = {
    update: XOR<ListingUpdateWithoutBookingsInput, ListingUncheckedUpdateWithoutBookingsInput>
    create: XOR<ListingCreateWithoutBookingsInput, ListingUncheckedCreateWithoutBookingsInput>
    where?: ListingWhereInput
  }

  export type ListingUpdateToOneWithWhereWithoutBookingsInput = {
    where?: ListingWhereInput
    data: XOR<ListingUpdateWithoutBookingsInput, ListingUncheckedUpdateWithoutBookingsInput>
  }

  export type ListingUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listingBookings?: ListingBookingUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listingBookings?: ListingBookingUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ListingCreateWithoutListingBookingsInput = {
    id?: string
    title: string
    price: number
    city?: string
    country?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    bookings?: BookingCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutListingBookingsInput = {
    id?: string
    title: string
    price: number
    city?: string
    country?: string
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    bookings?: BookingUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutListingBookingsInput = {
    where: ListingWhereUniqueInput
    create: XOR<ListingCreateWithoutListingBookingsInput, ListingUncheckedCreateWithoutListingBookingsInput>
  }

  export type ListingUpsertWithoutListingBookingsInput = {
    update: XOR<ListingUpdateWithoutListingBookingsInput, ListingUncheckedUpdateWithoutListingBookingsInput>
    create: XOR<ListingCreateWithoutListingBookingsInput, ListingUncheckedCreateWithoutListingBookingsInput>
    where?: ListingWhereInput
  }

  export type ListingUpdateToOneWithWhereWithoutListingBookingsInput = {
    where?: ListingWhereInput
    data: XOR<ListingUpdateWithoutListingBookingsInput, ListingUncheckedUpdateWithoutListingBookingsInput>
  }

  export type ListingUpdateWithoutListingBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookings?: BookingUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutListingBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    city?: StringFieldUpdateOperationsInput | string
    country?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookings?: BookingUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ListingBookingCreateManyListingInput = {
    id?: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    createdAt?: Date | string
  }

  export type BookingCreateManyListingInput = {
    id?: string
    userId: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    expiresAt?: Date | string | null
    cancelledAt?: Date | string | null
    stripePaymentIntentId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ListingBookingUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingBookingUncheckedUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingBookingUncheckedUpdateManyWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUncheckedUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUncheckedUpdateManyWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripePaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



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