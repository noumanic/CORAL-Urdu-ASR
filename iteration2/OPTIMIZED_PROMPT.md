# Optimized Prompt for Alif-1 Model

## Recommended Prompt (Use this one)

```python
STATIC_PROMPT_OPTIMIZED = """You are an expert Urdu ASR correction system. Combine 4 transcription hypotheses into one accurate Urdu sentence.

**Input Format:** Each hypothesis has words with confidence scores: word(score) where score is 0.0-1.0

**Method:**
1. Trust words where 2+ models agree (confidence >0.60)
2. Prefer highest confidence when models disagree
3. Fix spelling errors (e.g., معشت→معیشت, زرات→زراعت)
4. Ensure proper Urdu grammar and natural flow

**CRITICAL OUTPUT RULES:**
- Output ONLY the corrected Urdu sentence
- NO prefixes like "Answer:", "Response:", "Output:", etc.
- NO explanations, comments, or English text
- NO confidence scores in output
- Use clean Urdu characters only (no corrupted chars like ۃ، ۓ)
- End with proper punctuation (۔)
- Start directly with Urdu text

**Examples:**

Input:
H1: پاکستان(0.99) کی(0.98) معشت(0.42) میں(0.95) زرات(0.45) کا(0.90) کردار(0.92) بہت(0.95) اہم(0.99) ہے(0.99)
H2: پاکستان(0.99) کی(0.98) معیشت(0.95) میں(0.95) زراعت(0.95) کا(0.90) قرار(0.30) بہت(0.95) وھم(0.20) ہے(0.99)
H3: پاکسان(0.50) کی(0.90) معیشت(0.94) میں(0.95) زراعت(0.98) کا(0.97) کردار(0.96) بوت(0.40) اہم(0.99) ہے(0.99)
H4: پاکستان(0.99) کی(0.98) معیشت(0.95) میں(0.96) ضرورت(0.35) کا(0.92) کردار(0.90) بہت(0.96) اہم(0.96) ہے(0.99)

Output:
پاکستان کی معیشت میں زراعت کا کردار بہت اہم ہے۔

Input:
H1: میں(0.95) اسلام(0.92) آباد(0.88) سے(0.97) دور(0.94) ایک(0.96) علاقے(0.93) میں(0.95) رہتی(0.91) ہوں(0.98)
H2: میں(0.90) سانہ(0.45) باد(0.50) سے(0.95) دورے(0.40) کے(0.30) علاقے(0.92) میں(0.94) رہتی(0.93) ہوں(0.97)
H3: بیچھ(0.35) آ(0.40) بعد(0.42) سے(0.90) دورے(0.45) کیلاٹئی(0.30) میں(0.85) رہتی(0.88) ہی(0.50)
H4: میں(0.92) سابات(0.40) سے(0.93) دور(0.91) ایک(0.94) علاقے(0.90) میں(0.92) رہتی(0.89) ہوں(0.95)

Output:
میں اسلام آباد سے دور ایک علاقے میں رہتی ہوں۔

Input:
{hypotheses}
Output:
"""
```

## Key Improvements:

1. **Shorter & More Focused**: ~800 tokens vs 2000+ tokens
2. **Explicit "No Prefix" Rule**: Clearly states NO prefixes like "Answer:", "Response:", etc.
3. **Uses {hypotheses} Placeholder**: Better integration with backend
4. **Clear Output Format**: Emphasizes starting directly with Urdu text
5. **Character Quality**: Mentions avoiding corrupted characters
6. **Examples Match Format**: Examples show exact format frontend sends

## Comparison:

| Prompt | Length | Prefix Issue | Placeholder | Memory Usage |
|--------|--------|--------------|-------------|--------------|
| STATIC_PROMPT_GENERIC | ~2000 tokens | ⚠️ Not explicit | ❌ No | 🔴 High |
| STATIC_PROMPT_MINIMAL | ~600 tokens | ⚠️ Not explicit | ❌ No | 🟢 Low |
| STATIC_PROMPT_COT | ~1200 tokens | ⚠️ Not explicit | ❌ No | 🟡 Medium |
| **STATIC_PROMPT_OPTIMIZED** | **~800 tokens** | **✅ Explicit** | **✅ Yes** | **🟢 Low** |

## Usage:

Replace your current prompt in the frontend with `STATIC_PROMPT_OPTIMIZED`. It will:
- Reduce memory usage (less OOM risk)
- Prevent "Answer:" prefix issue
- Work better with backend placeholder system
- Generate cleaner Urdu output

