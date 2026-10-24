import {
  hasPermissionToPostListings,
  showCreateListingLinkForUser,
} from '../../../../util/userHelpers';

// [label](url) or [label](url "title")
const MARKDOWN_LINK = /\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

const normalizePath = path => (path.length > 1 ? path.replace(/\/+$/, '') : path);

const pathnameOf = url => {
  if (/^https?:\/\//i.test(url)) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url.split(/[?#]/)[0];
};

const linksTo = (url, path) => normalizePath(pathnameOf(url)) === normalizePath(path);

/**
 * Removes every markdown link to `path` from a markdown string, matched by the link
 * target (relative or absolute URL), never by its label. A list item that holds only
 * that link is dropped whole, so no empty bullet is left behind.
 *
 * @param {string} markdown
 * @param {string} path e.g. '/l/new'
 * @returns {string}
 */
export const removeMarkdownLinksTo = (markdown, path) => {
  if (typeof markdown !== 'string' || !path) return markdown;
  return markdown
    .split('\n')
    .reduce((lines, line) => {
      let removed = false;
      const kept = line.replace(MARKDOWN_LINK, (match, url) => {
        if (!linksTo(url, path)) return match;
        removed = true;
        return '';
      });
      const isEmptyListItem = /^\s*(?:[-*+]|\d+\.)\s*$/.test(kept);
      if (removed && (isEmptyListItem || !kept.trim())) return lines;
      return [...lines, removed ? kept.replace(/\s+$/, '') : line];
    }, [])
    .join('\n');
};

/**
 * Footer blocks with every markdown link to `path` removed from their text field.
 */
export const removeFooterLinksTo = (blocks, path) =>
  (blocks || []).map(block =>
    block?.text?.fieldType === 'markdown' && typeof block.text.content === 'string'
      ? { ...block, text: { ...block.text, content: removeMarkdownLinksTo(block.text.content, path) } }
      : block
  );

/**
 * "Post a new listing" is for brand accounts only: a signed-in provider whose user type
 * and permission set allow posting. showCreateListingLinkForUser alone returns true for
 * signed-out visitors by default, hence the explicit signed-in check.
 *
 * @param {Object} config marketplace configuration
 * @param {Object?} currentUser current user entity
 * @returns {boolean}
 */
export const showPostListingLinkInFooter = (config, currentUser) =>
  !!currentUser?.id &&
  currentUser.attributes?.profile?.publicData?.userType === 'provider' &&
  !!showCreateListingLinkForUser(config, currentUser) &&
  hasPermissionToPostListings(currentUser);
