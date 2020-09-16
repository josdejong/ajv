import {_, nil, and, operators, Code, Name, getProperty} from "./codegen"
import type {SchemaCxt, Schema} from "../types"
import type {Rule, ValidationRules} from "./rules"
import N from "./names"

export enum DataType {
  Correct,
  Wrong,
}

export function checkDataType(
  dataType: string,
  data: Name,
  strictNums?: boolean | "log",
  correct = DataType.Correct
): Code {
  const EQ = correct === DataType.Correct ? operators.EQ : operators.NEQ
  let cond: Code
  switch (dataType) {
    case "null":
      return _`${data} ${EQ} null`
    case "array":
      cond = _`Array.isArray(${data})`
      break
    case "object":
      cond = _`${data} && typeof ${data} == "object" && !Array.isArray(${data})`
      break
    case "integer":
      cond = numCond(_`!(${data} % 1) && !isNaN(${data})`)
      break
    case "number":
      cond = numCond()
      break
    default:
      return _`typeof ${data} ${EQ} ${dataType}`
  }
  return correct === DataType.Correct ? cond : _`!(${cond})`

  function numCond(_cond: Code = nil): Code {
    return and(_`typeof ${data} == "number"`, _cond, strictNums ? _`isFinite(${data})` : nil)
  }
}

export function checkDataTypes(
  dataTypes: string[],
  data: Name,
  strictNums?: boolean | "log",
  correct?: DataType
): Code {
  if (dataTypes.length === 1) {
    return checkDataType(dataTypes[0], data, strictNums, correct)
  }
  let cond: Code
  const types = toHash(dataTypes)
  if (types.array && types.object) {
    const notObj = _`typeof ${data} != "object"`
    cond = types.null ? notObj : _`(!${data} || ${notObj})`
    delete types.null
    delete types.array
    delete types.object
  } else {
    cond = nil
  }
  if (types.number) delete types.integer
  for (const t in types) cond = and(cond, checkDataType(t, data, strictNums, correct))
  return cond
}

// TODO refactor to use Set
export function toHash(arr: string[]): {[key: string]: true | undefined} {
  const hash: {[key: string]: true} = {}
  for (const item of arr) hash[item] = true
  return hash
}

export function schemaHasRules(
  schema: Schema,
  rules: {[key: string]: boolean | Rule | undefined}
): boolean {
  if (typeof schema == "boolean") return !schema
  for (const key in schema) if (rules[key]) return true
  return false
}

export function schemaCxtHasRules({schema, self}: SchemaCxt): boolean {
  if (typeof schema == "boolean") return !schema
  for (const key in schema) if (self.RULES.all[key]) return true
  return false
}

export function schemaHasRulesButRef(schema: Schema, RULES: ValidationRules): boolean {
  if (typeof schema == "boolean") return !schema
  for (const key in schema) if (key !== "$ref" && RULES.all[key]) return true
  return false
}

const JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/
const RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/
export function getData(
  $data: string,
  {dataLevel, dataNames, dataPathArr}: SchemaCxt
): Code | number {
  let jsonPointer
  let data: Code
  if ($data === "") return N.rootData
  if ($data[0] === "/") {
    if (!JSON_POINTER.test($data)) throw new Error(`Invalid JSON-pointer: ${$data}`)
    jsonPointer = $data
    data = N.rootData
  } else {
    const matches = RELATIVE_JSON_POINTER.exec($data)
    if (!matches) throw new Error(`Invalid JSON-pointer: ${$data}`)
    const up: number = +matches[1]
    jsonPointer = matches[2]
    if (jsonPointer === "#") {
      if (up >= dataLevel) throw new Error(errorMsg("property/index", up))
      return dataPathArr[dataLevel - up]
    }
    if (up > dataLevel) throw new Error(errorMsg("data", up))
    data = dataNames[dataLevel - up]
    if (!jsonPointer) return data
  }

  let expr = data
  const segments = jsonPointer.split("/")
  for (const segment of segments) {
    if (segment) {
      data = _`${data}${getProperty(unescapeJsonPointer(segment))}`
      expr = _`${expr} && ${data}`
    }
  }
  return expr

  function errorMsg(pointerType: string, up: number): string {
    return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`
  }
}

export function unescapeFragment(str: string): string {
  return unescapeJsonPointer(decodeURIComponent(str))
}

export function escapeFragment(str: string | number): string {
  return encodeURIComponent(escapeJsonPointer(str))
}

export function escapeJsonPointer(str: string | number): string {
  if (typeof str == "number") return `${str}`
  return str.replace(/~/g, "~0").replace(/\//g, "~1")
}

function unescapeJsonPointer(str: string): string {
  return str.replace(/~1/g, "/").replace(/~0/g, "~")
}

export function eachItem<T>(xs: T | T[], f: (x: T) => void): void {
  if (Array.isArray(xs)) {
    for (const x of xs) f(x)
  } else {
    f(xs)
  }
}