// Test de la fonction addPenaltyLines
import { addPenaltyLines, clearLines } from '../src/client/utils/gameLogic.js';

// Créer un plateau de test (20x10)
const createTestBoard = () => {
  const board = [];
  for (let i = 0; i < 20; i++) {
    board.push(Array(10).fill(0));
  }
  // Ajouter quelques pièces dans les lignes du bas
  board[18] = [1, 2, 3, 0, 0, 0, 4, 5, 6, 7];
  board[19] = [1, 2, 0, 0, 0, 0, 0, 5, 6, 7];
  return board;
};

// Test 1: Ajouter 2 lignes de pénalité
console.log('=== Test addPenaltyLines ===');
const testBoard = createTestBoard();
console.log('Plateau original (lignes 18-19):');
console.log('18:', testBoard[18]);
console.log('19:', testBoard[19]);

const boardWithPenalty = addPenaltyLines(testBoard, 2);
console.log('\nAprès ajout de 2 lignes de pénalité:');
console.log('16:', boardWithPenalty[16]); // Devrait être vide (0)
console.log('17:', boardWithPenalty[17]); // Devrait être vide (0)
console.log('18:', boardWithPenalty[18]); // Devrait être l'ancienne ligne 18
console.log('19:', boardWithPenalty[19]); // Devrait être l'ancienne ligne 19
console.log('20 (penalty):', boardWithPenalty[20]); // N'existe pas, tableau de 20 lignes
console.log('Ligne du bas (19):', boardWithPenalty[19]); // Devrait être des 9

// Test 2: Vérifier que clearLines ne supprime pas les lignes de pénalité
console.log('\n=== Test clearLines avec pénalités ===');
const boardWithFullLineAndPenalty = addPenaltyLines(testBoard, 1);
// Remplir une ligne complète (sauf les pénalités)
boardWithFullLineAndPenalty[18] = [1, 2, 3, 4, 5, 6, 7, 1, 2, 3]; // Ligne complète

const { newBoard, linesCleared } = clearLines(boardWithFullLineAndPenalty);
console.log('Lignes supprimées:', linesCleared);
console.log('Ligne du bas après clearLines:', newBoard[19]); // Devrait encore contenir des 9
