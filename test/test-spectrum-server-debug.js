// Test de la fonction generateSpectrum côté serveur
function generateSpectrum(board) {
  // Returns an array of 10 numbers: for each column, the height of blocks (0 = empty, 20 = full)
  const spectrum = Array(10).fill(0);
  for (let col = 0; col < 10; col++) {
    // Find the topmost occupied cell and calculate height
    let height = 0;
    for (let row = 0; row < 20; row++) { // Start from top (row 0)
      if (board[row][col] !== 0) {
        height = 20 - row; // Height is 20 minus the topmost occupied row
        break; // Stop at the first occupied cell from the top
      }
    }
    spectrum[col] = height;
  }
  return spectrum;
}

console.log('=== Test de génération de spectre (version serveur) ===\n');

// Test 1: Plateau vide
const emptyBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
const emptySpectrum = generateSpectrum(emptyBoard);
console.log('1. Plateau vide:');
console.log('Spectre attendu: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]');
console.log('Spectre obtenu: ', emptySpectrum);
console.log('Correct:', JSON.stringify(emptySpectrum) === JSON.stringify(Array(10).fill(0)) ? '✅' : '❌');

// Test 2: Quelques blocs dans différentes colonnes
const testBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
// Ajouter des blocs dans certaines colonnes
testBoard[19][0] = 1; // Colonne 0: bloc à la ligne 19 -> hauteur 1 (20-19=1)
testBoard[18][0] = 1; // Colonne 0: bloc à la ligne 18 -> hauteur 2 (20-18=2) - c'est le plus haut
testBoard[19][1] = 1; // Colonne 1: bloc à la ligne 19 -> hauteur 1 (20-19=1)
testBoard[17][2] = 1; // Colonne 2: bloc à la ligne 17 -> hauteur 3 (20-17=3) - c'est le plus haut
testBoard[18][2] = 1;
testBoard[19][2] = 1;

const testSpectrum = generateSpectrum(testBoard);
console.log('\n2. Plateau avec blocs:');
console.log('Spectre attendu: [2, 1, 3, 0, 0, 0, 0, 0, 0, 0] (basé sur le bloc le plus haut)');
console.log('Spectre obtenu: ', testSpectrum);
console.log('Correct:', JSON.stringify(testSpectrum) === JSON.stringify([2, 1, 3, 0, 0, 0, 0, 0, 0, 0]) ? '✅' : '❌');

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
  if (col < 3) {
    realBoard[17][col] = 1; // Troisième ligne partiellement remplie
  }
}

const realSpectrum = generateSpectrum(realBoard);
console.log('\n3. Plateau de jeu réel:');
console.log('Spectre obtenu: ', realSpectrum);
console.log('Attendu environ: [3, 3, 3, 2, 2, 1, 1, 1, 0, 0]');

console.log('\n=== Fin des tests ===');
