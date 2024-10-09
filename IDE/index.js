import { Post, PostEx } from "../Static/Libs/MyQuery.js";
const canvas = document.getElementById("main-code");
const context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
context.font = "12pt Consolas";
const textBaseline = context.measureText("ЁqgщуTQEI").fontBoundingBoxAscent;
const charHeight = context.measureText("ЁqgщуTQEI").fontBoundingBoxDescent + textBaseline;
const charWidth = (context.measureText("Щ").width + context.measureText(".").width) / 2;
window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Render();
};
const padding = 10;
// let prevCursorY = 0;
const cursors = [{ X: 0, Y: 0, ToX: 0, ToY: 0 }];
// let texts = ["function Func1(par$m1: string|number|$, param2 = 14, param3: number = 14): kek", "let in1 = 3151", "var in43:string|'ахуе'|351=624"];
// let texts = ["", "111111", "111111", "111111"];
let texts = [""];
const codeScroll = { X: 0, Y: 0 };
// let nextLocalClipboard = 0;
// const maxLocalClipboard = 10;
// const localClipboard: string[] = [];
const users = [
    { Id: 0, Name: "Egor", Color: "rgb(127, 0, 127)", Selection: { X: 3, Y: 7, ToX: 0, ToY: 1 } },
    { Id: 1, Name: "Masha", Color: "rgb(0, 127, 127)", Selection: { X: 3, Y: 41, ToX: 0, ToY: 1 } },
];
let logined = undefined;
let socket;
let hintScroll = 0;
const hints = [];
const keywords = ["char", "int", "string", "double", "float", "decimal", "if", "else", "let", "const", "Math", "while", "for", "of", "interface", "class", "return"];
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const testGroup = {
    Title: "Лол",
    ChildItems: [
        { Title: "Выполнить", Callback: ConnectFromEditor },
        { Title: "Быстро подключится", Callback: () => Connect(Date.now().toString().slice(-3)) },
        { Title: "Анализировать", Callback: Analyze },
        {
            Title: "Буфер обмена",
            ChildItems: [
                { Title: "Вырезать", Callback: print },
                { Title: "Копировать", Callback: print },
                {
                    Title: "Вставить",
                    Callback: () => {
                        navigator.clipboard.readText().then((t) => {
                            for (const cursor of cursors) {
                                const top = t.replaceAll("\t", "    ").replaceAll("\r", "").split("\n");
                                PasteTextTo(cursor.X, cursor.Y, ...top);
                                cursor.Y += top.length - 1;
                                cursor.X += top[top.length - 1].length;
                                cursor.ToX = cursor.X;
                                cursor.ToY = cursor.Y;
                            }
                            Render();
                        });
                    },
                },
                { Title: "Очистить", Callback: print },
            ],
        },
    ],
};
let tree = {
    Title: "Проект😀",
    Type: "Folder",
    Opened: false,
    Childs: [{ Title: "😀😀 А тут пусто 😀😀", Type: "File", Path: "" }],
};
Post("get-tree", {}, (res) => {
    tree = res;
    Render();
});
let lmbPressed = false;
let sideBarResizing = false;
const openedContextGroups = [];
let sideBarX = 1000;
const AVariables = [];
const AFunctions = [];
Math.clamp = (a, b, c) => {
    if (a < b)
        return b;
    if (a > c)
        return c;
    return a;
};
let selectedNode = 0;
let selectedNodeView;
let scrollPressed = false;
let scrollPressedOffset = 0;
const specSymbols = "!@#%^&*()_+-=[]{}\\|/\"'`?.,<>;:";
const spaceSymbols = " \n\r\t";
const uniqueSymbols = specSymbols + spaceSymbols;
canvas.addEventListener("keydown", (e) => {
    e.preventDefault();
    const lastCursor = cursors[cursors.length - 1];
    switch (e.code) {
        case "Escape": {
            canvas.blur();
            return;
        }
        case "F5": {
            location.reload();
            return;
        }
        case "ArrowUp":
            if (hints.length > 0) {
                hintScroll = Math.clamp(hintScroll - 1, 0, hints.length - 1);
            }
            else {
                if (e.shiftKey) {
                    for (const cursor of cursors) {
                        if (cursor.ToY === 0)
                            continue;
                        cursor.ToY--;
                        cursor.ToX = Math.min(cursor.X, texts[cursor.ToY]?.length ?? 0);
                    }
                }
                else {
                    for (const cursor of cursors) {
                        if (cursor.Y === 0)
                            continue;
                        cursor.Y = Math.max(0, cursor.Y - 1);
                        cursor.X = Math.min(cursor.X, texts[cursor.Y]?.length ?? 0);
                        cursor.ToX = cursor.X;
                        cursor.ToY = cursor.Y;
                    }
                }
            }
            break;
        case "ArrowDown":
            if (hints.length > 0) {
                hintScroll = Math.clamp(hintScroll + 1, 0, hints.length - 1);
            }
            else {
                if (e.shiftKey) {
                    for (const cursor of cursors) {
                        cursor.ToY++;
                        cursor.ToX = Math.max(0, texts[cursor.ToY]?.length ?? 0);
                    }
                }
                else {
                    for (const cursor of cursors) {
                        cursor.Y++;
                        cursor.ToY = cursor.Y;
                        cursor.X = Math.min(cursor.X, texts[cursor.Y]?.length ?? 0);
                        cursor.ToX = cursor.X;
                    }
                }
            }
            break;
        case "ArrowLeft": {
            if (e.shiftKey) {
                for (const cursor of cursors) {
                    if (cursor.ToX === 0 && cursor.ToY > 0) {
                        cursor.ToY--;
                        cursor.ToX = texts[cursor.ToY]?.length ?? 0;
                    }
                    else
                        cursor.ToX = Math.max(0, cursor.ToX - 1);
                }
                hints.length = 0;
            }
            else {
                for (const cursor of cursors) {
                    cursor.ToY = cursor.Y;
                    if (cursor.X === 0 && cursor.Y > 0) {
                        cursor.ToY = --cursor.Y;
                        cursor.X = texts[cursor.Y]?.length ?? 0;
                    }
                    else
                        cursor.X = Math.max(0, cursor.X - 1);
                    cursor.ToX = cursor.X;
                }
                if (lastCursor.X === 0)
                    hints.length = 0;
            }
            break;
        }
        case "ArrowRight": {
            if (e.shiftKey) {
                for (const cursor of cursors) {
                    cursor.ToX++;
                    if (cursor.ToY < texts.length && cursor.ToX > texts[cursor.ToY].length) {
                        cursor.ToY++;
                        cursor.ToX = 0;
                    }
                }
            }
            else
                for (const cursor of cursors) {
                    cursor.ToY = cursor.Y;
                    if (cursor.X >= (texts[cursor.Y]?.length ?? 0)) {
                        cursor.X = 0;
                        cursor.ToY = ++cursor.Y;
                    }
                    else
                        cursor.X++;
                    cursor.ToX = cursor.X;
                }
            break;
        }
        case "Delete": {
            for (let i = cursors.length - 1; i >= 0; i--) {
                const cursor = cursors[i];
                RemoveSelectionIfNeeded(cursor);
                if (texts[cursor.Y] === undefined || texts[cursor.Y].length === 0) {
                    for (let i = cursor.Y; i < texts.length - 1; i++)
                        texts[i] = texts[i + 1];
                    texts.length--;
                }
                else {
                    if (cursor.X === texts[cursor.Y].length && cursor.Y < texts.length - 1) {
                        texts[cursor.Y] += texts[cursor.Y + 1];
                        for (let i = cursor.Y + 1; i < texts.length - 1; i++)
                            texts[i] = texts[i + 1];
                        texts.length--;
                    }
                    else {
                        if (e.ctrlKey) {
                            let to = cursor.X + 1;
                            if (texts[cursor.Y][cursor.X + 1] === " ")
                                while (texts[cursor.Y][to] === " ")
                                    to++;
                            else
                                while (!specSymbols.includes(texts[cursor.Y][to]) && to >= 0)
                                    to++;
                            texts[cursor.Y] = texts[cursor.Y].substring(0, cursor.X) + texts[cursor.Y].substring(to);
                        }
                        else {
                            texts[cursor.Y] = texts[cursor.Y].substring(0, cursor.X) + texts[cursor.Y].substring(cursor.X + 1);
                        }
                    }
                }
                if (logined !== undefined)
                    socket.send(new Blob([new Uint8Array([2, logined.Id]), new Uint32Array([cursor.X, cursor.Y, 1_000_000_000])]));
            }
            break;
        }
        case "Backspace": {
            for (let i = cursors.length - 1; i >= 0; i--) {
                const cursor = cursors[i];
                if (cursor.X === 0 && cursor.Y === 0)
                    return;
                RemoveSelectionIfNeeded(cursor);
                if (texts[cursor.Y] === undefined || texts[cursor.Y].length === 0) {
                    for (let i = cursor.Y; i < texts.length - 1; i++)
                        texts[i] = texts[i + 1];
                    if (logined !== undefined)
                        socket.send(new Blob([new Uint8Array([3, logined.Id]), new Uint32Array([cursor.X, cursor.Y])]));
                    cursor.ToY = cursor.Y = Math.max(0, cursor.Y - 1);
                    cursor.ToX = cursor.X = texts[cursor.Y]?.length ?? 0;
                    texts.length--;
                }
                else {
                    if (cursor.X === 0) {
                        if (logined !== undefined)
                            socket.send(new Blob([new Uint8Array([3, logined.Id]), new Uint32Array([cursor.X, cursor.Y])]));
                        cursor.X = texts[cursor.Y - 1].length;
                        cursor.ToX = cursor.X;
                        texts[cursor.Y - 1] += texts[cursor.Y];
                        for (let i = cursor.Y; i < texts.length - 1; i++)
                            texts[i] = texts[i + 1];
                        cursor.Y--;
                        cursor.ToY = cursor.Y;
                        texts.length--;
                    }
                    else {
                        if (e.ctrlKey) {
                            let to = cursor.X - 2;
                            if (texts[cursor.Y][cursor.X - 1] === " ")
                                while (texts[cursor.Y][to] === " ")
                                    to--;
                            else
                                while (!specSymbols.includes(texts[cursor.Y][to]) && to >= 0)
                                    to--;
                            texts[cursor.Y] = texts[cursor.Y].substring(0, to + 1) + texts[cursor.Y].substring(cursor.X);
                            cursor.X = to + 1;
                            cursor.ToX = cursor.X;
                        }
                        else {
                            texts[cursor.Y] = texts[cursor.Y].substring(0, cursor.X - 1) + texts[cursor.Y].substring(cursor.X);
                            if (logined !== undefined)
                                socket.send(new Blob([new Uint8Array([3, logined.Id]), new Uint32Array([cursor.X, cursor.Y])]));
                            cursor.X--;
                            cursor.ToX = cursor.X;
                        }
                    }
                }
            }
            break;
        }
        case "Enter": {
            if (hints.length > 0) {
                let symb = lastCursor.X - 1;
                while (!uniqueSymbols.includes(texts[lastCursor.Y][symb]))
                    symb--;
                texts[lastCursor.Y] = texts[lastCursor.Y].slice(0, symb + 1) + hints[hintScroll] + texts[lastCursor.Y].slice(lastCursor.X);
                lastCursor.X = symb + 1 + hints[hintScroll].length;
                lastCursor.ToX = lastCursor.X;
                hints.length = 0;
                hintScroll = 0;
            }
            else
                for (let i = cursors.length - 1; i >= 0; i--) {
                    const cursor = cursors[i];
                    RemoveSelectionIfNeeded(cursor);
                    if (texts[cursor.Y] === undefined || cursor.X === texts[cursor.Y].length) {
                        cursor.X = Math.min(cursor.X, texts[cursor.Y + 1]?.length ?? 0);
                        cursor.ToX = cursor.X;
                        for (let i = texts.length; i > cursor.Y + 1; i--)
                            texts[i] = texts[i - 1];
                    }
                    else {
                        for (let i = texts.length; i > cursor.Y; i--)
                            texts[i] = texts[i - 1];
                        texts[cursor.Y + 1] = texts[cursor.Y].substring(cursor.X);
                        texts[cursor.Y] = texts[cursor.Y].substring(0, cursor.X);
                        cursor.X = 0;
                        cursor.ToX = cursor.X;
                        context.fillStyle = "#252525";
                        context.fillRect(0, padding + cursor.Y * charHeight, canvas.width, canvas.height); // back
                        context.fillStyle = "#FFFFFF";
                        for (let i = texts.length - 1; i > cursor.Y; i--) {
                            context.fillText(texts[i], padding, padding + textBaseline + i * charHeight); // text
                        }
                    }
                    cursor.Y++;
                    cursor.ToY = cursor.Y;
                }
            break;
        }
        case "Tab": {
            for (let i = cursors.length - 1; i >= 0; i--) {
                const cursor = cursors[i];
                RemoveSelectionIfNeeded(cursor);
                if (texts[cursor.Y] === undefined) {
                    texts[cursor.Y] = "    ";
                    for (let i = cursor.Y - 1; texts[i] === undefined; i--)
                        texts[i] = "";
                }
                else
                    texts[cursor.Y] = texts[cursor.Y].substring(0, cursor.X) + "    " + texts[cursor.Y].substring(cursor.X);
                cursor.X += 4;
                cursor.ToX = cursor.X;
                if (logined !== undefined)
                    socket.send(new Blob([new Uint8Array([2, logined.Id]), new Uint32Array([cursor.X, cursor.Y, 1_000_000_001])]));
            }
            break;
        }
        default: {
            if (e.ctrlKey) {
                switch (e.code) {
                    case "KeyV": {
                        if (e.ctrlKey) {
                            navigator.clipboard.readText().then((t) => {
                                for (const cursor of cursors) {
                                    const top = t.replaceAll("\t", "    ").replaceAll("\r", "").split("\n");
                                    PasteTextTo(cursor.X, cursor.Y, ...top);
                                    cursor.Y += top.length - 1;
                                    cursor.X += top[top.length - 1].length;
                                    cursor.ToX = cursor.X;
                                    cursor.ToY = cursor.Y;
                                }
                                Render();
                            });
                        }
                        break;
                    }
                    case "KeyC": {
                        if (e.ctrlKey) {
                            // localClipboard[nextLocalClipboard] = nextLocalClipboard.toString();
                            // nextLocalClipboard = (nextLocalClipboard + 1) % maxLocalClipboard;
                            // PasteTextTo(0, 10, )
                            // const lastCursor = cursors[cursors.length - 1];
                            // const fromto = lastCursor.X > lastCursor.ToX ? [lastCursor.ToX, lastCursor.X] : [lastCursor.X, lastCursor.ToX];
                            // texts[10] = texts[lastCursor.Y].slice(fromto[0], fromto[1]);
                            // Render();
                            // navigator.clipboard.writeText();
                        }
                        break;
                    }
                    case "KeyA": {
                        cursors.length = 1;
                        const cursor = cursors[0];
                        cursor.X = 0;
                        cursor.Y = 0;
                        cursor.ToY = texts.length - 1;
                        cursor.ToX = texts[texts.length - 1].length;
                        Render();
                        break;
                    }
                }
                return;
            }
            if (e.key.length > 1)
                return;
            for (let i = cursors.length - 1; i >= 0; i--) {
                const cursor = cursors[i];
                RemoveSelectionIfNeeded(cursor);
                const toInsert = e.key;
                if (texts[cursor.Y] === undefined) {
                    texts[cursor.Y] = " ".repeat(cursor.X) + toInsert;
                    for (let i = cursor.Y - 1; texts[i] === undefined; i--)
                        texts[i] = "";
                }
                else {
                    if (cursor.X > texts[cursor.Y].length)
                        texts[cursor.Y] += " ".repeat(cursor.X - texts[cursor.Y].length);
                    texts[cursor.Y] = texts[cursor.Y].substring(0, cursor.X) + toInsert + texts[cursor.Y].substring(cursor.X);
                }
                if (logined !== undefined)
                    socket.send(new Blob([new Uint8Array([2, logined.Id]), new Uint32Array([cursor.X, cursor.Y]), textEncoder.encode(toInsert)]));
                cursor.X++;
                cursor.ToX = cursor.X;
            }
            if (!uniqueSymbols.includes(texts[lastCursor.Y][lastCursor.X - 1])) {
                // let word: string;
                let symb = lastCursor.X - 1;
                while (!uniqueSymbols.includes(texts[lastCursor.Y][symb]) && symb > 0)
                    symb--;
                const word = texts[lastCursor.Y].slice(symb + 1, lastCursor.X);
                if (word.length > 0) {
                    hints.length = 0;
                    let maxLength = 0;
                    for (const hint of keywords)
                        if (hint.toLowerCase().startsWith(word)) {
                            hints.push(hint);
                            if (hint.length > maxLength)
                                maxLength = hint.length;
                        }
                    for (const hint of AVariables)
                        if (hint.Name.toLowerCase().startsWith(word)) {
                            hints.push(hint.Name);
                            if (hint.Name.length > maxLength)
                                maxLength = hint.Name.length;
                        }
                    for (const hint of AFunctions)
                        if (hint.Name.toLowerCase().startsWith(word)) {
                            hints.push(hint.Name);
                            if (hint.Name.length > maxLength)
                                maxLength = hint.Name.length;
                        }
                }
            }
        }
    }
    Render();
});
canvas.addEventListener("mouseleave", () => {
    sideBarResizing = false;
    lmbPressed = false;
    scrollPressed = false;
});
canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (e.button === 0) {
        const leng = Math.max(50, (canvas.height - padding * 2) / texts.length);
        const p = padding + Math.min(canvas.height - padding * 2 - leng, canvas.height * (codeScroll.Y / texts.length));
        if (e.x > sideBarX - 10 - 5 && e.x <= sideBarX - 10 - 5 + 10 && e.y > p && e.y <= p + leng) {
            scrollPressed = true;
            scrollPressedOffset = p - e.y;
            return;
        }
        if (e.x > sideBarX - 4) {
            if (e.x <= sideBarX + 2)
                sideBarResizing = true;
            else {
                if (selectedNodeView.Type === "Folder") {
                    selectedNodeView.Opened = !selectedNodeView.Opened;
                    Render();
                }
                else {
                    PostEx("get-file", { Path: selectedNodeView.Path }, (res, resType) => {
                        if (resType === "text") {
                            texts = res.replaceAll("\t", "    ").split("\n");
                            codeScroll.Y = 0;
                            Render();
                        }
                        else {
                            const dw = new DataView(res);
                            const bytesPerLine = 32;
                            for (let i = 0; i < dw.byteLength / bytesPerLine; i++)
                                texts[i] = "";
                            for (let i = 0; i < dw.byteLength; i += 2) {
                                const line = Math.floor(i / bytesPerLine);
                                const hexByte = dw.getUint16(i).toString(16).toUpperCase();
                                if (hexByte.length === 2)
                                    texts[line] += `0${hexByte[0]}0${hexByte[1]} `;
                                else if (hexByte.length === 3)
                                    texts[line] += `0${hexByte} `;
                                else
                                    texts[line] += `${hexByte} `;
                            }
                            codeScroll.Y = 0;
                            Render();
                        }
                    });
                }
            }
            return;
        }
        lmbPressed = true;
        if (openedContextGroups.length > 0) {
            for (let i = 0; i < openedContextGroups.length; i++) {
                const group = openedContextGroups[i];
                if (group.Selected !== undefined) {
                    const item = group.Group.ChildItems[group.Selected];
                    if (!IsGroup(item)) {
                        item.Callback();
                        break;
                    }
                }
            }
            openedContextGroups.length = 0;
        }
        else {
            const x = Math.clamp(Math.floor((e.x - padding * 4) / charWidth), 0, 9999999);
            const y = Math.clamp(Math.floor((e.y - padding) / charHeight), 0, 9999999) + codeScroll.Y;
            if (e.altKey) {
                const newSelection = {
                    X: x,
                    Y: y,
                    ToX: x,
                    ToY: y,
                };
                cursors.push(newSelection);
                if (logined !== undefined)
                    socket.send(new Blob([new Uint8Array([1, logined.Id]), new Uint32Array([newSelection.X, newSelection.Y, newSelection.ToX, newSelection.ToY])]));
            }
            else {
                cursors.splice(1);
                cursors[0].X = x;
                cursors[0].Y = y;
                cursors[0].ToX = cursors[0].X;
                cursors[0].ToY = y;
                if (logined !== undefined)
                    socket.send(new Blob([new Uint8Array([1, logined.Id]), new Uint32Array([cursors[0].X, cursors[0].Y, cursors[0].ToX, cursors[0].ToY])]));
            }
        }
        Render();
    }
});
canvas.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
        sideBarResizing = false;
        lmbPressed = false;
        scrollPressed = false;
    }
});
canvas.addEventListener("mousemove", (e) => {
    if (scrollPressed) {
        codeScroll.Y = Math.round(((Math.clamp(e.y + scrollPressedOffset, padding, canvas.height - padding * 2) - padding) / (canvas.height - padding * 2 + scrollPressedOffset)) * texts.length);
        // texts[41] = ((Math.clamp(e.y, padding, canvas.height - padding * 2) - padding) / (canvas.height - padding * 2)).toString();
        Render();
        return;
    }
    else {
        const leng = Math.max(50, (canvas.height - padding * 2) / texts.length);
        const p = padding + Math.min(canvas.height - padding * 2 - leng, canvas.height * Math.max(0, (codeScroll.Y - Math.ceil((canvas.height - padding) / charHeight)) / texts.length));
        if (e.x > sideBarX - 10 - 5 && e.x <= sideBarX - 10 - 5 + 10 && e.y > p && e.y <= p + leng) {
            canvas.style.cursor = "";
            return;
        }
    }
    if (openedContextGroups.length > 0) {
        for (let i = 0; i < openedContextGroups.length; i++) {
            const group = openedContextGroups[i];
            if (e.x >= group.X + 4 && e.x < group.X + group.Width && e.y >= group.Y + 4 && e.y < group.Y + group.Group.ChildItems.length * charHeight + 4) {
                const itemNumber = Math.floor((e.y - (group.Y + 4)) / charHeight);
                if (itemNumber === group.Selected)
                    break;
                group.Selected = itemNumber;
                if (openedContextGroups.length > i && !IsGroup(group.Group.ChildItems[group.Selected]))
                    openedContextGroups.splice(i + 1);
                Render();
                DrawContextGroup();
            }
            else if (group.Selected !== undefined && openedContextGroups.length - 2 < i) {
                group.Selected = undefined;
                openedContextGroups.splice(i + 1);
                Render();
                DrawContextGroup();
                break;
            }
        }
    }
    if (lmbPressed) {
        const last = cursors.length - 1;
        const x = Math.clamp(Math.floor((e.x - padding * 4) / charWidth), 0, 9999999);
        // const y = Math.abs(cursors[last].Y - Math.clamp(Math.floor((e.y - padding) / charHeight) + codeScroll.Y, 0, 9999999)) + 1;
        const y = Math.abs(Math.clamp(Math.floor((e.y - padding) / charHeight) + codeScroll.Y, 0, 9999999));
        if (cursors[last].ToX === x && cursors[last].ToY === y)
            return;
        cursors[last].ToX = x;
        cursors[last].ToY = y;
        // if (cursors[last].ToY < cursors[last].Y) [cursors[last].ToY, cursors[last].Y] = [cursors[last].Y, cursors[last].ToY];
        // texts[0] = `${cursors[last].Y.toString()} -> ${cursors[last].ToY.toString()}`;
        // cursors[last].Y = y
        // cursors[last].Height = Math.abs()
        // if (cursors[last].ToX < cursors[last].X) [cursors[last].ToX, cursors[last].X] = [cursors[last].X, cursors[last].ToX];
        Render();
        return;
    }
    if (sideBarResizing) {
        sideBarX = e.x;
        Render();
        return;
    }
    if (e.x > sideBarX - 4) {
        if (e.x <= sideBarX + 2)
            canvas.style.cursor = "ew-resize";
        else {
            canvas.style.cursor = "pointer";
            const prevS = selectedNode;
            selectedNode = Math.floor((padding + e.y) / charHeight);
            if (prevS !== selectedNode)
                Render();
        }
    }
    else {
        canvas.style.cursor = "text";
        if (selectedNode > 0) {
            selectedNode = 0;
            Render();
        }
        selectedNode = 0;
    }
});
canvas.addEventListener("wheel", (e) => {
    codeScroll.Y += Math.sign(e.deltaY) * 4;
    if (codeScroll.Y < 0) {
        codeScroll.Y = 0;
        return;
    }
    Render();
    if (openedContextGroups.length > 0)
        DrawContextGroup();
    e.preventDefault();
});
canvas.oncontextmenu = (e) => {
    Render();
    openedContextGroups[0] = {
        X: e.x,
        Y: e.y,
        Group: testGroup,
    };
    DrawContextGroup();
    return false;
};
function RemoveSelectionIfNeeded(cursor) {
    if (cursor.X === cursor.ToX && cursor.Y === cursor.ToY)
        return;
    const startX = Math.min(cursor.X, cursor.ToX);
    const endX = Math.max(cursor.ToX, cursor.X);
    const startY = Math.min(cursor.Y, cursor.ToY);
    const endY = Math.min(Math.max(cursor.ToY, cursor.Y), texts.length - 1);
    if (startY >= texts.length) {
        cursor.ToY = cursor.Y = startY;
        cursor.ToX = cursor.X = startX;
        return;
    }
    texts[startY] = texts[startY].substring(0, startX) + texts[endY].substring(endX);
    for (let i = startY + 1; i < texts.length - (endY - startY); i++)
        texts[i] = texts[i + endY - startY];
    texts.length -= endY - startY;
    cursor.ToX = cursor.X = startX;
    cursor.ToY = cursor.Y = startY;
}
// function DrawCursor() {
// 	for (const cursor of cursors) {
// 		context.fillStyle = "#252525";
// 		context.fillRect(padding * 4, padding + prevCursorY * textHeight, canvas.width, textHeight); // back
// 		if (prevCursorY < texts.length) {
// 			context.fillStyle = "#FFFFFF";
// 			context.fillText(texts[prevCursorY], padding * 4, padding + textBaseline + prevCursorY * textHeight); // text
// 		}
// 		context.fillStyle = "#383838";
// 		context.fillRect(0, padding + cursors.Y * textHeight, canvas.width, textHeight); // line selection
// 		if (cursors.Y < texts.length) {
// 			context.fillStyle = "#FFFFFF";
// 			context.fillText(texts[cursors.Y], padding * 4, padding + textBaseline + cursors.Y * textHeight); // text
// 		}
// 		context.fillStyle = "rgb(200, 200, 200)";
// 		context.fillText((cursors.Y - codeScroll.Y).toString(), padding + charWidth * (3 - (cursors.Y - codeScroll.Y).toString().length), padding + textBaseline + cursors.Y * textHeight); // line number
// 		context.fillStyle = "#00FF00";
// 		context.fillRect(padding * 4 + cursors.X * charWidth, padding + cursors.Y * textHeight, 1, textHeight); // cursor
// 		if (cursors.ToY > 1 || cursors.ToX > 0) {
// 			context.strokeStyle = "#00FF00";
// 			context.lineWidth = 2;
// 			context.beginPath();
// 			context.moveTo(padding * 4 + cursors.X * charWidth, padding + cursors.Y * textHeight);
// 			context.lineTo(padding * 4 + (cursors.X + cursors.ToX) * charWidth, padding + cursors.Y * textHeight);
// 			context.moveTo(padding * 4 + (cursors.X + cursors.ToX) * charWidth, padding + cursors.Y * textHeight);
// 			context.lineTo(padding * 4 + (cursors.X + cursors.ToX) * charWidth, padding + (cursors.Y + cursors.ToY) * textHeight);
// 			context.moveTo(padding * 4 + (cursors.X + cursors.ToX) * charWidth, padding + (cursors.Y + cursors.ToY) * textHeight);
// 			context.lineTo(padding * 4 + cursors.X * charWidth, padding + (cursors.Y + cursors.ToY) * textHeight);
// 			context.moveTo(padding * 4 + cursors.X * charWidth, padding + (cursors.Y + cursors.ToY) * textHeight);
// 			context.lineTo(padding * 4 + cursors.X * charWidth, padding + cursors.Y * textHeight + 2);
// 			context.stroke();
// 		}
// 		prevCursorY = cursors.Y;
// 	}
// }
// function PasteText(...lines: string[]) {
// 	for (const cursor of cursors) PasteTextTo(cursor.X, cursor.Y, ...lines);
// 	Render();
// }
function PasteTextTo(x, y, ...lines) {
    for (let i = y - 1; texts[i] === undefined && i >= 0; i--)
        texts[i] = "";
    texts[y] ??= " ".repeat(x);
    const start = texts[y].substring(0, x);
    const end = texts[y].substring(x);
    for (let i = texts.length - 1 + (lines.length - 1); i > y + (lines.length - 1); i--)
        texts[i] = texts[i - (lines.length - 1)];
    for (let i = 1; i < lines.length - 1; i++)
        texts[y + i] = lines[i];
    if (lines.length > 1) {
        texts[y] = start + lines[0];
        texts[y + (lines.length - 1)] = lines[lines.length - 1] + end;
    }
    else
        texts[y] = start + lines[0] + end;
}
// DrawCursor();
const blinkToOn = () => setTimeout(() => {
    context.fillStyle = "#00FF00";
    for (const cursor of cursors)
        context.fillRect(padding * 4 + cursor.ToX * charWidth, padding + (cursor.ToY - codeScroll.Y) * charHeight, 1, charHeight); // cursor
    blinkToOff();
}, 1000);
const blinkToOff = () => setTimeout(() => {
    context.fillStyle = "#003800";
    for (const cursor of cursors)
        context.fillRect(padding * 4 + cursor.ToX * charWidth, padding + (cursor.ToY - codeScroll.Y) * charHeight, 1, charHeight); // cursor
    blinkToOn();
}, 700);
blinkToOff();
function Render() {
    context.font = "12pt Consolas";
    context.fillStyle = "#181818";
    context.fillRect(0, 0, canvas.width, canvas.height); // back
    const linesToRender = Math.ceil((canvas.height - padding * 2) / charHeight);
    // const linesToRender = 20;
    context.fillStyle = "#383838";
    context.fillRect(0, 0, padding * 4, canvas.height); // line number background
    // Selection
    context.fillStyle = "#38797e";
    context.strokeStyle = "#38797e";
    context.lineWidth = 2;
    for (const cursor of cursors) {
        if (cursor.Y - codeScroll.Y >= -1 && cursor.Y - codeScroll.Y < linesToRender) {
            if (cursor.ToY === cursor.Y) {
                context.fillStyle = "#292929";
                context.fillRect(0, padding + (cursor.Y - codeScroll.Y) * charHeight, canvas.width, charHeight);
                context.fillStyle = "#38797e";
                context.fillRect(padding * 4 + cursor.X * charWidth, padding + (cursor.Y - codeScroll.Y) * charHeight, (cursor.ToX - cursor.X) * charWidth, charHeight);
            }
            else {
                const start = Math.min(cursor.Y, cursor.ToY);
                const end = Math.max(cursor.Y, cursor.ToY);
                const startx = cursor.Y < cursor.ToY ? cursor.X : cursor.ToX;
                const endx = cursor.Y < cursor.ToY ? cursor.ToX : cursor.X;
                if (texts.length > start) {
                    if (texts[start].length === 0) {
                        context.beginPath();
                        context.moveTo(padding * 4 + charWidth / 2, padding + (start - codeScroll.Y) * charHeight);
                        context.lineTo(padding * 4 + charWidth / 2, padding + (start + 1 - codeScroll.Y) * charHeight);
                        context.lineTo(padding * 4 + charWidth, padding + (start + 0.5 - codeScroll.Y) * charHeight);
                        context.moveTo(padding * 4 + charWidth / 2, padding + (start + 1 - codeScroll.Y) * charHeight);
                        context.lineTo(padding * 4, padding + (start + 0.5 - codeScroll.Y) * charHeight);
                        context.stroke();
                    }
                    else
                        context.fillRect(padding * 4 + startx * charWidth, padding + (start - codeScroll.Y) * charHeight, (texts[start].length - startx) * charWidth, charHeight);
                }
                else
                    context.fillRect(padding * 4 + startx * charWidth, padding + (start - codeScroll.Y) * charHeight, canvas.width, charHeight);
                for (let i = start + 1; i < end; i++) {
                    // if (texts.length > start + i) {
                    // 	if (texts[start + i].length === 0) {
                    // 		context.beginPath();
                    // 		context.moveTo(padding * 4 + charWidth / 2, padding + (start + i - codeScroll.Y) * charHeight);
                    // 		context.lineTo(padding * 4 + charWidth / 2, padding + (start + i + 1 - codeScroll.Y) * charHeight);
                    // 		context.lineTo(padding * 4 + charWidth, padding + (start + i + 0.5 - codeScroll.Y) * charHeight);
                    // 		context.moveTo(padding * 4 + charWidth / 2, padding + (start + i + 1 - codeScroll.Y) * charHeight);
                    // 		context.lineTo(padding * 4, padding + (start + i + 0.5 - codeScroll.Y) * charHeight);
                    // 		context.stroke();
                    // 	} else context.fillRect(padding * 4, padding + (start + i - codeScroll.Y) * charHeight, texts[start].length * charWidth, charHeight);
                    // } else context.fillRect(padding * 4, padding + (start + i - codeScroll.Y) * charHeight, 99999 * charWidth, charHeight);
                    const line = i - codeScroll.Y;
                    const text = texts[i];
                    if (text === undefined || text.length === 0) {
                        // const offset = charWidth * Math.round((startx + endx) / 2);
                        const offset = 0;
                        context.beginPath();
                        context.moveTo(padding * 4 + charWidth / 2 + offset, padding + line * charHeight);
                        context.lineTo(padding * 4 + charWidth / 2 + offset, padding + (line + 1) * charHeight);
                        context.lineTo(padding * 4 + charWidth + offset, padding + (line + 0.5) * charHeight);
                        context.moveTo(padding * 4 + charWidth / 2 + offset, padding + (line + 1) * charHeight);
                        context.lineTo(padding * 4 + offset, padding + (line + 0.5) * charHeight);
                        context.stroke();
                    }
                    else
                        context.fillRect(padding * 4, padding + line * charHeight, text.length * charWidth, charHeight);
                    // context.fillRect(padding * 4, padding + (start + i - codeScroll.Y) * charHeight, (texts[start + i]?.length ?? 9999 - startx) * charWidth, charHeight);
                }
                // if (texts.length > start + (cursor.Height - 1)) {
                // 	if (texts[start + (cursor.Height - 1)].length === 0) {
                // 		context.beginPath();
                // 		context.moveTo(padding * 4 + charWidth / 2, padding + (start + (cursor.Height - 1) - codeScroll.Y) * charHeight);
                // 		context.lineTo(padding * 4 + charWidth / 2, padding + (start + (cursor.Height - 1) + 1 - codeScroll.Y) * charHeight);
                // 		context.lineTo(padding * 4 + charWidth, padding + (start + (cursor.Height - 1) + 0.5 - codeScroll.Y) * charHeight);
                // 		context.moveTo(padding * 4 + charWidth / 2, padding + (start + (cursor.Height - 1) + 1 - codeScroll.Y) * charHeight);
                // 		context.lineTo(padding * 4, padding + (start + (cursor.Height - 1) + 0.5 - codeScroll.Y) * charHeight);
                // 		context.stroke();
                // 	} else context.fillRect(padding * 4, padding + (start + (cursor.Height - 1) - codeScroll.Y) * charHeight, endx * charWidth, charHeight);
                // } else
                context.fillRect(padding * 4, padding + (end - codeScroll.Y) * charHeight, endx * charWidth, charHeight);
                // context.fillRect(padding * 4, padding + (cursor.Y + (cursor.Height - 1) - codeScroll.Y) * charHeight, cursor.ToX * charWidth, charHeight);
                // context.translate(-0.5, -0.5);
            }
        }
    }
    // Selection
    for (const user of users) {
        if (user.Selection !== undefined && user.Selection.Y - codeScroll.Y >= -1 && user.Selection.Y - codeScroll.Y < linesToRender) {
            context.fillStyle = user.Color;
            context.fillRect(0, padding + (user.Selection.Y - codeScroll.Y) * charHeight, padding * 4, charHeight); // line number back
        }
    }
    const red = ["char", "int", "string", "double", "float", "decimal", "decimal1", "decimal2", "decimal3", "bool", "readonly", "byte", "List", "number", "of"];
    const blue = ["for", "if", "while", "else", "then", "const", "var", "let", "as", "public", "private", "import", "from", "type", "function", "export"];
    const green = ["var1", "var2", "var3"];
    const yellow = "({[)}]\"'0123456789`";
    const pink = "*+/-&|.";
    const maxColoredLength = Math.max(red.length, green.length, blue.length);
    for (let i = codeScroll.Y > 0 ? -1 : 0; i < linesToRender; i++) {
        const l = i + codeScroll.Y;
        context.fillStyle = "rgb(200, 200, 200)";
        context.fillText((l + 1).toString(), padding + charWidth * (3 - (l + 1).toString().length), padding + textBaseline + i * charHeight); // line number
        if (texts[l] !== undefined) {
            let start = 0;
            let stringStarted = false;
            for (let j = 0; j < texts[l].length; j++) {
                if (texts[l][j] === " ") {
                    if (stringStarted) {
                        // stringStarted = false;
                        // context.fillStyle = "#FFFF00";
                        // context.fillText(texts[l].slice(start, j), padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        // start = j;
                        continue;
                    }
                    else if (j == texts[l].length - 1 || start < j) {
                        context.fillStyle = "#FFFFFF";
                        context.fillText(texts[l].slice(start, j), padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        start = j;
                    }
                    start++;
                    // context.fillStyle = "#999999";
                    // context.beginPath();
                    // context.ellipse(padding * 4 + charWidth * (j + 0.5), padding + charHeight * (i + 0.5), charHeight / 8, charHeight / 8, 0, 0, Math.PI * 2);
                    // context.fill();
                    continue;
                }
                const word = texts[l].slice(start, j + 1);
                if (stringStarted) {
                    if ("\"'`".includes(texts[l][j]) || j === texts[l].length - 1) {
                        stringStarted = false;
                        context.fillStyle = "#FFFF00";
                        context.fillText(word, padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        start = j + 1;
                    }
                    continue;
                }
                else if (" []{}()./,:;|`'\"`=-\\!@#%^&*".includes(texts[l][j + 1]) || word.length === 1 || j === texts[l].length - 1) {
                    if (word === "/" && texts[l][j + 1] === "/" && !stringStarted) {
                        context.fillStyle = "#6d6d6d";
                        context.fillText(texts[l].substring(j), padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        break;
                    }
                    else if (red.includes(word)) {
                        context.fillStyle = "#FF0000";
                        context.fillText(word, padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        start = j + 1;
                        continue;
                    }
                    else if (green.includes(word)) {
                        context.fillStyle = "#00FF00";
                        context.fillText(word, padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        start = j + 1;
                        continue;
                    }
                    else if (blue.includes(word)) {
                        context.fillStyle = "#0000FF";
                        context.fillText(word, padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        start = j + 1;
                        continue;
                    }
                    else if (yellow.includes(word)) {
                        context.fillStyle = "#FFFF00";
                        context.fillText(word, padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        if ("\"'`".includes(word)) {
                            stringStarted = !stringStarted;
                        }
                        start = j + 1;
                        continue;
                    }
                    else if (pink.includes(word)) {
                        context.fillStyle = "#FF00FF";
                        context.fillText(word, padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        start = j + 1;
                        continue;
                    }
                    else if (" []{}()./,:;`|'\"`=-\\!@#%^&*".includes(texts[l][j + 1])) {
                        context.fillStyle = "#FFFFFF";
                        context.fillText(word, padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                        start = j + 1;
                        continue;
                    }
                }
                if (word.length > maxColoredLength || j == texts[l].length - 1) {
                    context.fillStyle = "#FFFFFF";
                    context.fillText(word, padding * 4 + charWidth * start, padding + i * charHeight + textBaseline);
                    start = j + 1;
                }
            }
        }
    }
    if (hints.length > 0) {
        const lastCursor = cursors[cursors.length - 1];
        // if (lastCursor.X > 0 && lastCursor.X === lastCursor.ToX && lastCursor.Y === lastCursor.ToY) {
        if (!uniqueSymbols.includes(texts[lastCursor.Y][lastCursor.X - 1])) {
            // let word: string;
            let symb = lastCursor.X - 1;
            while (!uniqueSymbols.includes(texts[lastCursor.Y][symb]))
                symb--;
            const word = texts[lastCursor.Y].slice(symb + 1, lastCursor.X);
            const width = (hints.reduce((p, c) => (p.length > c.length ? p : c)).length + 3) * charWidth;
            // Background
            context.fillStyle = "rgba(0,0,0, .75)";
            context.strokeStyle = "#FFFFFF";
            context.beginPath();
            context.rect(padding * 4 + (lastCursor.X - word.length) * charWidth, padding + (lastCursor.Y - hintScroll) * charHeight, width, charHeight * hints.length);
            context.stroke();
            context.fill();
            // word continue
            context.fillStyle = "rgb(175, 175, 175)";
            context.fillText(hints[hintScroll].slice(word.length), padding * 4 + lastCursor.X * charWidth, padding + textBaseline + lastCursor.Y * charHeight);
            // word
            context.fillStyle = "#FFFFFF";
            context.fillText(word, padding * 4 + (lastCursor.X - word.length) * charWidth, padding + textBaseline + lastCursor.Y * charHeight);
            // hints above
            for (let i = 0; i < hintScroll; i++)
                context.fillText(hints[i], padding * 4 + (lastCursor.X - word.length) * charWidth, padding + textBaseline + (lastCursor.Y + i - hintScroll) * charHeight);
            // hints below
            for (let i = hintScroll + 1; i < hints.length; i++)
                context.fillText(hints[i], padding * 4 + (lastCursor.X - word.length) * charWidth, padding + textBaseline + (lastCursor.Y + i - hintScroll) * charHeight);
            for (const AVar of AVariables) {
                if (AVar.Name === hints[hintScroll]) {
                    // background
                    context.fillStyle = "rgba(0,0,0, .75)";
                    context.strokeStyle = "#FFFFFF";
                    context.beginPath();
                    context.rect(padding * 4 + (lastCursor.X - word.length + 1) * charWidth + width, padding + lastCursor.Y * charHeight, 300, charHeight * 2);
                    context.stroke();
                    context.fill();
                    const q = `${AVar.Type}${AVar.Value === undefined ? "" : `${" ".repeat(AVar.Name.length)}  = ${AVar.Value}`}`;
                    context.fillStyle = "#FFFFFF";
                    context.fillText(q, padding * 4 + (lastCursor.X - word.length + 2) * charWidth + width, padding + textBaseline + lastCursor.Y * charHeight);
                    context.fillText(`Scripts.cs (${AVar.Position.Y + 1})`, padding * 4 + (lastCursor.X - word.length + 2) * charWidth + width, padding + textBaseline + (lastCursor.Y + 1) * charHeight);
                    context.fillStyle = "#f7ff80";
                    context.fillText(AVar.Name, padding * 4 + (lastCursor.X - word.length + 2 + AVar.Type.length + 1) * charWidth + width, padding + textBaseline + lastCursor.Y * charHeight);
                    break;
                }
            }
            for (const AFunc of AFunctions) {
                if (AFunc.Name === hints[hintScroll]) {
                    // background
                    context.fillStyle = "rgba(0,0,0, .75)";
                    context.strokeStyle = "#FFFFFF";
                    context.beginPath();
                    context.rect(padding * 4 + (lastCursor.X - word.length + 1) * charWidth + width, padding + lastCursor.Y * charHeight, 400, charHeight * (AFunc.Parameters.length + 1));
                    context.stroke();
                    context.fill();
                    const q = `${AFunc.Export === undefined ? "" : "[открытая] "}${AFunc.ReturnType} ${AFunc.Name}`;
                    context.fillStyle = "#FFFFFF";
                    context.fillText(q, padding * 4 + (lastCursor.X - word.length + 2) * charWidth + width, padding + textBaseline + lastCursor.Y * charHeight);
                    for (let i = 0; i < AFunc.Parameters.length; i++) {
                        const param = AFunc.Parameters[i];
                        context.fillText(`${param.Type} ${param.Name}${param.Default === undefined ? "" : ` ?= ${param.Default}`}`, padding * 4 + (lastCursor.X - word.length + q.length + 3) * charWidth + width, padding + textBaseline + (lastCursor.Y + i) * charHeight);
                    }
                    context.fillText(`Scripts.cs -> ${AFunc.Position.Y + 1}`, padding * 4 + (lastCursor.X - word.length + 2) * charWidth + width, padding + textBaseline + (lastCursor.Y + AFunc.Parameters.length) * charHeight);
                    // context.fillStyle = "#f7ff80";
                    // context.fillText(
                    // 	AVar.Name,
                    // 	padding * 4 + (lastCursor.X - word.length + 2 + AVar.Type.length + 1) * charWidth + width,
                    // 	padding + textBaseline + lastCursor.Y * charHeight,
                    // );
                    break;
                }
            }
            for (const keyword of keywords) {
                if (keyword === hints[hintScroll]) {
                    // background
                    context.fillStyle = "rgba(0,0,0, .75)";
                    context.strokeStyle = "#FFFFFF";
                    context.beginPath();
                    context.rect(padding * 4 + (lastCursor.X - word.length + 1) * charWidth + width, padding + lastCursor.Y * charHeight, 300, charHeight);
                    context.stroke();
                    context.fill();
                    context.fillStyle = "#FFFFFF";
                    context.fillText("Ключевое слово", padding * 4 + (lastCursor.X - word.length + 2) * charWidth + width, padding + textBaseline + lastCursor.Y * charHeight);
                    break;
                }
            }
        }
    }
    // context.lineWidth = 2;
    // context.strokeStyle = "#00FF00";
    context.fillStyle = "#00FF00";
    for (const cursor of cursors) {
        if (cursor.Y - codeScroll.Y >= -1 && cursor.Y - codeScroll.Y < linesToRender) {
            context.fillRect(padding * 4 + cursor.ToX * charWidth, padding + (cursor.ToY - codeScroll.Y) * charHeight, 1, charHeight); // cursor
        }
    }
    // const leng = Math.max(50, (canvas.height - padding * 2) * (linesToRender / Math.max(linesToRender, texts.length)));
    const leng = (canvas.height - padding * 2) * (linesToRender / Math.max(linesToRender, texts.length));
    const p = padding + (texts.length <= linesToRender || codeScroll.Y === 0 ? 0 : (canvas.height - padding * 2) * (Math.min(texts.length - linesToRender, codeScroll.Y) / texts.length));
    context.fillStyle = "#ffffff1f";
    context.beginPath();
    context.roundRect(sideBarX - 10 - 5, p, 10, leng, 4);
    context.fill();
    context.fillStyle = "#252525";
    context.fillRect(sideBarX, 0, canvas.width - sideBarX, canvas.height);
    context.fillStyle = "#383838";
    context.fillRect(sideBarX, 0, 2, canvas.height);
    const offset = 8;
    const shadow = context.createLinearGradient(sideBarX - offset, canvas.height / 2, sideBarX, canvas.height / 2);
    shadow.addColorStop(0, "rgba(0, 0, 0, 0)");
    shadow.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    context.fillStyle = shadow;
    context.fillRect(sideBarX - offset, 0, offset, canvas.height);
    DrawFolder(tree);
    const lastCursor = cursors[cursors.length - 1];
    let text = "";
    if (cursors.length > 1)
        text = `Последнее: `;
    if (lastCursor.X === lastCursor.ToX && lastCursor.Y === lastCursor.ToY)
        text += `${Math.min(lastCursor.Y, lastCursor.ToY)}:${Math.min(lastCursor.X, lastCursor.ToX)}`;
    else {
        let count = 0;
        for (let i = Math.min(lastCursor.Y, lastCursor.ToY); i <= Math.max(lastCursor.Y, lastCursor.ToY); i++)
            count += texts[i]?.length ?? 0;
        text += `${Math.min(lastCursor.Y, lastCursor.ToY)}:${Math.min(lastCursor.X, lastCursor.ToX)} -> ${Math.max(lastCursor.Y, lastCursor.ToY)}:${Math.max(lastCursor.X, lastCursor.ToX)} (${count})`;
    }
    context.fillStyle = "rgba(37, 37, 37, .5)";
    context.fillRect(canvas.width - charWidth * text.length - charWidth * 2, canvas.height - padding - charHeight, canvas.width, charHeight);
    context.fillStyle = "#FFFFFF";
    context.fillText(text, canvas.width - charWidth * text.length - charWidth, canvas.height - padding);
}
function Analyze() {
    const subLine = texts.join(" ");
    // texts.forEach((line, lineNumber) => {
    // line.split(";").forEach((subLine) => {
    // const varsMatches = [
    // 	...,
    // ];
    for (const match of subLine.matchAll(RegExp(/(const|var|let)\s+([^;:]+)\s*(?::\s*([^=]+))?(?:=\s*((?:["'`][^"'`]*["'`;])|(?:.+?)))?;/g))) {
        const token = match[2];
        AVariables.push({ Name: token, Position: { X: 0, Y: 0 }, Mutable: match[1] !== "const", Type: match[3] ?? "any", Value: match[4] });
    }
    const functionMatches = subLine.matchAll(/(?:(export) )?\s*function\s+([^!@#%^&*()\+\-\=\[\]{}\|\/<>?,.=';":`~ \n\r]+)\(([^!@#%^&*()\+\-{}\/.;~]*)\)(?::\s+([^!@#%^&*()\+\-{}\/?.;~\n\r ]*))?/g);
    for (const functionMatch of functionMatches) {
        const parameters = [
            ...functionMatch[3].matchAll(/([^!@#%^&*()\+\-\=\[\]{}\|\/<>?,.=';":`~ \n\r]+)(?:\s*:\s*([^!@#%^&*()\+\-\=\[\]{}\/<>?,.=';":`~ \n\r]+))?(?:\s*=\s*([^!@#%^&*()\+\-\={}\/?,=';":`~ \n\r]+))?/g),
        ];
        AFunctions.push({
            Name: functionMatch[2],
            Position: { X: 0, Y: 0 },
            ReturnType: functionMatch[4] ?? "any",
            Parameters: parameters.map((parameter) => {
                return { Name: parameter[1], Type: parameter[2] ?? "any", Default: parameter[3] };
            }),
            Export: functionMatch[1] !== undefined,
        });
    }
    // }
    // });
    // });
}
function DrawFolder(folder, count = 0, depth = 0) {
    const prevCount = count;
    count++;
    context.fillStyle = "#383838";
    context.fillRect(sideBarX + padding / 2 + depth * 10, padding + prevCount * charHeight, 200, charHeight);
    if (selectedNode === count) {
        context.fillStyle = "#ff0000";
        selectedNodeView = folder;
    }
    else
        context.fillStyle = "#60ffa7";
    context.fillText(folder.Title, padding + sideBarX + depth * 10, padding + textBaseline + prevCount * charHeight);
    if (folder.Opened) {
        for (const elem of folder.Childs)
            if (elem.Type === "Folder") {
                count = DrawFolder(elem, count, depth + 1);
            }
            else {
                context.fillStyle = "#383838";
                context.fillRect(padding / 2 + sideBarX + 200 + depth * 10 - 1, padding + count * charHeight, 1, charHeight);
                if (selectedNode === count + 1) {
                    context.fillStyle = "#ff0000";
                    selectedNodeView = elem;
                }
                else
                    context.fillStyle = "#c5ffdf";
                context.fillText(elem.Title, padding + sideBarX + (depth + 1) * 10, padding + textBaseline + count++ * charHeight);
            }
    }
    context.fillStyle = "#383838";
    context.fillRect(sideBarX + padding / 2 + depth * 10, padding + prevCount * charHeight, 1, (count - prevCount) * charHeight);
    context.fillRect(sideBarX + padding / 2 + depth * 10 + 1, padding + count * charHeight, 200 - 2, 1);
    return count;
}
function IsGroup(item) {
    return item.ChildItems !== undefined;
}
String.StartWith = function (start) {
    if (start.length > this.length)
        return false;
    for (let i = 0; i < start.length; i++)
        if (this[i] !== start[i])
            return false;
    return true;
};
function ConnectFromEditor() {
    if (texts[cursors[0].Y].startsWith("/id:")) {
        Connect(texts[cursors[0].Y].substring(4));
        texts[cursors[0].Y] = "";
    }
}
function Connect(name) {
    Post("login", { Name: name }, (res) => {
        logined = { Id: res.Id, Name: name, Color: "#FF0000" };
        for (const user of res.Users)
            users.push({ Id: user.Id, Name: user.Name, Color: "0000FF" });
        // texts[cursors.Y] = "";
        // cursors.X = 0;
        socket = new WebSocket(`ws://${location.hostname}:51115/${name}`);
        socket.onmessage = (e) => {
            const buf = e.data;
            buf.arrayBuffer().then((raw) => {
                const dv = new DataView(raw);
                switch (dv.getUint8(0)) {
                    case 0: {
                        users.push({
                            Id: dv.getUint8(1),
                            Name: textDecoder.decode(raw.slice(3, 3 + dv.getUint8(2))),
                            Color: "#0000FF",
                        });
                        break;
                    }
                    case 1: {
                        users.find((x) => x.Id === dv.getUint8(1)).Selection = {
                            X: dv.getUint32(2, true),
                            Y: dv.getUint32(6, true),
                            ToX: dv.getUint32(10, true),
                            ToY: dv.getUint32(14, true),
                        };
                        Render();
                        break;
                    }
                    case 2: {
                        const y = dv.getUint32(6, true);
                        const x = dv.getUint32(2, true);
                        const symbol = textDecoder.decode(raw.slice(10));
                        if (y >= texts.length) {
                            for (let i = texts.length; i < y; i++)
                                texts[i] = "";
                            texts[y] = " ".repeat(x) + symbol;
                        }
                        else {
                            if (x > texts[y].length)
                                texts[y] += " ".repeat(x - texts[y].length) + symbol;
                            else
                                texts[y] = texts[y].substring(0, x) + symbol + texts[y].substring(x);
                        }
                        Render();
                        break;
                    }
                    case 3: {
                        const y = dv.getUint32(6, true);
                        const x = dv.getUint32(2, true);
                        if (x === 0) {
                            for (let i = y; i < texts.length - 1; i++)
                                texts[i] = texts[i + 1];
                            texts.length--;
                        }
                        else if (y < texts.length && texts[y].length >= x) {
                            texts[y] = texts[y].substring(0, x - 1) + texts[y].substring(x);
                        }
                        Render();
                        break;
                    }
                }
            });
        };
        socket.onerror = () => {
            texts[0] = `Ошибка подключения WebSocket.`;
            Render();
        };
        socket.onclose = () => {
            texts[0] = `Подключение WebSocket было разорвано.`;
            Render();
        };
        Render();
    });
}
function DrawContextGroup(groupIndex = 0) {
    if (groupIndex >= openedContextGroups.length) {
        console.error("Попытка отобразить не существующию контекстную группу.");
        return;
    }
    const group = openedContextGroups[groupIndex];
    group.Width = 0;
    for (const item of group.Group.ChildItems) {
        if (IsGroup(item) && item.Title[item.Title.length - 1] !== ">")
            item.Title += " >";
        group.Width = Math.max(group.Width, context.measureText(item.Title).width);
    }
    group.Width += 20;
    const offset = 0;
    // for (let i = 0; i < groupIndex; i++) offset += openedContextGroups[i].Width;
    context.fillStyle = "rgba(0, 0, 0, .25)";
    context.fillRect(offset + group.X - 3, group.Y + 3, group.Width, group.Group.ChildItems.length * charHeight + 8);
    context.fillStyle = "#383838";
    context.fillRect(offset + group.X + 1, group.Y, group.Width - 2, group.Group.ChildItems.length * charHeight + 8);
    context.fillRect(offset + group.X, group.Y + 1, group.Width, group.Group.ChildItems.length * charHeight + 6);
    context.fillStyle = "#252525";
    context.fillRect(offset + group.X + 3, group.Y + 2, group.Width - 6, group.Group.ChildItems.length * charHeight + 4);
    context.fillRect(offset + group.X + 2, group.Y + 3, group.Width - 4, group.Group.ChildItems.length * charHeight + 2);
    if (group.Selected !== undefined) {
        context.fillStyle = "#383838";
        context.fillRect(offset + group.X + 4, group.Y + charHeight * group.Selected + 4, group.Width - 8, charHeight);
        const item = group.Group.ChildItems[group.Selected];
        if (IsGroup(item)) {
            if (groupIndex >= openedContextGroups.length - 1)
                openedContextGroups.push({
                    X: group.X + group.Width + 4,
                    Y: group.Y,
                    Group: item,
                });
            DrawContextGroup(groupIndex + 1);
        }
    }
    context.fillStyle = "white";
    for (let i = 0; i < group.Group.ChildItems.length; i++) {
        const item = group.Group.ChildItems[i];
        context.fillText(item.Title, offset + group.X + (group.Width - context.measureText(item.Title).width) / 2, group.Y + charHeight * (i + 1));
    }
}
Render();
Analyze();
//# sourceMappingURL=index.js.map