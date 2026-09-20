/** A URL query value is `string | string[] | undefined`; pages want one plain string. */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}
