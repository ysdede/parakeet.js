export * from './parakeet';
export * from './hub';
export * from './models';
export * from './mel';

import type { FromUrlsConfig, ParakeetModel } from './parakeet';
import type { GetParakeetModelOptions } from './hub';

export function fromUrls(cfg: FromUrlsConfig): Promise<ParakeetModel>;
export function fromHub(repoIdOrModelKey: string, options?: GetParakeetModelOptions): Promise<ParakeetModel>;
