export function validateResource(resource, project) {
  if (!resource.clientId || !resource.projectId || !project || project.clientId !== resource.clientId) {
    throw new Error('Choose a project belonging to this organisation.');
  }
  for (const field of ['externalUrl', 'url', 'thumbnailUrl']) {
    if (!resource[field]) continue;
    let parsed;
    try { parsed = new URL(resource[field]); } catch { throw new Error('Use a valid HTTPS or HTTP resource link.'); }
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Use a valid HTTPS or HTTP resource link.');
  }
  return resource;
}
