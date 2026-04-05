import { describe, it, expect } from 'vitest';
import { evaluateEquivalence, parseRelation } from './mathEngine';

describe('mathEngine parseRelation', () => {
  it('parses relation correctly', () => {
    expect(parseRelation('x^2+y^2=1')).toEqual({ lhs: 'x^2+y^2', op: '=', rhs: '1' });
    expect(parseRelation('y=x+1')).toEqual({ lhs: 'y', op: '=', rhs: 'x+1' });
    expect(parseRelation('x^2+y^2<1')).toEqual({ lhs: 'x^2+y^2', op: '<', rhs: '1' });
  });
});

describe('mathEngine evaluateEquivalence', () => {
  it('Basic x^2', () => {
    const result = evaluateEquivalence('x^2', 'x*x');
    expect(result.isMatch).toBe(true);
  });

  it('Domain mismatch at x=1', () => {
    // Target is defined at x=1, player is undefined. 
    // Note: We tolerate up to 2 isolated points of domain mismatch. So this should return true.
    const result = evaluateEquivalence('x', 'x*(x-1)/(x-1)');
    expect(result.isMatch).toBe(true);
  });

  it('Domain mismatch x vs sqrt(x^2)', () => {
    // sqrt(x) vs x^(1/2) might be same, but what if we compare x and sqrt(x^2)?
    const result = evaluateEquivalence('x', 'sqrt(x^2)');
    expect(result.isMatch).toBe(false);
  });

  it('Equivalent trig functions', () => {
    const result = evaluateEquivalence('\\sin(x)^2 + \\cos(x)^2', '1');
    expect(result.isMatch).toBe(true);
  });

  it('Complex expressions', () => {
    const result = evaluateEquivalence('2*\\sin(x)*\\cos(x)', '\\sin(2*x)');
    expect(result.isMatch).toBe(true);
  });

  it('Different functions', () => {
    const result = evaluateEquivalence('x^2', 'x^3');
    expect(result.isMatch).toBe(false);
  });

  it('e^sin(x)', () => {
    const result = evaluateEquivalence('e^{\\sin\\left(x\\right)}', 'e^{\\sin\\left(x\\right)}');
    expect(result.isMatch).toBe(true);
  });

  it('Parametric function matches exact same parameters', () => {
    const result = evaluateEquivalence('\\sin(x+a)', '\\sin(x+a)', { a: 2 });
    expect(result.isMatch).toBe(true);
  });

  it('Parametric function fails when parameter is hardcoded to specific value', () => {
    const result = evaluateEquivalence('\\sin(x+a)', '\\sin(x+2)', { a: 2 });
    expect(result.isMatch).toBe(false);
  });

  it('Fails when undefined parameter makes both evaluate to symbolic expressions', () => {
    // In the real game, the target function's parameters are ALWAYS included in `params` because we merge `levelParams`.
    const result = evaluateEquivalence('\\sin(x+a)', '\\cos(x+b)', { a: 2 });
    expect(result.isMatch).toBe(false);
  });

  it('Fails when player uses a different parameter name even if it is in params', () => {
    const result = evaluateEquivalence('\\sin(x+a)', '\\sin(x+b)', { a: 2, b: 2 });
    expect(result.isMatch).toBe(false);
  });

  // ========== 测试方程和不等式 (2D 采样) ==========
  it('Equation: x^2+y^2=1 matches x^2+y^2-1=0', () => {
    const result = evaluateEquivalence('x^2+y^2=1', 'x^2+y^2-1=0');
    expect(result.isMatch).toBe(true);
  });

  it('Equation: y=x+1 matches x-y=-1', () => {
    const result = evaluateEquivalence('y=x+1', 'x-y=-1');
    expect(result.isMatch).toBe(true);
  });

  it('Inequality: x^2+y^2<1 matches x^2+y^2-1<0', () => {
    const result = evaluateEquivalence('x^2+y^2<1', 'x^2+y^2-1<0');
    expect(result.isMatch).toBe(true);
  });

  it('Inequality: fails when direction is reversed', () => {
    const result = evaluateEquivalence('x^2+y^2<1', 'x^2+y^2>1');
    expect(result.isMatch).toBe(false);
  });

  it('Equation vs Inequality fails', () => {
    const result = evaluateEquivalence('x^2+y^2=1', 'x^2+y^2<1');
    expect(result.isMatch).toBe(false);
  });
});
