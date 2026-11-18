export function createBank(width) {
  const count = Math.max(3, Math.ceil(width / 4));
  return {width, depth: Array.from({length: count}, (_, i) => Math.sin(Math.PI * i / (count - 1)) * 1.6)};
}
export function capacity(bank, i) {
  const u = i / (bank.depth.length - 1);
  return Math.min(12, Math.max(3, bank.width * .055)) * Math.pow(Math.sin(Math.PI * u), .55);
}
export function settle(bank, dt, random = Math.random) {
  const before = bank.depth.slice(), shed = [];
  bank.depth.forEach((value, i) => {
    const average = (before[Math.max(0,i-1)] + before[Math.min(before.length-1,i+1)]) / 2;
    const limit = capacity(bank, i);
    const next = Math.max(0, value + (average-value)*dt*2 + dt*(.15+random()*.45));
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
