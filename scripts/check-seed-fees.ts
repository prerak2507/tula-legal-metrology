// Lists each demo application's recorded fee next to the fee the gazetted schedule gives today.
import { INITIAL_APPLICATIONS, INITIAL_INSTRUMENTS } from '../src/data/seedData';
import { calculateStatutoryFee } from '../src/services/rulesEngine';

for (const a of INITIAL_APPLICATIONS) {
  const i = INITIAL_INSTRUMENTS.find(x => x.id === a.instrumentId);
  if (!i) { console.log(a.id, 'instrument missing'); continue; }
  const f = calculateStatutoryFee(i.category, i.state, undefined, { capacity: i.capacity, accuracyClass: i.accuracyClass, atPremises: true });
  console.log([a.id, i.category, i.capacity, i.accuracyClass, i.state, 'recorded', a.feeAmount, 'schedule', f.total, f.tierLabel, f.listed ? '' : 'UNLISTED'].join(' | '));
}
