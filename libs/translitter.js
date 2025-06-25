const russianSymbol = require('../dictionary/russian.symbol.json');

module.exports = (word) => {
  if (!word) {
    return '';
  }
  return _translitToEng(word.toString().toLowerCase().trim());
};

function _translitToEng(word) {
  let result = '';
  for (let i = 0; i < word.length; i += 1) {
    result += russianSymbol[word[i]] || word[i];
  }
  return result;
}
