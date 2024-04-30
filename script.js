const a = document.getElementsByTagName("button");
const input = document.getElementById("display-input");
const output = document.getElementById("display-output");

for (const button of a) {
  button.onclick = () => {
    if (
      "+-÷×.0".includes(button.innerHTML) &&
      "+-÷×.".includes(input.innerHTML[input.innerHTML.length - 1])
    ) {
      input.innerHTML = input.innerHTML.substring(
        0,
        input.innerHTML.length - 1
      );
      input.innerHTML += button.innerHTML;

      return;
    }

    switch (button.innerHTML) {
      case "C":
        input.innerHTML = "";
        output.innerHTML = "0";
        return;
      case "⌫":
        input.innerHTML = input.innerHTML.substring(
          0,
          input.innerHTML.length - 1
        );
        break;
      case "=":
        input.innerHTML =
          output.innerHTML.includes("t") || output.innerHTML.includes("a")
            ? "0"
            : output.innerHTML;
        break;
      default:
        input.innerHTML += button.innerHTML;
        break;
    }

    let evaled = input.innerHTML.replace(/÷/g, "/").replace(/×/g, "*");
    if ("+-÷×.0".includes(evaled[input.innerHTML.length - 1]))
      evaled = evaled.substring(0, evaled.length - 1);
    if ("+-/*".includes(evaled[0])) evaled = evaled.substring(1);
    if ("+-/*".includes(evaled[evaled.length - 1]))
      evaled = evaled.substring(0, evaled.length - 1);
    if (evaled === "") evaled = "0";

    output.innerHTML = eval(evaled);
  };
}
