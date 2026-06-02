import { loadData as searchPageLoadData } from '../SearchPage/SearchPage.duck';
import { stringify } from '../../util/urlHelpers';

/**
 * Convert level1/level2/level3 path params into the pub_categoryLevelN
 * query params that SearchPage.duck.loadData expects.
 */
const categoryParamsToSearch = (params, existingSearch) => {
  const categoryQueryParams = {};
  if (params.level1) categoryQueryParams.pub_categoryLevel1 = params.level1;
  if (params.level2) categoryQueryParams.pub_categoryLevel2 = params.level2;
  if (params.level3) categoryQueryParams.pub_categoryLevel3 = params.level3;

  const existingQuery = existingSearch?.replace(/^\?/, '') || '';
  const categoryQuery = stringify(categoryQueryParams);
  const mergedSearch = [existingQuery, categoryQuery].filter(Boolean).join('&');
  return mergedSearch ? `?${mergedSearch}` : '';
};

export const loadData = (params, search, config) => {
  const mergedSearch = categoryParamsToSearch(params, search);
  return searchPageLoadData(params, mergedSearch, config);
};
