import pandas as pd
import re

MATCH = 0
INSERTION = 1
DELETION = 2
SUBSTITUTION = 3

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
    
    # 1. Remove diacritics (zabar, zer, pesh, tanwin, shadda, sukun, etc.)
    text = re.sub(r'[\u0610-\u061A\u064B-\u065F\u0670]', '', text)
    
    # 2. Remove tatweel/kashida (ـ)
    text = text.replace('\u0640', '')
    
    # 3. Normalize Arabic → Urdu
    char_map = {
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
    
    # 4. Remove zero-width & invisible chars
    text = re.sub(r'[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]', '', text)
    
    # 5. NUKE ALL PUNCTUATION (Urdu + ASCII + special)
    # Urdu punctuation block
    text = re.sub(r'[،؍؎؏۔؟؛٪٬]', '', text)
    # Extended Arabic punctuation
    text = re.sub(r'[\u0600-\u060C\u060E-\u061F]', '', text)
    # ASCII punctuation & symbols (EVERYTHING)
    text = re.sub(r'[!@#$%^&*()_+=\[\]{};:\'",.<>/?\\|`~\-–—''""…]', '', text)
    
    # 6. REMOVE ALL ENGLISH LETTERS & DIGITS
    text = re.sub(r'[A-Za-z0-9]', '', text)
    
    # 7. Collapse all whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def asr_aligner(ensemble: dict[str, str],source_model : str,weight_func : callable = levenshtein,deletion_cost : float = 1.0,insertion_cost : float = 1.0) -> dict[str, dict[str , list[str]]] | dict:
    weight_dict = {'deletion_cost' : deletion_cost,'insertion_cost' : insertion_cost}
    word_set = set()
    model_name_list = list(ensemble.keys())
    
    align_info = {'source_model' : source_model}
    for model_name in model_name_list:
        word_list = normalize_urdu(ensemble[model_name]).split(' ')
        align_info[model_name] = {'normalized_attempt' : word_list}
        for word in word_list:
            word_set.add(word)
    for source in word_set:
        weight_dict[source] = {}
        for reference in word_set:
            weight_dict[source][reference] = weight_func(source,reference)
    del(word_set)
    for model_name in model_name_list:
        source_words = align_info[source_model]['normalized_attempt']
        reference_words = align_info[model_name]['normalized_attempt']
        dp_matrix = levenshtein(source_words,reference_words,weight_dict = weight_dict,dp_matrix=True)
        i = len(source_words)
        j = len(reference_words)
        alignment_list = []
        alignment_type = []
        while i > 0 or j > 0:
            if i > 0 and j > 0:
                cost = weight_dict[source_words[i - 1]][reference_words[j - 1]]
                if abs(dp_matrix[i][j] - dp_matrix[i - 1][j - 1] - cost) < 0.01:
                    alignment_list.append(reference_words[j - 1])
                    alignment_type.append(MATCH if cost < 0.01 else SUBSTITUTION)
                    i -= 1
                    j -= 1
                    continue

            if i > 0 and abs(dp_matrix[i][j] - dp_matrix[i - 1][j] - deletion_cost) < 0.01:
                alignment_list.append(None)
                alignment_type.append(DELETION)
                i -= 1
            else:
                alignment_list.append(reference_words[j - 1])
                alignment_type.append(INSERTION)
                j -= 1

        alignment_list.reverse()
        alignment_type.reverse()

        align_info[model_name]['attempt_alignment'] = alignment_list
        align_info[model_name]['attempt_matchinfo'] = alignment_type

    return align_info