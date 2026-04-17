import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
import pandas as pd
from rapidfuzz.distance import Levenshtein
import re

BASE_DIR = os.path.dirname(__file__)
MATCH = 0
INSERTION = 1
DELETION = 2
SUBSTITUTION = 3

SAME = 4
MERGE = 5
SPLIT = 6
NOISE = 7

CORAL_DATA = 'coral_data'

TAGS = ['MATCH','INSERTION','DELETION','SUBSTITUTION','SAME','MERGE','SPLIT','NOISE']
THRESHOLD_LIST = [1, 1, 1, 2, 2, 2, 2, 3 ,3 ,3 ,3 ,4]

def get_threshold(word):
    return THRESHOLD_LIST[min(len(word), len(THRESHOLD_LIST) - 1)]

def levenshtein(s1 : str | list ,s2 : str | list,weight_dict : dict = {},dp_matrix = False) -> float | list :
    s1_len = len(s1)
    s2_len = len(s2)
    dp = [[i if j == 0 else j if i == 0 else 0  for j in list(range(0,s2_len + 1))] for i in list(range(0,s1_len + 1))]
    for i in list(range(1,s1_len + 1)):
        for j in list(range(1,s2_len +  1)):
            sub_cost = weight_dict.get(s1[i - 1],{}).get(s2[j - 1],0 if s1[i - 1] == s2[j - 1] else weight_dict.get('substitution_cost',1))
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

def get_bigram_candidates(con, ngram_tuple, top_n):
    w0, w1 = ngram_tuple
    if w1 is None:
        return tuple(con.execute("""
            SELECT v, cnt FROM bigram_forward
            WHERE k0 = ? ORDER BY cnt DESC LIMIT ?
        """, [w0, top_n]).fetchall())
    else:
        return tuple(con.execute("""
            SELECT v, cnt FROM bigram_backward
            WHERE k0 = ? ORDER BY cnt DESC LIMIT ?
        """, [w1, top_n]).fetchall())

def get_trigram_candidates(con, ngram_tuple, top_n):
    w0, w1, w2 = ngram_tuple
    if w0 is None:
        return tuple(con.execute("""
            SELECT v, cnt FROM trigram_left
            WHERE k0 = ? AND k1 = ? ORDER BY cnt DESC LIMIT ?
        """, [w1, w2, top_n]).fetchall())
    elif w2 is None:
        return tuple(con.execute("""
            SELECT v, cnt FROM trigram_right
            WHERE k0 = ? AND k1 = ? ORDER BY cnt DESC LIMIT ?
        """, [w0, w1, top_n]).fetchall())
    else:
        return tuple(con.execute("""
            SELECT v, cnt FROM trigram_middle
            WHERE k0 = ? AND k1 = ? ORDER BY cnt DESC LIMIT ?
        """, [w0, w2, top_n]).fetchall())

def align_sentence(source, target,weight_dict = {}):
    src=re.sub(r"\s+","",source); trg=re.sub(r"\s+","",target)
    dp=levenshtein(src,trg,weight_dict = weight_dict,dp_matrix=True)
    astr=""; acts=[]; ls=len(src); lt=len(trg)
    while ls>0 or lt>0:
        cc=dp[ls][lt]
        ic=dp[ls][lt-1]+1 if lt>0 else 1e9
        dc=dp[ls-1][lt]+1 if ls>0 else 1e9
        sc=(dp[ls-1][lt-1]+(0 if src[ls-1]==trg[lt-1] else 1)) if ls>0 and lt>0 else 1e9
        if   ls>0 and abs(dc-cc)<0.001:
            astr=src[ls-1]+astr; acts.insert(0,DELETION); ls-=1
        elif lt>0 and abs(ic-cc)<0.001:
            astr=trg[lt-1]+astr; acts.insert(0,INSERTION); lt-=1
        elif ls>0 and lt>0 and abs(sc-cc)<0.001:
            astr=trg[lt-1]+astr
            acts.insert(0,MATCH if trg[lt-1]==src[ls-1] else SUBSTITUTION)
            ls-=1; lt-=1
    return astr,acts

