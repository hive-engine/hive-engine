import { addSeconds, formatDistanceToNow } from 'date-fns';
import { useCardStore } from '@/stores/card';

export const toFixedWithoutRounding = (t, l = 3) => {
  const a = 10 ** l;
  const s = t * a;
  return Math.floor(s) / a;
};

export const toFixedNoRounding = (n, l) => {
  const reg = new RegExp('^-?\\d+(?:\\.\\d{0,' + l + '})?', 'g');
  const str = n.toString();
  const a = str.match(reg)[0];
  const expSplit = str.split('e');
  const exp = expSplit.length > 1 ? 'e' + expSplit[1] : '';
  const dot = a.indexOf('.');
  if (dot === -1) {
    // integer, insert decimal dot and pad up zeros
    return a + '.' + '0'.repeat(l) + exp;
  }
  const b = l - (a.length - dot) + 1;
  return b > 0 ? a + '0'.repeat(b) + exp : a + exp;
};

// Adapted from https://stackoverflow.com/a/56883420

const getQuantile = (array, quantile) => {
  const index = (quantile / 100.0) * (array.length - 1);

  if (index % 1 === 0) {
    return array[index];
  } else {
    const lowerIndex = Math.floor(index);
    const remainder = index - lowerIndex;
    return Number(array[lowerIndex]) + remainder * (Number(array[lowerIndex + 1]) - Number(array[lowerIndex]));
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

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const addCommas = (nStr, currency = false) => {
  const x = String(nStr).split('.');

  let x1 = x[0];
  let x2 = x.length > 1 ? '.' + x[1] : '';

  var rgx = /(\d+)(\d{3})/;

  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  if (x2 == '' && currency) x2 = '.00';

  return x1 + x2;
};

export const groupBy = (array, by) => {
  return array.reduce((acc, cur) => {
    acc[cur[by]] = [...(acc[cur[by]] || []), cur];

    return acc;
  }, {});
};

export const getEdition = (edition) => {
  const map = ['Alpha', 'Beta', 'Promo', 'Reward', 'Untamed', 'Dice', 'Gladius', 'Chaos Legion', 'Riftwatchers'];

  return map[edition];
};

export const getRarity = (rarity) => {
  const map = ['Common', 'Rare', 'Epic', 'Legendary'];

  return map[rarity - 1];
};

export const getElement = (color) => {
  const map = {
    Red: 'Fire',
    Green: 'Earth',
    Blue: 'Water',
    White: 'Life',
    Black: 'Death',
    Gray: 'Neutral',
    Gold: 'Dragon',
  };

  return map[color];
};

export const getThumbByLevel = (card, level = 1) => {
  const store = useCardStore();

  return `${store.sl_settings?.asset_url}cards_by_level/${getEdition(card.edition)
    .toLowerCase()
    .replace(' legion', '')
    .replace('riftwatchers', 'rift')}/${card.name || card.details.name}_lv${card.level || level}${
    card.gold ? '_gold' : ''
  }.png`;
};

export const getCardBcx = (card) => {
  const cardStore = useCardStore();

  const { rarity, tier } = cardStore.details.get(card.card_detail_id);

  const xpProperty =
    card.edition == 0 || (card.edition == 2 && card.card_detail_id < 100)
      ? card.gold
        ? 'gold_xp'
        : 'alpha_xp'
      : card.gold
        ? 'beta_gold_xp'
        : 'beta_xp';

  const baseXp = cardStore.sl_settings[xpProperty][rarity - 1];

  const bcx =
    card.edition >= 4 || tier >= 4
      ? card.xp
      : Math.floor(Math.max(card.gold ? card.xp / baseXp : (card.xp + baseXp) / baseXp, 1));

  return bcx;
};

export const getCardLevel = (card) => {
  const cardStore = useCardStore();

  const { rarity, tier } = cardStore.details.get(card.card_detail_id);
  const maxLevel = 10 - (rarity - 1) * 2;

  if (card.edition >= 4 || tier >= 4) {
    let rates = cardStore.sl_settings[card.gold ? 'combine_rates_gold' : 'combine_rates'][rarity - 1];

    for (let i = 0; i < rates.length; i++) {
      if (rates[i] > card.xp) return i;
    }

    return maxLevel;
  } else {
    for (let i = 0; i < cardStore.sl_settings.xp_levels[rarity - 1].length; i++) {
      if (card.xp < cardStore.sl_settings.xp_levels[rarity - 1][i]) return i + 1;
    }

    return cardStore.sl_settings.xp_levels[rarity - 1].length + 1;
  }
};

const getMaxXp = (card) => {
  const cardStore = useCardStore();

  const { rarity, tier } = cardStore.details.get(card.card_detail_id);

  const maxLevel = 10 - (rarity - 1) * 2;

  if (card.edition >= 4 || tier >= 4) {
    let rates = cardStore.sl_settings[card.gold ? 'combine_rates_gold' : 'combine_rates'][rarity - 1];
    return rates[rates.length - 1];
  }

  return cardStore.sl_settings.xp_levels[rarity - 1][maxLevel - 2];
};

export const getCardPower = (card) => {
  const cardStore = useCardStore();

  const { rarity, tier } = cardStore.details.get(card.card_detail_id);

  if (!card.alpha_xp) {
    card.alpha_xp = 0;
  }

  let xpProperty =
    card.edition == 0 || (card.edition == 2 && card.card_detail_id < 100)
      ? card.gold
        ? 'gold_xp'
        : 'alpha_xp'
      : card.gold
        ? 'beta_gold_xp'
        : 'beta_xp';

  const baseXp = cardStore.sl_settings[xpProperty][rarity - 1];
  const maxXp = getMaxXp(card);

  let alphaBcx = 0;
  let alphaDec = 0;

  let xp = Math.max(card.xp - card.alpha_xp, 0);

  let burnRate =
    cardStore.sl_settings.dec[card.edition >= 4 || tier >= 4 ? 'untamed_burn_rate' : 'burn_rate'][rarity - 1];

  if (card.alpha_xp) {
    let alphaBcxXp = cardStore.sl_settings[card.gold ? 'gold_xp' : 'alpha_xp'][rarity - 1];

    alphaBcx = Math.max(card.gold ? card.alpha_xp / alphaBcxXp : card.alpha_xp / alphaBcxXp, 1);

    alphaDec = burnRate * alphaBcx * cardStore.sl_settings.dec.alpha_burn_bonus;

    if (card.gold) alphaDec *= cardStore.sl_settings.dec.gold_burn_bonus;
  }

  let bcx = Math.max(card.gold ? xp / baseXp : (xp + baseXp) / baseXp, 1);

  if (card.edition >= 4 || tier >= 4) bcx = card.xp;

  if (card.alpha_xp) bcx--;

  let dec = burnRate * bcx;

  if (card.gold) {
    const goldBurnBonusProp = tier >= 7 ? 'gold_burn_bonus_2' : 'gold_burn_bonus';
    dec *= cardStore.sl_settings.dec[goldBurnBonusProp];
  }

  if (card.edition == 0) dec *= cardStore.sl_settings.dec.alpha_burn_bonus;

  if (card.edition == 2) dec *= cardStore.sl_settings.dec.promo_burn_bonus;

  let totalDec = dec + alphaDec;

  // Give a bonus if burning a max level card
  if (card.xp >= maxXp) totalDec *= cardStore.sl_settings.dec.max_burn_bonus;

  // Tier 7 cards give half the DEC and CP
  if (tier >= 7) totalDec = totalDec / 2;

  return totalDec;
};

export const getCardCooldown = (card) => {
  const cardStore = useCardStore();

  if (!card.last_transferred_date || !card.last_used_date) return 0;

  let cooldownStart = new Date(Date.now() - cardStore.sl_settings.transfer_cooldown_blocks * 3000);

  let lastUsedDate = new Date(card.last_used_date);

  if (lastUsedDate > cooldownStart) {
    let secondsSinceLastUsed = (Date.now() - lastUsedDate.getTime()) / 1000;
    return formatDistanceToNow(
      addSeconds(new Date(), cardStore.sl_settings.transfer_cooldown_blocks * 3 - secondsSinceLastUsed),
      // { addSuffix: true }
    );
  }

  return 0;
};
