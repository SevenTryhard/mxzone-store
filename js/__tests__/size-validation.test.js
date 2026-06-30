const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Simulamos el entorno mínimo que products.js espera para poder evaluar la función
// Importamos directamente con eval para evitar que el script completo se ejecute.
const fs = require('fs');
const path = require('path');

const utilsSource = fs.readFileSync(path.join(__dirname, '..', 'utils.js'), 'utf8');

// Extraemos solo la función que vamos a testear
const functionMatch = utilsSource.match(/function shouldRequireSize\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);
if (!functionMatch) {
  throw new Error('No se encontró la función shouldRequireSize en utils.js');
}

eval(functionMatch[0]);

describe('shouldRequireSize', () => {
  it('returns false for unique size "Única"', () => {
    assert.equal(shouldRequireSize('Única'), false);
  });

  it('returns false for uppercase "UNICA"', () => {
    assert.equal(shouldRequireSize('UNICA'), false);
  });

  it('returns false for empty/missing sizes', () => {
    assert.equal(shouldRequireSize(''), false);
    assert.equal(shouldRequireSize(null), false);
    assert.equal(shouldRequireSize(undefined), false);
  });

  it('returns false for "Consultar" placeholder', () => {
    assert.equal(shouldRequireSize('Consultar'), false);
  });

  it('returns true when multiple real sizes exist', () => {
    assert.equal(shouldRequireSize('S/M/L'), true);
    assert.equal(shouldRequireSize('38/39/40'), true);
  });

  it('returns false for size-like noise that resolves to a single value', () => {
    assert.equal(shouldRequireSize('  /  Única  '), false);
  });

  it('returns true for single raw size that is not Única', () => {
    assert.equal(shouldRequireSize('M'), true);
  });
});
