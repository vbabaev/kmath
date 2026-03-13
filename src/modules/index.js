import multiplication from './multiplication'
import division from './division'
import fractions from './fractions'
import decimals from './decimals'
import square from './areas/square'
import rectangle from './areas/rectangle'
import rectangleCutout from './areas/rectangleCutout'

export const MODULES = [
  multiplication,
  division,
  fractions,
  decimals,
  square,
  rectangle,
  rectangleCutout,
]

export const GROUP_META = {
  areas: { id: 'areas', label: 'Areas', emoji: '📐' },
}

export function getModule(id) {
  return MODULES.find((m) => m.id === id)
}
