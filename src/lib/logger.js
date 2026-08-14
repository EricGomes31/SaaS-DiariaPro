import { logActivity } from './db'

let _user = null

export function setLogUser(user) {
  _user = user
}

export function log(action, description) {
  const userName = _user?.user_metadata?.name || _user?.email?.split('@')[0] || 'Sistema'
  logActivity(action, description, { userName, userEmail: _user?.email ?? '' })
}
