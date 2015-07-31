/// <reference path="../src/JSONKifuFormat.d.ts" />
/** @license
 * JSON Kifu Format
 * Copyright (c) 2014 na2hiro (https://github.com/na2hiro)
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */
var ShogiJS = require("../node_modules/shogi.js/lib/shogi");
var Shogi = ShogiJS.Shogi;
var Piece = ShogiJS.Piece;
var Color = ShogiJS.Color;
function canPromote(place, color) {
    return color == Color.Black ? place.y <= 3 : place.y >= 7;
}
exports.canPromote = canPromote;
// 最小形式の棋譜をnormalizeする
// 最小形式: (指し) from, to, promote; (打ち) piece, to
function normalizeMinimal(obj) {
    var shogi = new Shogi(obj.initial || undefined);
    normalizeMinimalMoves(shogi, obj.moves);
    return obj;
}
exports.normalizeMinimal = normalizeMinimal;
function normalizeMinimalMoves(shogi, moves, lastMove) {
    for (var i = 0; i < moves.length; i++) {
        var last = i <= 1 ? lastMove : moves[i - 1];
        var move = moves[i].move;
        if (!move)
            continue;
        // 手番
        move.color = shogi.turn == Color.Black;
        if (move.from) {
            // move
            // toからsame復元
            if (last && last.move && move.to.x == last.move.to.x && move.to.y == last.move.to.y) {
                move.same = true;
            }
            // capture復元
            addCaptureInformation(shogi, move);
            // piece復元
            if (!move.piece) {
                move.piece = shogi.get(move.from.x, move.from.y).kind;
            }
            // 不成復元
            if (!move.promote && !Piece.isPromoted(move.piece) && Piece.canPromote(move.piece)) {
                // 成ってない
                if (canPromote(move.to, shogi.turn) || canPromote(move.from, shogi.turn)) {
                    move.promote = false;
                }
            }
            // relative復元
            addRelativeInformation(shogi, move);
            try {
                shogi.move(move.from.x, move.from.y, move.to.x, move.to.y, move.promote);
            }
            catch (e) {
                throw i + "手目で失敗しました: " + e;
            }
        }
        else {
            // drop
            if (shogi.getMovesTo(move.to.x, move.to.y, move.piece).length > 0) {
                move.relative = "H";
            }
            shogi.drop(move.to.x, move.to.y, move.piece);
        }
    }
    for (var i = moves.length - 1; i >= 0; i--) {
        var move = moves[i].move;
        if (move) {
            if (move.from) {
                shogi.unmove(move.from.x, move.from.y, move.to.x, move.to.y, move.promote, move.capture);
            }
            else {
                shogi.undrop(move.to.x, move.to.y);
            }
        }
        last = i <= 1 ? lastMove : moves[i - 1];
        if (moves[i].forks) {
            for (var j = 0; j < moves[i].forks.length; j++) {
                normalizeMinimalMoves(shogi, moves[i].forks[j], last);
            }
        }
    }
    restoreColorOfIllegalAction(moves);
}
function normalizeKIF(obj) {
    var shogi = new Shogi(obj.initial || undefined);
    normalizeKIFMoves(shogi, obj.moves);
    return obj;
}
exports.normalizeKIF = normalizeKIF;
function normalizeKIFMoves(shogi, moves, lastMove) {
    for (var i = 0; i < moves.length; i++) {
        var last = i <= 1 ? lastMove : moves[i - 1];
        var move = moves[i].move;
        if (!move)
            continue;
        // 手番
        move.color = shogi.turn == Color.Black;
        if (move.from) {
            // move
            // sameからto復元
            if (move.same)
                move.to = last.move.to;
            // capture復元
            addCaptureInformation(shogi, move);
            // 不成復元
            if (!move.promote && !Piece.isPromoted(move.piece) && Piece.canPromote(move.piece)) {
                // 成ってない
                if (canPromote(move.to, shogi.turn) || canPromote(move.from, shogi.turn)) {
                    move.promote = false;
                }
            }
            // relative復元
            addRelativeInformation(shogi, move);
            try {
                shogi.move(move.from.x, move.from.y, move.to.x, move.to.y, move.promote);
            }
            catch (e) {
                throw i + "手目で失敗しました: " + e;
            }
        }
        else {
            // drop
            if (shogi.getMovesTo(move.to.x, move.to.y, move.piece).length > 0) {
                move.relative = "H";
            }
            shogi.drop(move.to.x, move.to.y, move.piece);
        }
    }
    for (var i = moves.length - 1; i >= 0; i--) {
        var move = moves[i].move;
        if (move) {
            if (move.from) {
                shogi.unmove(move.from.x, move.from.y, move.to.x, move.to.y, move.promote, move.capture);
            }
            else {
                shogi.undrop(move.to.x, move.to.y);
            }
        }
        last = i <= 1 ? lastMove : moves[i - 1];
        if (moves[i].forks) {
            for (var j = 0; j < moves[i].forks.length; j++) {
                normalizeKIFMoves(shogi, moves[i].forks[j], last);
            }
        }
    }
    restoreColorOfIllegalAction(moves);
}
function normalizeKI2(obj) {
    var shogi = new Shogi(obj.initial || undefined);
    normalizeKI2Moves(shogi, obj.moves);
    return obj;
}
exports.normalizeKI2 = normalizeKI2;
function normalizeKI2Moves(shogi, moves, lastMove) {
    for (var i = 0; i < moves.length; i++) {
        var last = i <= 1 ? lastMove : moves[i - 1];
        var move = moves[i].move;
        if (!move)
            continue;
        // 手番
        move.color = shogi.turn == Color.Black;
        // 同からto復元
        if (move.same)
            move.to = last.move.to;
        // from復元
        var candMoves = shogi.getMovesTo(move.to.x, move.to.y, move.piece);
        if (move.relative == "H" || candMoves.length == 0) {
        }
        else if (candMoves.length == 1) {
            move.from = candMoves[0].from;
        }
        else {
            // 相対逆算
            var moveAns = filterMovesByRelatives(move.relative, shogi.turn, candMoves);
            if (moveAns.length != 1)
                throw "相対情報が不完全で複数の候補があります";
            move.from = moveAns[0].from;
        }
        if (move.from) {
            // move
            // capture復元
            addCaptureInformation(shogi, move);
            try {
                shogi.move(move.from.x, move.from.y, move.to.x, move.to.y, move.promote);
            }
            catch (e) {
                throw i + "手目で失敗しました: " + e;
            }
        }
        else {
            // drop
            shogi.drop(move.to.x, move.to.y, move.piece);
        }
    }
    for (var i = moves.length - 1; i >= 0; i--) {
        var move = moves[i].move;
        if (!move)
            continue;
        if (move.from) {
            shogi.unmove(move.from.x, move.from.y, move.to.x, move.to.y, move.promote, move.capture);
        }
        else {
            shogi.undrop(move.to.x, move.to.y);
        }
        last = i <= 1 ? lastMove : moves[i - 1];
        if (moves[i].forks) {
            for (var j = 0; j < moves[i].forks.length; j++) {
                normalizeKI2Moves(shogi, moves[i].forks[j], last);
            }
        }
    }
    restoreColorOfIllegalAction(moves);
}
function normalizeCSA(obj) {
    restorePreset(obj);
    var shogi = new Shogi(obj.initial || undefined);
    for (var i = 0; i < obj.moves.length; i++) {
        var move = obj.moves[i].move;
        if (!move)
            continue;
        // 手番
        move.color = shogi.turn == Color.Black;
        if (move.from) {
            // move
            // same復元
            if (i > 0 && obj.moves[i - 1].move && obj.moves[i - 1].move.to.x == move.to.x && obj.moves[i - 1].move.to.y == move.to.y) {
                move.same = true;
            }
            // capture復元
            addCaptureInformation(shogi, move);
            if (Piece.isPromoted(move.piece)) {
                // 成かも
                var from = shogi.get(move.from.x, move.from.y);
                if (from.kind != move.piece) {
                    move.piece = from.kind;
                    move.promote = true;
                }
            }
            else if (Piece.canPromote(move.piece)) {
                // 不成かも
                if (canPromote(move.to, shogi.turn) || canPromote(move.from, shogi.turn)) {
                    move.promote = false;
                }
            }
            // relative復元
            addRelativeInformation(shogi, move);
            try {
                shogi.move(move.from.x, move.from.y, move.to.x, move.to.y, move.promote);
            }
            catch (e) {
                throw i + "手目で失敗しました: " + e;
            }
        }
        else {
            // drop
            if (shogi.getMovesTo(move.to.x, move.to.y, move.piece).length > 0) {
                move.relative = "H";
            }
            shogi.drop(move.to.x, move.to.y, move.piece);
        }
    }
    return obj;
}
exports.normalizeCSA = normalizeCSA;
function addRelativeInformation(shogi, move) {
    var moveVectors = shogi.getMovesTo(move.to.x, move.to.y, move.piece).map(function (mv) { return flipVector(shogi.turn, spaceshipVector(mv.to, mv.from)); });
    if (moveVectors.length >= 2) {
        var realVector = flipVector(shogi.turn, spaceshipVector(move.to, move.from));
        move.relative = function () {
            // 上下方向唯一
            if (moveVectors.filter(function (mv) { return mv.y == realVector.y; }).length == 1)
                return YToUMD(realVector.y);
            // 左右方向唯一
            if (moveVectors.filter(function (mv) { return mv.x == realVector.x; }).length == 1) {
                if ((move.piece == "UM" || move.piece == "RY") && realVector.x == 0) {
                    //直はだめ
                    return XToLCR(moveVectors.filter(function (mv) { return mv.x < 0; }).length == 0 ? -1 : 1);
                }
                else {
                    return XToLCR(realVector.x);
                }
            }
            //上下も左右も他の駒がいる
            return XToLCR(realVector.x) + YToUMD(realVector.y);
        }();
    }
}
function addCaptureInformation(shogi, move) {
    var to = shogi.get(move.to.x, move.to.y);
    if (to)
        move.capture = to.kind;
}
function flipVector(color, vector) {
    return color == Color.Black ? vector : { x: -vector.x, y: -vector.y };
}
function spaceship(a, b) {
    return a == b ? 0 : (a > b ? 1 : -1);
}
function spaceshipVector(a, b) {
    return { x: spaceship(a.x, b.x), y: spaceship(a.y, b.y) };
}
// yの段から移動した場合の相対情報
function YToUMD(y) {
    return y == 0 ? "M" : (y > 0 ? "D" : "U");
}
// xの行から移動した場合の相対情報
function XToLCR(x) {
    return x == 0 ? "C" : (x > 0 ? "R" : "L");
}
function filterMovesByRelatives(relative, color, moves) {
    var ret = [];
    for (var i = 0; i < moves.length; i++) {
        if (relative.split("").every(function (rel) { return moveSatisfiesRelative(rel, color, moves[i]); })) {
            ret.push(moves[i]);
        }
    }
    return ret;
}
function moveSatisfiesRelative(relative, color, move) {
    var vec = flipVector(color, { x: move.to.x - move.from.x, y: move.to.y - move.from.y });
    switch (relative) {
        case "U":
            return vec.y < 0;
        case "M":
            return vec.y == 0;
        case "D":
            return vec.y > 0;
        case "L":
            return vec.x < 0;
        case "C":
            return vec.x == 0;
        case "R":
            return vec.x > 0;
    }
}
// CSA等で盤面みたままで表現されているものをpresetに戻せれば戻す
function restorePreset(obj) {
    if (!obj.initial || obj.initial.preset != "OTHER")
        return;
    var hirate = [
        [{ color: false, kind: "KY" }, {}, { color: false, kind: "FU" }, {}, {}, {}, { color: true, kind: "FU" }, {}, { color: true, kind: "KY" },],
        [{ color: false, kind: "KE" }, { color: false, kind: "KA" }, { color: false, kind: "FU" }, {}, {}, {}, { color: true, kind: "FU" }, { color: true, kind: "HI" }, { color: true, kind: "KE" },],
        [{ color: false, kind: "GI" }, {}, { color: false, kind: "FU" }, {}, {}, {}, { color: true, kind: "FU" }, {}, { color: true, kind: "GI" },],
        [{ color: false, kind: "KI" }, {}, { color: false, kind: "FU" }, {}, {}, {}, { color: true, kind: "FU" }, {}, { color: true, kind: "KI" },],
        [{ color: false, kind: "OU" }, {}, { color: false, kind: "FU" }, {}, {}, {}, { color: true, kind: "FU" }, {}, { color: true, kind: "OU" },],
        [{ color: false, kind: "KI" }, {}, { color: false, kind: "FU" }, {}, {}, {}, { color: true, kind: "FU" }, {}, { color: true, kind: "KI" },],
        [{ color: false, kind: "GI" }, {}, { color: false, kind: "FU" }, {}, {}, {}, { color: true, kind: "FU" }, {}, { color: true, kind: "GI" },],
        [{ color: false, kind: "KE" }, { color: false, kind: "HI" }, { color: false, kind: "FU" }, {}, {}, {}, { color: true, kind: "FU" }, { color: true, kind: "KA" }, { color: true, kind: "KE" },],
        [{ color: false, kind: "KY" }, {}, { color: false, kind: "FU" }, {}, {}, {}, { color: true, kind: "FU" }, {}, { color: true, kind: "KY" },],
    ];
    var diff = [];
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            if (!samePiece(obj.initial.data.board[i][j], hirate[i][j]))
                diff.push("" + (i + 1) + (j + 1));
        }
    }
    var presets = {};
    presets[""] = "HIRATE";
    presets["11"] = "KY";
    presets["91"] = "KY_R";
    presets["22"] = "KA";
    presets["82"] = "HI";
    presets["1182"] = "HIKY";
    presets["2282"] = "2";
    presets["228291"] = "3";
    presets["11228291"] = "4";
    presets["1122818291"] = "5";
    presets["1121228291"] = "5_L";
    presets["112122818291"] = "6";
    presets["1121223171818291"] = "8";
    presets["11212231416171818291"] = "10";
    var preset = presets[diff.sort().join("")];
    if (preset == "HIRATE") {
        if (obj.initial.data.color == true) {
            obj.initial.preset = "HIRATE";
            delete obj.initial.data;
        }
    }
    else if (preset && obj.initial.data.color == false) {
        obj.initial.preset = preset;
        delete obj.initial.data;
    }
}
function samePiece(p1, p2) {
    return (typeof p1.color == "undefined" && typeof p2.color == "undefined") ||
        (typeof p1.color != "undefined" && typeof p2.color != "undefined" && p1.color == p2.color && p1.kind == p2.kind);
}
function restoreColorOfIllegalAction(moves) {
    if (moves.length >= 2 && moves[moves.length - 1].special == "ILLEGAL_ACTION") {
        moves[moves.length - 1].special = (moves[moves.length - 2] && moves[moves.length - 2].move && moves[moves.length - 2].move.color == false ? "-" : "+") + "ILLEGAL_ACTION";
    }
}