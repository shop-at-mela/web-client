const { createSlug: serverCreateSlug } = require('./slug');
const { createSlug: clientCreateSlug } = require('../../src/util/urlHelpers');

describe('server createSlug', () => {
  const samples = [
    'Rose Print Cotton Kurta Set — Hemant & Nandita',
    'Kundan Jhumka Earrings (Gold-plated)',
    '  Leading and trailing  ',
    'Crème brûlée Ñandú Øre ß',
    'Silk/Cotton blend: 100% hand-woven, size_M',
    '',
    '!!!',
    'हिंदी शीर्षक',
  ];

  it.each(samples)('matches the client createSlug for %p', title => {
    expect(serverCreateSlug(title)).toBe(clientCreateSlug(title));
  });
});
