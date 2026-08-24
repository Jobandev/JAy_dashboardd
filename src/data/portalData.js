// Seed data for the Jay Downes client dashboard.
// Real client organisations from the weekly task brief. Contact details are
// placeholders — update them with Jay's actual contacts before going live.
// `status` defaults to "Active"; change individual entries to "Prospective"
// for organisations still waiting on confirmation.

const palette = [
  '#c96a62', '#5b8da7', '#bd7b72', '#a85b59', '#5d967d',
  '#bd805c', '#718fa5', '#b56c72', '#5b9c99', '#a7835d',
]

const initialsFor = (name) =>
  name
    .replace(/[()&]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const rawClients = [
  { id: 'aio', name: 'AIO', contact: '', email: '' },
  {
    id: 'auckland-hospital-university',
    name: 'Auckland Hospital & University',
    contact: 'Shamsul Shah',
    email: '',
    note: 'Death and Dying film research project',
  },
  { id: 'autographic-nz', name: 'Autographic NZ', contact: '', email: '' },
  { id: 'cacao-embassy-australia', name: 'Cacao Embassy Australia', contact: '', email: '' },
  { id: 'cacao-embassy-nz', name: 'Cacao Embassy NZ', contact: '', email: '' },
  { id: 'canzac', name: 'Canzac', contact: '', email: '' },
  { id: 'create-nutrition', name: 'Create Nutrition', contact: '', email: '' },
  { id: 'gimme-delivery', name: 'Gimme Delivery', contact: '', email: '' },
  { id: 'kate-southward-somatic-healing', name: 'Kate Southward – Somatic Healing', contact: 'Kate Southward', email: '' },
  { id: 'lemitree', name: 'LemiTree', contact: '', email: '' },
  { id: 'maori-maps', name: 'Māori Maps', contact: '', email: '' },
  { id: 'mother-india', name: 'Mother India', contact: '', email: '' },
  { id: 'o2b-healthy', name: 'O2B Healthy', contact: '', email: '' },
  { id: 'optimal-health-model', name: 'Optimal Health Model', contact: '', email: '' },
  { id: 'propel-fitness', name: 'Propel Fitness', contact: '', email: '' },
  { id: 'raw-culture-farms', name: 'Raw Culture Farms', contact: '', email: '' },
  { id: 'te-whare-hukahuka', name: 'Te Whare Hukahuka', contact: '', email: '' },
  { id: 'the-marketing-club', name: 'The Marketing Club (TMC)', contact: '', email: '' },
  { id: 'wolfgramm-holdings', name: 'Wolfgramm Holdings', contact: '', email: '' },
]

export const clients = rawClients.map((client, index) => ({
  ...client,
  initials: initialsFor(client.name),
  color: palette[index % palette.length],
  projects: 0,
  status: 'Active',
  lastActivity: '—',
}))

// A couple of starter projects so the dashboard isn't empty on first load.
// clientId is the source of truth for linking a project to a client — the
// `client` name field is kept only for display so older UI code that reads
// project.client keeps working.
export const projects = [
  {
    name: 'Death and Dying — research film',
    clientId: 'auckland-hospital-university',
    client: 'Auckland Hospital & University',
    status: 'Pre-production',
    progress: 10,
    due: 'TBC',
  },
  {
    name: 'Brand film',
    clientId: 'wolfgramm-holdings',
    client: 'Wolfgramm Holdings',
    status: 'In production',
    progress: 40,
    due: 'TBC',
  },
]

// Content types: Video, Photo, Document, Testimonial, Link.
// `client` / `clientId` link an item back to its organisation.
export const assets = []
