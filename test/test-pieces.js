// Test script for piece generation logic
const { generatePieceBatch, getPieceAtIndex } = require('./src/server/utils/pieceGenerator.js');

console.log('=== Test de la logique de génération de pièces ===\n');

const roomId = 'TEST123';

// Test 1: Générer les 20 premières pièces par batch
console.log('1. Génération par batch (0-19):');
const batch1 = generatePieceBatch(roomId, 0, 20);
console.log('Batch 1:', batch1);

// Test 2: Générer les 20 suivantes
console.log('\n2. Génération par batch (20-39):');
const batch2 = generatePieceBatch(roomId, 20, 20);
console.log('Batch 2:', batch2);

// Test 3: Vérifier la cohérence avec getPieceAtIndex
console.log('\n3. Vérification cohérence (index 0-9):');
for (let i = 0; i < 10; i++) {
  const batchPiece = batch1[i];
  const indexPiece = getPieceAtIndex(roomId, i);
  const match = batchPiece === indexPiece ? '✅' : '❌';
  console.log(`Index ${i}: batch=${batchPiece}, index=${indexPiece} ${match}`);
}

// Test 4: Vérifier que le système 7-bag fonctionne
console.log('\n4. Vérification du système 7-bag (premiers 14):');
const first14 = generatePieceBatch(roomId, 0, 14);
const bag1 = first14.slice(0, 7).sort();
const bag2 = first14.slice(7, 14).sort();
const expectedBag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

console.log('Bag 1 (trié):', bag1);
console.log('Bag 2 (trié):', bag2);
console.log('Expected    :', expectedBag);
console.log('Bag 1 correct:', JSON.stringify(bag1) === JSON.stringify(expectedBag) ? '✅' : '❌');
console.log('Bag 2 correct:', JSON.stringify(bag2) === JSON.stringify(expectedBag) ? '✅' : '❌');

// Test 5: Même roomId = même séquence
console.log('\n5. Déterminisme (même room = même séquence):');
const batch1bis = generatePieceBatch(roomId, 0, 10);
const identical = JSON.stringify(batch1.slice(0, 10)) === JSON.stringify(batch1bis);
console.log('Première génération :', batch1.slice(0, 10));
console.log('Deuxième génération:', batch1bis);
console.log('Identiques         :', identical ? '✅' : '❌');

// Test 6: Rooms différentes = séquences différentes
console.log('\n6. Rooms différentes:');
const room2Batch = generatePieceBatch('ROOM456', 0, 10);
const different = JSON.stringify(batch1.slice(0, 10)) !== JSON.stringify(room2Batch);
console.log('Room TEST123:', batch1.slice(0, 10));
console.log('Room ROOM456:', room2Batch);
console.log('Différentes :', different ? '✅' : '❌');

console.log('\n=== Tests terminés ===');
