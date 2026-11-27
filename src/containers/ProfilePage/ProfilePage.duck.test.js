import reducer, { loadData, setUserShowError } from './ProfilePage.duck';
import { isNotFoundError } from '../../util/errors';

describe('ProfilePage duck: unknown brand slug', () => {
  it('stores a 404 for an unknown /brands/:slug instead of throwing (soft 404 fix)', async () => {
    const actions = [];
    const dispatch = action => {
      actions.push(action);
      return action;
    };
    await expect(
      loadData({ brandSlug: 'not-a-real-brand' }, '', {})(dispatch, () => ({}), {})
    ).resolves.toBeUndefined();

    const state = actions.reduce((s, a) => reducer(s, a), undefined);
    expect(isNotFoundError(state.userShowError)).toBe(true);
  });

  it('setUserShowError stores the given error', () => {
    const state = reducer(undefined, setUserShowError({ type: 'error', status: 404 }));
    expect(state.userShowError.status).toBe(404);
  });
});
