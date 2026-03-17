import multiplication from './multiplication'
import division from './division'
import fractions from './fractions'
import decimals from './decimals'
import compare from './compare'
import square from './areas/square'
import rectangle from './areas/rectangle'
import rectangleCutout from './areas/rectangleCutout'
import proportions from './word/proportions'

export const MODULES = [
  multiplication,
  division,
  fractions,
  decimals,
  compare,
  proportions,
  square,
  rectangle,
  rectangleCutout,
]

export const GROUP_META = {
  areas: { id: 'areas', label: 'Areas', emoji: '📐' },
  word: { id: 'word', label: 'Word Problems', emoji: '📝' },
}

export function getModule(id) {
  return MODULES.find((m) => m.id === id)
}
