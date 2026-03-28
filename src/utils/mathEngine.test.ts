import { evaluateEquivalence } from './mathEngine';

function test(name: string, target: string, player: string, expectMatch: boolean) {
  const result = evaluateEquivalence(target, player);
  if (result.isMatch === expectMatch) {
    console.log(`✅ [PASS] ${name}`);
  } else {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Target: ${target}`);
    console.error(`   Player: ${player}`);
    console.error(`   Expect: ${expectMatch}`);
    console.error(`   Result: ${result.isMatch} (Reason: ${result.reason}, Method: ${result.method})`);
  }
}

console.log("--- Running mathEngine tests ---");

// Test 1: Basic equivalence
test('Basic x^2', 'x^2', 'x*x', true);

// Test 2: Domain mismatch (division by zero at x=1)
// Target is defined at x=1, player is undefined
test('Domain mismatch at x=1', 'x', 'x*(x-1)/(x-1)', false);

// Test 3: Domain mismatch (sqrt domain)
// sqrt(x) vs x^(1/2) might be same, but what if we compare x and sqrt(x^2)?
test('Domain mismatch x vs sqrt(x^2)', 'x', 'sqrt(x^2)', false);

// Test 4: Equivalent trig functions
test('Trig identity', 'sin(x)^2 + cos(x)^2', '1', true);

// Test 5: Complex expressions
test('Complex equivalent', '2*sin(x)*cos(x)', 'sin(2*x)', true);

// Test 6: Different functions
test('Different functions', 'x^2', 'x^3', false);

console.log("--- Tests finished ---");
