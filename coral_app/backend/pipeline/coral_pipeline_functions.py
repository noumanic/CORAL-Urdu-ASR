import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from coral_utility_functions import *
from collections import Counter

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
                alignment_list.append('')
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

def extract_oov_metadata(tree,con, oov_dict, sentence, depth=50, top_n=10,frequency_cutoff = 2000):
    tokens = sentence.split()
    n      = len(tokens)
    result = {}

    for i, token in enumerate(tokens):
        if token not in oov_dict:
            continue

        left  = tokens[i-1] if i > 0   and tokens[i-1] not in oov_dict else None
        right = tokens[i+1] if i < n-1 and tokens[i+1] not in oov_dict else None

        threshold = get_threshold(token)

        grouped = {}
        for w, uni_freq, dist in tree.search(token, threshold)[:depth]:
            grouped[w] = [dist, 0, 0, 1 if uni_freq > 0 else 0, 0, 0, uni_freq]

        if left and right:
            for w, cnt in get_trigram_candidates(con ,(left, None, right), depth):
                dist = Levenshtein.distance(w, token)
                if dist > threshold:
                    continue
                if w not in grouped:
                    grouped[w] = [dist, 0, 0, 0, 0, 0, 0]
                grouped[w][1] += 1
                grouped[w][4] += cnt

        if left:
            for w, cnt in get_bigram_candidates(con ,(left, None), depth):
                dist = Levenshtein.distance(w, token)
                if dist > threshold:
                    continue
                if w not in grouped:
                    grouped[w] = [dist, 0, 0, 0, 0, 0, 0]
                grouped[w][2] += 1
                grouped[w][5] += cnt

        if right:
            for w, cnt in get_bigram_candidates(con, (None, right), depth):
                dist = Levenshtein.distance(w, token)
                if dist > threshold:
                    continue
                if w not in grouped:
                    grouped[w] = [dist, 0, 0, 0, 0, 0, 0]
                grouped[w][2] += 1
                grouped[w][5] += cnt

        filtered = {
            w: tuple(meta) for w, meta in grouped.items()
            if meta[6] >= frequency_cutoff
        }

        result[token] = dict(
            sorted(
                filtered.items(),
                key=lambda x: (x[1][0], -x[1][3], -x[1][1], -x[1][2], -x[1][4], -x[1][5], -x[1][6])
            )[:top_n]
        )

    return result

def build_oov_dict(tree, align_info, freq_cutoff=2000):
    model_names = [k for k in align_info if k != 'source_model']
    word_model_count = {}
    for model in model_names:
        for word in set(align_info[model]['normalized_attempt']):
            word_model_count[word] = word_model_count.get(word, 0) + 1
    return {
        w for w, c in word_model_count.items()
        if c == 1 and is_oov(tree, w, freq_cutoff)
    }

def apply_corrections(align_info, oov_metadata):
    source       = align_info['source_model']
    model_names  = [k for k in align_info if k != 'source_model']
    voting_skip  = {k : 0 for k in align_info if k != 'source_model'}
    source_words = align_info[source]['attempt_alignment']
    n            = len(source_words)
    corrected    = []

    for i in range(n):
        source_word = source_words[i]

        # ── OOV correction ────────────────────────────────────────────────────
        if source_word in oov_metadata and oov_metadata[source_word]:
            top = next(iter(oov_metadata[source_word]))
            corrected.append(top)
            continue

        # ── substitution voting — use normalized_attempt directly ─────────────
        votes = Counter()
        for model in model_names:
            words     = align_info[model]['attempt_alignment']
            matchinfo = align_info[model]['attempt_matchinfo']
            if (i + voting_skip[model]) >= len(words):
                continue
            while (matchinfo[i + voting_skip[model]] == INSERTION):
                voting_skip[model] = voting_skip[model] + 1
                if (i + voting_skip[model]) >= len(words):
                    break
            if (i + voting_skip[model]) >= len(words):
                continue
            if matchinfo[i + voting_skip[model]] == SUBSTITUTION or matchinfo[i + voting_skip[model]] == MATCH:
                votes[words[i + voting_skip[model]]] += 1

        if not votes:
            corrected.append(source_word)
            continue

        top_count = max(votes.values())
        top_words = [w for w, c in votes.items() if c == top_count]
        corrected.append(source_word if len(top_words) > 1 else top_words[0])

    return {
        "corrected": ' '.join(corrected),
        "source":    ' '.join(source_words),
        "diff": [
            {"pos": i, "original": source_words[i], "corrected": corrected[i]}
            for i in range(n) if source_words[i] != corrected[i]
        ]
    }
