function sanitizeForTTS(text) {
  let clean = text.replace(/[*_~]+/g, '');
  clean = clean.replace(/₹/g, ' rupees ');
  clean = clean.replace(/(\d+),(\d+)/g, '$1$2');
  clean = clean.replace(/-/g, ' ');
  return clean.trim();
}

console.log(sanitizeForTTS("You owe ₹3,240. Don't be late-payment."));
