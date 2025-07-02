// A minimal Proxy-based mock for chalk that supports chained calls like chalk.blue.bold('text')
const chalkProxy: any = new Proxy((str: string) => str, {
  get(_target, _prop) {
    return chalkProxy
  },
  apply(_target, _thisArg, argArray) {
    return argArray[0]
  }
})

export default chalkProxy; 