const a = document.getElementsByTagName("button");
const input = document.getElementById("display-input");
const output = document.getElementById("display-output");

for (const button of a) {
  button.onclick = () => {
    if (
      "+-÷×.".includes(button.innerHTML) &&
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
        input.innerHTML = output.innerHTML.includes("t")
          ? "0"
          : output.innerHTML;
        break;
      default:
        input.innerHTML += button.innerHTML;
        break;
    }

    let evaled = input.innerHTML.replace("÷", "/").replace("×", "*");
    if ("+-÷×.".includes(evaled[input.innerHTML.length - 1]))
      evaled = evaled.substring(0, evaled.length - 1);

    output.innerHTML = eval(evaled);
  };
}