def generate_alignment_data(source: str, target: str) -> dict:
    source_words=source.strip().split()
    target_words=target.strip().split()
    aligned_string, action_taken = align_sentence(source, target)
    source_offset=[i for i,c in enumerate(source) if c!=' ']
    target_offset=[i for i,c in enumerate(target) if c!=' ']

    def get_src_word_idx(ptr):
        acc=0
        for i,w in enumerate(source_words):
            acc+=len(w)
            if ptr<acc: return i
        return len(source_words)-1

    def get_trg_word_idx(ptr):
        acc=0
        for i,w in enumerate(target_words):
            acc+=len(w)
            if ptr<acc: return i
        return len(target_words)-1

    steps=[]
    sp=tp=0
    for idx,action in enumerate(action_taken):
        sw=get_src_word_idx(sp) if action in (MATCH,SUBSTITUTION,DELETION) else None
        tw=get_trg_word_idx(tp) if action in (MATCH,SUBSTITUTION,INSERTION) else None
        steps.append({'char':aligned_string[idx],'action':action,
                      'src_word':sw,'trg_word':tw,'src_ptr':sp,'trg_ptr':tp})
        if action in (MATCH,SUBSTITUTION,DELETION): sp+=1
        if action in (MATCH,SUBSTITUTION,INSERTION): tp+=1
    tokens=[]
    def flush(buf):
        if buf:
            tokens.append({'chars':[s['char'] for s in buf],
                           'actions':[s['action'] for s in buf],
                           'src_words':{s['src_word'] for s in buf if s['src_word'] is not None},
                           'trg_words':{s['trg_word'] for s in buf if s['trg_word'] is not None}})

    def akind(a): return {INSERTION:'INS',DELETION:'DEL',MATCH:'MAT',SUBSTITUTION:'SUB'}[a]

    buf=[]
    for i,step in enumerate(steps):
        if not buf: buf.append(step); continue
        ck={akind(s['action']) for s in buf}; nk=akind(step['action'])
        kbreak=((ck=={'INS'} and nk!='INS') or (ck=={'DEL'} and nk!='DEL') or
                (nk=='INS' and ck!={'INS'}) or (nk=='DEL' and ck!={'DEL'}))
        msb=((ck<={'MAT'} and nk=='SUB') or (ck<={'SUB'} and nk=='MAT'))
        sb=(step['action'] in (MATCH,SUBSTITUTION,DELETION) and step['src_ptr']>0 and
            source_offset[step['src_ptr']]-source_offset[step['src_ptr']-1]>1)
        ts=(step['action'] in (MATCH,SUBSTITUTION,INSERTION) and step['trg_ptr']>0 and
            target_offset[step['trg_ptr']]-target_offset[step['trg_ptr']-1]>1)
        lsw=next((s['src_word'] for s in reversed(buf) if s['src_word'] is not None),None)
        swc=(step['src_word']!=lsw) if (step['src_word'] is not None and lsw is not None) else True
        tb=ts and swc
        if kbreak or msb or sb or tb: flush(buf); buf=[step]
        else: buf.append(step)
    flush(buf)

    s2t={i:set() for i in range(len(source_words))}
    t2t={i:set() for i in range(len(target_words))}
    for ti,tok in enumerate(tokens):
        for sw in tok['src_words']: s2t[sw].add(ti)
        for tw in tok['trg_words']: t2t[tw].add(ti)

    def is_noise(ti,tok):
        acts=tok['actions']
        if all(a==INSERTION for a in acts): return True
        if all(a==DELETION for a in acts):
            for sw in tok['src_words']:
                if any(not all(a==DELETION for a in tokens[t]['actions'])
                       for t in s2t[sw]-{ti}):
                    return True
        for tw in tok['trg_words']:
            if tw is None: continue
            for ti2 in t2t[tw]:
                if ti2!=ti and len(tokens[ti2]['trg_words'])>1:
                    return True
        return False

    def assign_metadata(ti,tok):
        if is_noise(ti,tok): return NOISE

        trg_w={t for t in tok['trg_words'] if t is not None}
        src_w=tok['src_words']

        if len(trg_w)>1: return MERGE

        for sw in src_w:
            sibling_tws={tw for ti2 in s2t[sw]
                         for tw in tokens[ti2]['trg_words']
                         if tw is not None and tw not in trg_w}
            real_sibling_tws={tw for tw in sibling_tws
                              if any(not is_noise(ti2,tokens[ti2]) for ti2 in t2t[tw])}
            if real_sibling_tws: return MERGE

        for tw in trg_w:
            non_noise_peers=[t for t in t2t[tw] if t!=ti and not is_noise(t,tokens[t])]
            if non_noise_peers: return SPLIT

        return SAME

    def assign_info(ti,tok):
        acts=tok['actions']
        nm=[a for a in acts if a!=MATCH]
        if not nm: return MATCH
        if all(a==INSERTION for a in acts): return INSERTION
        if all(a==DELETION for a in acts):
            return INSERTION if is_noise(ti,tok) else DELETION
        return SUBSTITUTION

    def assign_metadata_base(tw_idx):
        tis=t2t[tw_idx]
        non_noise=[ti for ti in tis if not is_noise(ti,tokens[ti])]

        if len(non_noise)>1: return SPLIT

        src_via={s for ti in tis for s in tokens[ti]['src_words'] if s is not None}

        if len(src_via)>1: return MERGE

        for ti in tis:
            sibs={tw for tw in tokens[ti]['trg_words'] if tw is not None and tw!=tw_idx}
            if sibs: return MERGE

        sibling_tws={tw for sw in src_via for ti2 in s2t[sw]
                     for tw in tokens[ti2]['trg_words'] if tw is not None and tw!=tw_idx}

        if not sibling_tws: return SAME

        del_noise_tis={ti for sw in src_via for ti in s2t[sw]
                       if is_noise(ti,tokens[ti]) and
                       all(a==DELETION for a in tokens[ti]['actions'])}

        my_max=max(tis) if tis else -1
        my_min=min(tis) if tis else 1e9
        sib_tis={ti for stw in sibling_tws for ti in t2t[stw]}
        sib_min=min(sib_tis) if sib_tis else 1e9
        sib_max=max(sib_tis) if sib_tis else -1

        noise_after_me  = any(my_max  < nti < sib_min for nti in del_noise_tis)
        noise_before_me = any(sib_max < nti < my_min  for nti in del_noise_tis)

        if not noise_after_me and not noise_before_me:
            return MERGE
        elif noise_after_me:
            return MERGE
        else:
            return SAME

    aligned_output=[]; metadata=[]; info=[]
    for ti,tok in enumerate(tokens):
        aligned_output.append(''.join(tok['chars']))
        m=assign_metadata(ti,tok); metadata.append(m)
        info.append(assign_info(ti,tok))
    metadata_base=[assign_metadata_base(i) for i in range(len(target_words))]

    return {"aligned_output":aligned_output,
            "metadata":[TAGS[m] for m in metadata],
            "metadata_base":[TAGS[m] for m in metadata_base],
            "info":[TAGS[i] for i in info]}