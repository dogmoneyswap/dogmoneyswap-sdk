import { SmartBCH } from './SmartBCH'

describe('SmartBCH', () => {
  it('static constructor uses cache', () => {
    expect(SmartBCH.onChain(10000) === SmartBCH.onChain(10000)).toEqual(true)
  })
  it('caches once per chain ID', () => {
    expect(SmartBCH.onChain(10000) !== SmartBCH.onChain(10001)).toEqual(true)
  })
  it('#equals returns false for diff chains', () => {
    expect(SmartBCH.onChain(10000).equals(SmartBCH.onChain(10001))).toEqual(false)
  })
  it('#equals returns true for same chains', () => {
    expect(SmartBCH.onChain(10000).equals(SmartBCH.onChain(10000))).toEqual(true)
  })
})
