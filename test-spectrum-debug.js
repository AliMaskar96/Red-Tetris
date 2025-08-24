// Test script pour debug du spectre
const { generateSpectrum } = require('./src/client/utils/gameLogic.js');

console.log('=== Test de génération de spectre ===\n');

// Test 1: Plateau vide
const emptyBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
const emptySpectrum = generateSpectrum(emptyBoard);
console.log('1. Plateau vide:');
console.log('Spectre attendu: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20]');
console.log('Spectre obtenu: ', emptySpectrum);
console.log('Correct:', JSON.stringify(emptySpectrum) === JSON.stringify(Array(10).fill(20)) ? '✅' : '❌');

// Test 2: Quelques blocs dans différentes colonnes
const testBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
// Ajouter des blocs dans certaines colonnes
testBoard[19][0] = 1; // Colonne 0: hauteur 1
testBoard[18][0] = 1;
testBoard[19][1] = 1; // Colonne 1: hauteur 1
testBoard[17][2] = 1; // Colonne 2: hauteur 3
testBoard[18][2] = 1;
testBoard[19][2] = 1;

const testSpectrum = generateSpectrum(testBoard);
console.log('\n2. Plateau avec blocs:');
console.log('Spectre attendu: [18, 19, 17, 20, 20, 20, 20, 20, 20, 20]');
console.log('Spectre obtenu: ', testSpectrum);

// Test 3: Simulation d'un plateau de jeu réel
const realBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
// Simuler quelques lignes au bas du plateau
for (let col = 0; col < 10; col++) {
  if (col < 8) {
    realBoard[19][col] = 1; // Ligne du bas presque complète
  }
  if (col < 5) {
    realBoard[18][col] = 1; // Deuxième ligne partiellement remplie
  }
}

const realSpectrum = generateSpectrum(realBoard);
console.log('\n3. Plateau de jeu réel:');
console.log('Spectre obtenu: ', realSpectrum);

console.log('\n=== Fin des tests ===');
