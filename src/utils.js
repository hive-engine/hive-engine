import { utils } from "@hiveio/dhive";

export const toFixedWithoutRounding = (t, l = 3) => {
  const a = 10 ** l;
  const s = t * a;
  return Math.trunc(s) / a;
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
