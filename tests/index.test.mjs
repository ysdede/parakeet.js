import { describe, it, expect, vi } from 'vitest';
import { fromUrls, fromHub } from '../src/index.js';
import { ParakeetModel } from '../src/parakeet.js';
import { getParakeetModel } from '../src/hub.js';

vi.mock('../src/parakeet.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ParakeetModel: {
      fromUrls: vi.fn(),
    },
  };
});

vi.mock('../src/hub.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getParakeetModel: vi.fn(),
  };
});

describe('index.js', () => {
  it('fromUrls should call ParakeetModel.fromUrls', async () => {
    const cfg = { some: 'config' };
    await fromUrls(cfg);
    expect(ParakeetModel.fromUrls).toHaveBeenCalledWith(cfg);
  });

  it('fromHub should call getParakeetModel and ParakeetModel.fromUrls', async () => {
    const repoId = 'some-repo';
    const options = { opt: 'val' };
    const mockModelData = {
      urls: { u: 1 },
      filenames: { f: 1 },
      preprocessorBackend: 'js'
    };

    getParakeetModel.mockResolvedValue(mockModelData);

    await fromHub(repoId, options);

    expect(getParakeetModel).toHaveBeenCalledWith(repoId, options);
    expect(ParakeetModel.fromUrls).toHaveBeenCalledWith({
      ...mockModelData.urls,
      filenames: mockModelData.filenames,
      preprocessorBackend: mockModelData.preprocessorBackend,
      ...options,
    });
  });
});
