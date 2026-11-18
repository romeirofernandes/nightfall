export function createBank(width) {
  const count = Math.max(3, Math.ceil(width / 4));
  return {width, depth: Array.from({length: count}, (_, i) => {
    const u = i / (count - 1);
    const patches = Math.max(0, Math.sin(u * 17 + width * .07) + .25);
    return Math.sin(Math.PI * u) * patches * .55;
  })};
}
export function capacity(bank, i) {
  const u = i / (bank.depth.length - 1);
  const drift = .68 + .18 * Math.sin(u * 12 + bank.width * .03) + .14 * Math.sin(u * 29 + 1.3);
  return Math.min(7, Math.max(2, bank.width * .032)) * Math.pow(Math.sin(Math.PI * u), .8) * drift;
}
export function settle(bank, dt, random = Math.random) {
  const before = bank.depth.slice(), shed = [];
  bank.depth.forEach((value, i) => {
    const average = (before[Math.max(0,i-1)] + before[Math.min(before.length-1,i+1)]) / 2;
    const limit = capacity(bank, i);
    const next = Math.max(0, value + (average-value)*dt*2 + dt*(.035+random()*.09));
    bank.depth[i] = Math.min(next, limit);
    if (next > limit + .02 && value > 1) shed.push({x:i / (before.length-1)*bank.width, amount:next-limit});
  });
  return shed;
}
export function brush(bank, x, radius = 22) {
  const removed = [];
  bank.depth.forEach((value, i) => {
    const at = i / (bank.depth.length-1)*bank.width;
    const influence = Math.max(0, 1-Math.abs(at-x)/radius);
    if (!influence) return;
    const amount = value * influence * .85;
    bank.depth[i] -= amount;
    if (amount > .15) removed.push({x:at, amount});
  });
  return removed;
}
export function deposit(bank, x, amount) {
  if (x < 0 || x > bank.width) return false;
  const i = Math.min(bank.depth.length-1, Math.floor(x/bank.width*(bank.depth.length-1)));
  bank.depth[i] += amount;
  return true;
}
