import { generateReferenceNumber, generatePrescriptionReferenceNumber, isValidReferenceNumber, parseReferenceNumber } from './utils/helpers.js';

console.log('🔄 Testing New Short Reference Number System\n');

// Test 1: Generate appointment reference numbers
console.log('📋 Test 1: Generating Appointment Reference Numbers');
for (let i = 0; i < 5; i++) {
  const refNumber = generateReferenceNumber();
  console.log(`  Generated: ${refNumber} (length: ${refNumber.length})`);
}

console.log('\n💊 Test 2: Generating Prescription Reference Numbers');
for (let i = 0; i < 3; i++) {
  const refNumber = generatePrescriptionReferenceNumber();
  console.log(`  Generated: ${refNumber} (length: ${refNumber.length})`);
}

// Test 3: Validation
console.log('\n✅ Test 3: Validation Tests');
const testRefs = [
  generateReferenceNumber(),
  generatePrescriptionReferenceNumber(),
  'A24ABC12',  // Valid format (8 chars)
  'R24XYZ98',  // Valid format (8 chars)
  'APT-2024-0926-1234-1350',  // Old format - should be invalid
  'INVALID',   // Invalid
  'A2412XYZ',   // Valid (8 chars)
  'Z24ABC12'    // Invalid - wrong type
];

testRefs.forEach(ref => {
  const isValid = isValidReferenceNumber(ref);
  console.log(`  "${ref}" -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

// Test 4: Parsing
console.log('\n🔍 Test 4: Parsing Reference Numbers');
const validRefs = testRefs.filter(ref => isValidReferenceNumber(ref));
validRefs.forEach(ref => {
  const parsed = parseReferenceNumber(ref);
  if (parsed) {
    console.log(`  "${ref}" -> Type: ${parsed.type}, Year: ${parsed.year}, Random: ${parsed.randomPart}`);
  }
});

// Test 5: Uniqueness test
console.log('\n🎯 Test 5: Uniqueness Test (generating 20 reference numbers)');
const generatedRefs = new Set();
const duplicates = [];

for (let i = 0; i < 20; i++) {
  const ref = generateReferenceNumber();
  if (generatedRefs.has(ref)) {
    duplicates.push(ref);
  }
  generatedRefs.add(ref);
}

console.log(`  Generated: ${generatedRefs.size} unique references`);
console.log(`  Duplicates found: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log(`  Duplicate refs: ${duplicates.join(', ')}`);
}

// Test 6: Format comparison
console.log('\n📏 Test 6: Format Comparison');
const oldFormat = 'APT-2024-0926-1234-1350'; // Example of old format
const newFormat = generateReferenceNumber();

console.log(`  Old format: "${oldFormat}" (${oldFormat.length} characters)`);
console.log(`  New format: "${newFormat}" (${newFormat.length} characters)`);
console.log(`  Space saved: ${oldFormat.length - newFormat.length} characters (${Math.round((oldFormat.length - newFormat.length) / oldFormat.length * 100)}% reduction)`);

console.log('\n✨ Tests completed!');
