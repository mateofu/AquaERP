import { buildPaginationMeta } from './pagination-query.dto';

describe('buildPaginationMeta', () => {
  it('calcula el total de páginas', () => {
    expect(buildPaginationMeta(41, 2, 20)).toEqual({
      total: 41,
      page: 2,
      limit: 20,
      totalPages: 3,
    });
  });

  it('mantiene al menos una página cuando no hay registros', () => {
    expect(buildPaginationMeta(0, 1, 20).totalPages).toBe(1);
  });
});
