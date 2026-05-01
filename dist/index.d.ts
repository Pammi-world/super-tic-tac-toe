declare const express: any;
declare const app: any;
declare const PORT: any;
/** @typedef {{ name: string, symbol: string }} Player */
/** @typedef {{ players: Player[], currentPlayer: number, board: (string|null)[][][][], activeBoard: number|null, winner: string|null, isDraw: boolean, mode: string }} Game */
/** @type {Game|null} */
declare let game: null;
/** @returns {Game} */
declare function initGame(mode?: string): {
    players: {
        name: string;
        symbol: string;
    }[];
    currentPlayer: number;
    board: any[][][];
    activeBoard: null;
    winner: null;
    isDraw: boolean;
    mode: string;
};
/** @param {(string|null)[][]} board @returns {string|null} */
declare function checkBoardWin(board: any): any;
//# sourceMappingURL=index.d.ts.map