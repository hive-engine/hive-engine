import { utils } from "@hiveio/dhive";

export const toFixedWithoutRounding = (t, l = 3) => {
  const a = 10 ** l;
  const s = t * a;
  return Math.floor(s) / a;
};

export const toFixedNoRounding = (n, l) => {
  const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + l + "})?", "g");
  const str = n.toString();
  const a = str.match(reg)[0];
  const expSplit = str.split("e");
  const exp = expSplit.length > 1 ? "e" + expSplit[1] : "";
  const dot = a.indexOf(".");
  if (dot === -1) {
    // integer, insert decimal dot and pad up zeros
    return a + "." + "0".repeat(l) + exp;
  }
  const b = l - (a.length - dot) + 1;
  return b > 0 ? a + "0".repeat(b) + exp : a + exp;
};

// Adapted from https://stackoverflow.com/a/56883420

const getQuantile = (array, quantile) => {
  const index = (quantile / 100.0) * (array.length - 1);

  if (index % 1 === 0) {
    return array[index];
  } else {
    const lowerIndex = Math.floor(index);
    const remainder = index - lowerIndex;
    return array[lowerIndex] + remainder * (array[lowerIndex + 1] - array[lowerIndex]);
  }
};

export const filterOutliers = (arrayOfNumbers) => {
  if (arrayOfNumbers.length < 4) {
    return arrayOfNumbers;
  }

  const values = arrayOfNumbers.slice().sort((a, b) => a - b);

  const q1 = getQuantile(values, 25);
  const q3 = getQuantile(values, 75);

  const iqr = q3 - q1;
  const maxValue = q3 + iqr * 1.5;
  const minValue = q1 - iqr * 1.5;

  return values.filter((x) => x >= minValue && x <= maxValue);
};

export const sleep = (ms) => utils.sleep(ms);

export const addCommas = (nStr, currency = false) => {
  const x = String(nStr).split(".");

  let x1 = x[0];
  let x2 = x.length > 1 ? "." + x[1] : "";

  var rgx = /(\d+)(\d{3})/;

  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, "$1" + "," + "$2");
  }

  if (x2 == "" && currency) x2 = ".00";

  return x1 + x2;
};
