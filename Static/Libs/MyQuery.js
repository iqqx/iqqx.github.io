export function Post(type, body, onSuccess) {
    const http = new XMLHttpRequest();
    http.open("POST", document.location.href);
    http.responseType = "json";
    http.setRequestHeader("Accept", "application/json");
    http.onload = () => {
        if (http.status >= 400) {
            if (http.status === 405)
                ShowError(`Сервер не смог ответить.`);
            else if (http.response && http.response.Type === "error")
                ShowError(http.response.Message);
            else
                ShowError(`Неизвестная ошибка сервера.`);
        }
        else if (http.status >= 300)
            return;
        else if (http.status !== 200)
            ShowError(`Запрос не был выполнен успешно. Код: ${http.status}.`);
        else if (onSuccess !== undefined) {
            onSuccess(http.response.Content);
        }
    };
    http.send(JSON.stringify({ Type: type, Content: body }));
}
export function Get(url, onSuccess) {
    const http = new XMLHttpRequest();
    fetch(url).then(onSuccess, ShowError);
    // http.open("POST", document.location.href);
    // http.responseType = "json";
    // http.setRequestHeader("Accept", "application/json");
    // http.onload = () => {
    // 	if (http.status >= 400) {
    // 		if (http.response && http.response.Type === "error") ShowError(`Запрос к базе данных не был выполнен успешно. Сообщение: ${http.response?.Message}`);
    // 		else ShowError(`Неизвестная ошибка сервера.`);
    // 	} else if (http.status >= 300) return;
    // 	else if (http.status !== 200) ShowError(`Запрос не был выполнен успешно. Код: ${http.status}.`);
    // 	else if (onSuccess !== undefined) {
    // 		if (http.response !== null) onSuccess(http.response.Content);
    // 		else onSuccess(null);
    // 	}
    // };
    // http.send(JSON.stringify({ Type: type, Content: body }));
}
export function PostEx(type, body, onSuccess) {
    const http = new XMLHttpRequest();
    http.open("POST", document.location.href);
    http.responseType = "arraybuffer";
    http.setRequestHeader("Accept", "application/octet-stream;text/plain");
    http.onload = () => {
        if (http.status >= 400) {
            if (http.response && http.response.Type === "error")
                ShowError(`Запрос к базе данных не был выполнен успешно. Сообщение: ${http.response?.Message}`);
            else
                ShowError(`Неизвестная ошибка сервера.`);
        }
        else if (http.status >= 300)
            return;
        else if (http.status !== 200)
            ShowError(`Запрос не был выполнен успешно. Код: ${http.status}.`);
        else if (onSuccess !== undefined) {
            if (http.getResponseHeader("Content-Type") === "text/plain")
                onSuccess(String.fromCharCode.apply(null, new Uint8Array(http.response)), "text");
            else
                onSuccess(http.response, "binary");
        }
    };
    http.send(JSON.stringify({ Type: type, Content: body }));
}
function ShowError(message) {
    const popup = document.getElementById("error-popup");
    popup.children[1].innerHTML = message;
    popup.style.transition = "opacity 0s";
    popup.style.opacity = "1";
    setTimeout(function () {
        popup.style.transition = "opacity 0.5s";
        popup.style.opacity = "0";
    }, 5000);
}
//# sourceMappingURL=MyQuery.js.map