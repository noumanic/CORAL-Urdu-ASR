import pandas as pd
import duckdb
from rapidfuzz.distance import Levenshtein
import re

MATCH = 0
INSERTION = 1
DELETION = 2
SUBSTITUTION = 3
CORAL_DATA = 'coral_data'

THRESHOLD_LIST = [1, 1, 1, 2, 2, 2, 2, 3 ,3 ,3 ,3 ,4]

def get_threshold(word):
    return THRESHOLD_LIST[min(len(word), len(THRESHOLD_LIST) - 1)]

def levenshtein(s1 : str | list ,s2 : str | list,weight_dict : dict = {},dp_matrix = False) -> float | list :
    s1_len = len(s1)
    s2_len = len(s2)
    dp = [[i if j == 0 else j if i == 0 else 0  for j in list(range(0,s2_len + 1))] for i in list(range(0,s1_len + 1))]
    for i in list(range(1,s1_len + 1)):
        for j in list(range(1,s2_len +  1)):
            sub_cost = weight_dict.get(s1[i - 1],{}).get(s2[j - 1],0 if s1[i - 1] == s2[j - 1] else 1)
            ins_cost = weight_dict.get('insertion_cost',1)
            del_cost = weight_dict.get('deletion_cost',1)
            dp[i][j] = min(dp[i - 1][j] + del_cost,dp[i][j - 1] + ins_cost,dp[i-1][j-1] + sub_cost)
    return dp[s1_len][s2_len] if not dp_matrix else dp

def normalize_urdu(text : str) -> str:
    if pd.isna(text) or text == '':
        return ''
    text = re.sub(r'[\u0610-\u061A\u064B-\u065F\u0670]', '', text)    # 1. Remove diacritics (zabar, zer, pesh, tanwin, shadda, sukun, etc.)
    text = text.replace('\u0640', '')    # 2. Remove tatweel/kashida (ـ)
    char_map = {    # 3. Normalize Arabic → Urdu
        '\u0643': '\u06A9',  # Arabic KAF → Urdu KEHEH (ك → ک)
        '\u0647': '\u06C1',  # Arabic HEH → Urdu HEH GOAL (ه → ہ)
        '\u0649': '\u06CC',  # ALEF MAQSURA → Farsi YEH (ى → ی)
        '\u0629': '\u06C1',  # TEH MARBUTA → Urdu HEH GOAL (ة → ہ)
        '\u0623': '\u0627',  # ALEF+HAMZA ABOVE → ALEF (أ → ا)
        '\u0625': '\u0627',  # ALEF+HAMZA BELOW → ALEF (إ → ا)
        '\u064A': '\u06CC',  # Arabic YEH → Farsi YEH (ي → ی)
    }
    for src, tgt in char_map.items():
        text = text.replace(src, tgt)
    text = re.sub(r'[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]', '', text)    # 4. Remove zero-width & invisible chars
    text = re.sub(r'[،؍؎؏۔؟؛٪٬]', '', text)    # Urdu punctuation block
    text = re.sub(r'[\u0600-\u060C\u060E-\u061F]', '', text)    # Extended Arabic punctuation
    text = re.sub(r'[!@#$%^&*()_+=\[\]{};:\'",.<>/?\\|`~\-–—''""…]', '', text)    # ASCII punctuation & symbols (EVERYTHING)
    text = re.sub(r'[A-Za-z0-9]', '', text)    # 6. REMOVE ALL ENGLISH LETTERS & DIGITS
    text = re.sub(r'\s+', ' ', text).strip()    # 7. Collapse all whitespace
    return text

def is_oov(tree, word, freq_cutoff=2000):
    node = tree.root
    while node:
        d = Levenshtein.distance(node.word, word)
        if d == 0:
            return node.count < freq_cutoff  # in vocab but too rare → still OOV
        if d not in node.children:
            return True
        node = node.children[d]
    return True

def get_bk_candidates(tree, word, edit_distance_threshold, top_n):
    return tuple(tree.search(word, edit_distance_threshold)[:top_n])

def get_trigram_candidates(con, ngram_tuple, top_n):
    w0, w1, w2 = ngram_tuple
    if w0 is None:
        res = con.execute(f"""
            SELECT v, cnt FROM read_parquet('{CORAL_DATA}/trigram_left.parquet')
            WHERE k0 = ? AND k1 = ? ORDER BY cnt DESC LIMIT ?
        """, [w1, w2, top_n]).fetchall()
    elif w2 is None:
        res = con.execute(f"""
            SELECT v, cnt FROM read_parquet('{CORAL_DATA}/trigram_right.parquet')
            WHERE k0 = ? AND k1 = ? ORDER BY cnt DESC LIMIT ?
        """, [w0, w1, top_n]).fetchall()
    else:
        res = con.execute(f"""
            SELECT v, cnt FROM read_parquet('{CORAL_DATA}/trigram_middle.parquet')
            WHERE k0 = ? AND k1 = ? ORDER BY cnt DESC LIMIT ?
        """, [w0, w2, top_n]).fetchall()
    return tuple(res)

def get_bigram_candidates(con, ngram_tuple, top_n):
    w0, w1 = ngram_tuple
    if w1 is None:
        res = con.execute(f"""
            SELECT v, cnt FROM read_parquet('{CORAL_DATA}/bigram_forward.parquet')
            WHERE k0 = ? ORDER BY cnt DESC LIMIT ?
        """, [w0, top_n]).fetchall()
    else:
        res = con.execute(f"""
            SELECT v, cnt FROM read_parquet('{CORAL_DATA}/bigram_backward.parquet')
            WHERE k0 = ? ORDER BY cnt DESC LIMIT ?
        """, [w1, top_n]).fetchall()
    return tuple(res)