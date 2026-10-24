import { removeMarkdownLinksTo, removeFooterLinksTo, showPostListingLinkInFooter } from './footerLinks';
import { createCurrentUser } from '../../../../util/testData';

const CONSOLE_FOOTER =
  '- [About us](/p/about)\n- [Search listings](/s)\n- [Post a new listing](/l/new)';

describe('removeMarkdownLinksTo', () => {
  it('drops the list item that links to the path, keeping the others', () => {
    expect(removeMarkdownLinksTo(CONSOLE_FOOTER, '/l/new')).toBe(
      '- [About us](/p/about)\n- [Search listings](/s)'
    );
  });

  it('matches by link target, not label', () => {
    const md = '- [Sell on Mela](/l/new)\n- [Post a new listing](/p/about)';
    expect(removeMarkdownLinksTo(md, '/l/new')).toBe('- [Post a new listing](/p/about)');
  });

  it('matches absolute URLs, trailing slashes, query strings and link titles', () => {
    const md = [
      '- [A](https://shopatmela.com/l/new)',
      '- [B](/l/new/)',
      '- [C](/l/new?ref=footer)',
      '- [D](/l/new "Post")',
      '- [Keep](/l/newsletter)',
    ].join('\n');
    expect(removeMarkdownLinksTo(md, '/l/new')).toBe('- [Keep](/l/newsletter)');
  });

  it('removes an inline link but keeps the rest of the line', () => {
    expect(removeMarkdownLinksTo('Brands: [post here](/l/new) or [read](/p/about)', '/l/new')).toBe(
      'Brands:  or [read](/p/about)'
    );
  });

  it('leaves markdown with no matching link unchanged', () => {
    const md = '- [Terms of Service](/terms-of-service)\n- [Privacy Policy](/privacy-policy)';
    expect(removeMarkdownLinksTo(md, '/l/new')).toBe(md);
  });
});

describe('removeFooterLinksTo', () => {
  it('only rewrites markdown text fields and passes other blocks through', () => {
    const blocks = [
      { blockId: 'general', text: { fieldType: 'markdown', content: CONSOLE_FOOTER } },
      { blockId: 'empty' },
    ];
    const result = removeFooterLinksTo(blocks, '/l/new');
    expect(result[0].text.content).not.toContain('/l/new');
    expect(result[1]).toBe(blocks[1]);
    // does not mutate the Console asset
    expect(blocks[0].text.content).toContain('/l/new');
  });
});

describe('showPostListingLinkInFooter', () => {
  const config = { user: { userTypes: [] }, topbar: {} };
  const withUserType = userType =>
    createCurrentUser('u1', {
      profile: { displayName: 'U', publicData: { userType } },
    });

  it('is true for a signed-in provider with permission to post', () => {
    expect(showPostListingLinkInFooter(config, withUserType('provider'))).toBe(true);
  });

  it('is false for a signed-in customer', () => {
    expect(showPostListingLinkInFooter(config, withUserType('customer'))).toBe(false);
  });

  it('is false for signed-out visitors', () => {
    expect(showPostListingLinkInFooter(config, null)).toBe(false);
    expect(showPostListingLinkInFooter(config, undefined)).toBe(false);
  });

  it('is false for a provider without posting permission', () => {
    const user = withUserType('provider');
    user.effectivePermissionSet.attributes.postListings = 'permission/deny';
    expect(showPostListingLinkInFooter(config, user)).toBe(false);
  });
});
