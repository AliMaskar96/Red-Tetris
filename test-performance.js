// Performance comparison test
const { generatePieceBatch, createGameSequence } = require('./src/server/utils/pieceGenerator.js');

console.log('=== Comparaison de performance ===\n');

const roomId = 'PERF_TEST';

// Test 1: Mémoire utilisée
console.log('1. Test mémoire:');
const batch50 = generatePieceBatch(roomId, 0, 50);
const massive1000 = createGameSequence(roomId, 1000);

console.log(`Batch 50 pièces: ${JSON.stringify(batch50).length} bytes`);
console.log(`Massive 1000 pièces: ${JSON.stringify(massive1000).length} bytes`);
console.log(`Ratio: ${(JSON.stringify(massive1000).length / JSON.stringify(batch50).length).toFixed(1)}x plus gros`);

// Test 2: Temps de génération simple
console.log('\n2. Test génération unique:');
console.time('Batch 50');
generatePieceBatch(roomId, 0, 50);
console.timeEnd('Batch 50');

console.time('Massive 1000');
createGameSequence(roomId, 1000);
console.timeEnd('Massive 1000');

console.log('\n=== Analyse ===');
console.log('✅ Batch approach (50 pièces):');
console.log('  - ~20x moins de mémoire');
console.log('  - Génération à la demande');
console.log('  - Extensible à l\'infini');
console.log('');
console.log('⚠️  Massive approach (1000 pièces):');
console.log('  - Beaucoup plus de mémoire');
console.log('  - Limite à 1000 pièces');
console.log('  - Risque pour serveur avec beaucoup de rooms');

console.log('\n=== Recommandation finale ===');
console.log('🎯 Utiliser des BATCHES de 50 pièces avec extension automatique');
console.log('   - Mémoire optimisée');
console.log('   - Parties infinies possibles');
console.log('   - Meilleure scalabilité serveur');
