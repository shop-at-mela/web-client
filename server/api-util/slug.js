/**
 * Server copy of createSlug in src/util/urlHelpers.js. The listings sitemap needs the same
 * slug the client builds for /l/:slug/:id, and server code can't import src/ ES modules
 * directly. server/api-util/slug.test.js checks both stay identical.
 */
const SETS = [
  { to: 'a', from: 'ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ' },
  { to: 'c', from: 'ÇĆĈČ' },
  { to: 'd', from: 'ÐĎĐÞ' },
  { to: 'e', from: 'ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ' },
  { to: 'g', from: 'ĜĞĢǴ' },
  { to: 'h', from: 'ĤḦ' },
  { to: 'i', from: 'ÌÍÎÏĨĪĮİỈỊ' },
  { to: 'j', from: 'Ĵ' },
  { to: 'ij', from: 'Ĳ' },
  { to: 'k', from: 'Ķ' },
  { to: 'l', from: 'ĹĻĽŁ' },
  { to: 'm', from: 'Ḿ' },
  { to: 'n', from: 'ÑŃŅŇ' },
  { to: 'o', from: 'ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ' },
  { to: 'oe', from: 'Œ' },
  { to: 'p', from: 'ṕ' },
  { to: 'r', from: 'ŔŖŘ' },
  { to: 's', from: 'ßŚŜŞŠ' },
  { to: 't', from: 'ŢŤ' },
  { to: 'u', from: 'ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ' },
  { to: 'w', from: 'ẂŴẀẄ' },
  { to: 'x', from: 'ẍ' },
  { to: 'y', from: 'ÝŶŸỲỴỶỸ' },
  { to: 'z', from: 'ŹŻŽ' },
  { to: '-', from: "·/_,:;'" },
];

const createSlug = str => {
  let text = str
    .toString()
    .toLowerCase()
    .trim();

  SETS.forEach(set => {
    text = text.replace(new RegExp(`[${set.from}]`, 'gi'), set.to);
  });

  const slug = encodeURIComponent(
    text
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  );

  return slug.length > 0 ? slug : 'no-slug';
};

module.exports = { createSlug };
