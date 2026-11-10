const { INITIAL_CROPS } = require('../src/data/mockData.js');

console.log('Total mock crops:', INITIAL_CROPS.length);

const tomatoes = INITIAL_CROPS.filter(c => 
  (c.name + ' ' + (c.tamilName || '') + ' ' + c.id).toLowerCase().includes('tomato') || 
  (c.name + ' ' + (c.tamilName || '')).includes('தக்காளி')
);
console.log('\n--- TOMATOES (' + tomatoes.length + ') ---');
tomatoes.forEach(t => console.log(`- ${t.name} | Grade: ${t.grade} | Price: ₹${t.pricePerKg} | Image: ${t.image ? 'YES' : 'NO'}`));

const onions = INITIAL_CROPS.filter(c => 
  (c.name + ' ' + (c.tamilName || '') + ' ' + c.id).toLowerCase().includes('onion') || 
  (c.name + ' ' + (c.tamilName || '') + ' ' + c.id).toLowerCase().includes('shallot') || 
  (c.name + ' ' + (c.tamilName || '')).includes('வெங்காயம்')
);
console.log('\n--- ONIONS (' + onions.length + ') ---');
onions.forEach(o => console.log(`- ${o.name} | Grade: ${o.grade} | Price: ₹${o.pricePerKg} | Image: ${o.image ? 'YES' : 'NO'}`));

const potatoes = INITIAL_CROPS.filter(c => 
  (c.name + ' ' + (c.tamilName || '') + ' ' + c.id).toLowerCase().includes('potato') || 
  (c.name + ' ' + (c.tamilName || '')).includes('உருளை')
);
console.log('\n--- POTATOES (' + potatoes.length + ') ---');
potatoes.forEach(p => console.log(`- ${p.name} | Grade: ${p.grade} | Price: ₹${p.pricePerKg} | Image: ${p.image ? 'YES' : 'NO'}`));

const gradeC = INITIAL_CROPS.filter(c => (c.grade || '').trim().toLowerCase() === 'grade c');
console.log('\n--- GRADE C CROPS (' + gradeC.length + ') ---');
gradeC.forEach(c => console.log(`- ${c.name} | Grade: ${c.grade} | Image: ${c.image ? 'YES' : 'NO'}`));

