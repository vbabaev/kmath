import multiplication from './multiplication'
import division from './division'
import fractions from './fractions'
import decimals from './decimals'

export const MODULES = [multiplication, division, fractions, decimals]

export function getModule(id) {
  return MODULES.find((m) => m.id === id)
}
