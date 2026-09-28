import { useId } from 'react';

/**
 * SVG ids are document-global on web, and stacked screens stay mounted, so
 * every gradient/filter id needs to be unique to its component instance.
 */
export const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, '');
