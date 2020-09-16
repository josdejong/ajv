/* eslint-disable @typescript-eslint/no-empty-interface */
export type SomeJSONSchema = JSONSchemaType<Known, true>

export type PartialSchema<T> = Partial<JSONSchemaType<T, true>>

export type JSONSchemaType<T, _partial = false> = (T extends number
  ? {
      type: "number" | "integer"
      minimum?: number
      maximum?: number
      exclusiveMinimum?: number
      exclusiveMaximum?: number
      multipleOf?: number
      format?: string
    }
  : T extends string
  ? {
      type: "string"
      minLength?: number
      maxLength?: number
      pattern?: string
      format?: string
    }
  : T extends boolean
  ? {
      type: "boolean"
    }
  : T extends [any, ...any[]]
  ? {
      // JSON Schema for tuple
      type: "array"
      items: {
        [K in keyof T]-?: JSONSchemaType<T[K]> & Nullable<T[K]>
      } & {length: T["length"]}
      minItems: T["length"]
    } & ({maxItems: T["length"]} | {additionalItems: false})
  : T extends any[]
  ? {
      type: "array"
      items: JSONSchemaType<T[0]>
      contains?: PartialSchema<T[0]>
      minItems?: number
      maxItems?: number
      uniqueItems?: true
      additionalItems?: never
    }
  : T extends Record<string, any>
  ? {
      // JSON Schema for records and dicitonaries
      // "required" and "additionalProperties" are not optional because they are often forgotten
      // "properties" are optional for more concise dicitonary schemas
      // "patternProperties" and can be only used with interfaces that have string index
      type: "object"
      // "required" type does not guarantee that all required properties are listed
      // it only asserts that optional cannot be listed
      required: _partial extends true ? (keyof T)[] : RequiredMembers<T>[]
      additionalProperties: boolean | JSONSchemaType<T[string]>
      properties?: _partial extends true ? Partial<PropertiesSchema<T>> : PropertiesSchema<T>
      patternProperties?: {
        [pattern: string]: JSONSchemaType<T[string]>
      }
      propertyNames?: JSONSchemaType<string>
      dependencies?: {
        [K in keyof T]?: (keyof T)[] | PartialSchema<T> | undefined
      }
      minProperties?: number
      maxProperties?: number
    }
  : T extends null
  ? {
      nullable: true
    }
  : never) & {
  [keyword: string]: any
  $id?: string
  $ref?: string
  $defs?: {
    [key: string]: JSONSchemaType<Known, true>
  }
  definitions?: {
    [key: string]: JSONSchemaType<Known, true>
  }
  allOf?: PartialSchema<T>[]
  anyOf?: PartialSchema<T>[]
  oneOf?: PartialSchema<T>[]
  if?: PartialSchema<T>
  then?: PartialSchema<T>
  else?: PartialSchema<T>
  not?: PartialSchema<T>
}

type Known = KnownRecord | [Known, ...Known[]] | Known[] | number | string | boolean | null

interface KnownRecord extends Record<string, Known> {}

type PropertiesSchema<T> = {
  [K in keyof T]-?: (JSONSchemaType<T[K]> & Nullable<T[K]>) | {$ref: string}
}

type RequiredMembers<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

type Nullable<T> = undefined extends T
  ? {
      nullable: true
      const?: never // any non-null value would fail `null`, `null` would fail any other value
      enum?: (T | null)[] // `null` must be explicitely included in "enum" for `null` to pass
      default?: T | null
    }
  : {
      const?: T
      enum?: T[]
      default?: T
    }