import React from 'react';

/**
 * MathText parses simple mathematical and chemical notation in strings
 * and renders them beautifully with superscripts, subscripts, and fractions.
 * It carefully avoids modifying normal text formatting like "Assignment 2".
 */
export function MathText({ text, className = "" }) {
  if (typeof text !== 'string') return <span className={className}>{text}</span>;

  let parts = [text];

  const applyRule = (regex, replacer) => {
    const newParts = [];
    parts.forEach((part) => {
      if (typeof part !== 'string') {
        newParts.push(part);
        return;
      }
      
      let lastIndex = 0;
      let match;
      const globalRegex = new RegExp(regex, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
      
      while ((match = globalRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          newParts.push(part.substring(lastIndex, match.index));
        }
        newParts.push(replacer(match));
        lastIndex = globalRegex.lastIndex;
      }
      if (lastIndex < part.length) {
        newParts.push(part.substring(lastIndex));
      }
    });
    parts = newParts;
  };

  // 1. Roots: sqrt(x) -> √(x)
  applyRule(/sqrt\(([^)]+)\)/gi, (match) => {
    return `√(${match[1]})`;
  });

  // 2. Explicit superscripts: ^2, ^-2, ^n
  applyRule(/\^([A-Za-z0-9\-]+)/g, (match) => {
    return <sup className="text-[0.75em] align-super">{match[1]}</sup>;
  });

  // 3. Explicit subscripts: _1, _2
  applyRule(/_([A-Za-z0-9\-]+)/g, (match) => {
    return <sub className="text-[0.75em] align-sub">{match[1]}</sub>;
  });

  // 4. Fractions: numbers like 1/2, or letters like a/b
  applyRule(/\b([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)\b/g, (match) => {
    const num = match[1];
    const den = match[2];
    
    // Check if it's a common Unicode fraction
    const unicodeFractions = {
      '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
      '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚',
      '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞'
    };
    
    if (unicodeFractions[`${num}/${den}`]) {
      return unicodeFractions[`${num}/${den}`];
    }
    
    // Custom fraction styling
    return (
      <span className="inline-flex flex-col text-center align-middle text-[0.7em] leading-none mx-0.5">
        <span className="border-b border-current pb-[1px] mb-[1px]">{num}</span>
        <span>{den}</span>
      </span>
    );
  });

  // 5. Implicit superscripts: lowercase letter or closing paren followed by digits without space
  // e.g. x2 -> x², (x+1)2 -> (x+1)²
  applyRule(/([a-z\)])(\d+)\b/g, (match) => {
    return (
      <React.Fragment>
        {match[1]}
        <sup className="text-[0.75em] align-super">{match[2]}</sup>
      </React.Fragment>
    );
  });

  // 6. Implicit subscripts: uppercase letter followed by digits
  // e.g. H2O -> H₂O, CO2 -> CO₂
  applyRule(/([A-Z])(\d+)\b/g, (match) => {
    return (
      <React.Fragment>
        {match[1]}
        <sub className="text-[0.75em] align-sub">{match[2]}</sub>
      </React.Fragment>
    );
  });

  return (
    <span className={`dn-math ${className}`}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>{part}</React.Fragment>
      ))}
    </span>
  );
}
