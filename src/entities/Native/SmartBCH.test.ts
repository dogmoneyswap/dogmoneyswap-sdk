import { SmartBCH } from './SmartBCH'

describe('SmartBCH', () => {
  it('static constructor uses cache', () => {
    expect(SmartBCH.onChain(1) === SmartBCH.onChain(1)).toEqual(true)
  })
  it('caches once per chain ID', () => {
    expect(SmartBCH.onChain(1) !== SmartBCH.onChain(2)).toEqual(true)
  })
  it('#equals returns false for diff chains', () => {
    expect(SmartBCH.onChain(1).equals(SmartBCH.onChain(2))).toEqual(false)
  })
  it('#equals returns true for same chains', () => {
    expect(SmartBCH.onChain(1).equals(SmartBCH.onChain(1))).toEqual(true)
  })
})
