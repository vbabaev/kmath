import { apiGet } from './api'

// Returns the requester's group plus a roster of every member
// (id, name, emoji, color, role, googleEmail). Adults use this to see
// who's in the household, including other adults whose detail pages
// they can't open.
export async function getMyGroup() {
  return apiGet('/groups/me')
}
