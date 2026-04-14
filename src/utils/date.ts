
export const parseDate = (value: any): Date => {
  const num = Number(value)

  if (num < 1e12) {
    return new Date(num * 1000)
  }

  return new Date(num)
}
