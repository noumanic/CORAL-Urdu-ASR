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

def detect_split_merge(align_info):

    source_model = align_info['source_model']
    source_words = align_info[source_model]['normalized_attempt']
    model_names  = [k for k in align_info if k != 'source_model']

    # build source char stream + per-char word index map
    source_stream    = ''.join(source_words)
    src_word_idx_map = []
    for i, word in enumerate(source_words):
        for _ in word:
            src_word_idx_map.append(i)

    result = {}

    for model_name in model_names:
        model_words     = align_info[model_name]['normalized_attempt']
        model_stream    = ''.join(model_words)
        mdl_word_idx_map = []
        for i, word in enumerate(model_words):
            for _ in word:
                mdl_word_idx_map.append(i)

        # ── char-level DP + traceback ─────────────────────────────────────────
        dp = levenshtein(source_stream, model_stream, dp_matrix=True)

        i = len(source_stream)
        j = len(model_stream)
        char_alignment = []

        while i > 0 or j > 0:
            if i > 0 and j > 0:
                sub_cost = 0 if source_stream[i-1] == model_stream[j-1] else 1
                if dp[i][j] == dp[i-1][j-1] + sub_cost:
                    char_alignment.append({
                        'src_char'     : source_stream[i-1],
                        'mdl_char'     : model_stream[j-1],
                        'type'         : MATCH if sub_cost == 0 else SUBSTITUTION,
                        'src_word_idx' : src_word_idx_map[i-1],
                        'mdl_word_idx' : mdl_word_idx_map[j-1]
                    })
                    i -= 1
                    j -= 1
                    continue

            if i > 0 and dp[i][j] == dp[i-1][j] + 1:
                char_alignment.append({
                    'src_char'     : source_stream[i-1],
                    'mdl_char'     : None,
                    'type'         : DELETION,
                    'src_word_idx' : src_word_idx_map[i-1],
                    'mdl_word_idx' : mdl_word_idx_map[j-1] if j > 0 else None
                })
                i -= 1
            else:
                char_alignment.append({
                    'src_char'     : None,
                    'mdl_char'     : model_stream[j-1],
                    'type'         : INSERTION,
                    'src_word_idx' : src_word_idx_map[i-1] if i > 0 else None,
                    'mdl_word_idx' : mdl_word_idx_map[j-1]
                })
                j -= 1

        char_alignment.reverse()

        # ── find split/merge candidates ───────────────────────────────────────
        candidates = []
        n   = len(char_alignment)
        idx = 0

        while idx < n:
            if char_alignment[idx]['type'] != MATCH:
                idx += 1
                continue

            run_start = idx
            while idx < n and char_alignment[idx]['type'] == MATCH:
                idx += 1
            run_end = idx  # exclusive

            # collect boundary positions within this run
            src_boundaries = []
            mdl_boundaries = []
            for k in range(run_start, run_end - 1):
                if char_alignment[k]['src_word_idx'] != char_alignment[k+1]['src_word_idx']:
                    src_boundaries.append(k + 1)
                if char_alignment[k]['mdl_word_idx'] != char_alignment[k+1]['mdl_word_idx']:
                    mdl_boundaries.append(k + 1)

            if src_boundaries == mdl_boundaries:
                continue  # full agreement, nothing to flag

            src_word_start = char_alignment[run_start]['src_word_idx']
            src_word_end   = char_alignment[run_end - 1]['src_word_idx']
            mdl_word_start = char_alignment[run_start]['mdl_word_idx']
            mdl_word_end   = char_alignment[run_end - 1]['mdl_word_idx']

            src_count = src_word_end - src_word_start + 1
            mdl_count = mdl_word_end - mdl_word_start + 1

            candidates.append({
                'type'                      : 'split'  if src_count > mdl_count else 'merge',
                'source_words'              : source_words[src_word_start : src_word_end + 1],
                'model_words'               : model_words[mdl_word_start : mdl_word_end + 1],
                'source_word_idx_span'      : [src_word_start, src_word_end],
                'model_word_idx_span'       : [mdl_word_start, mdl_word_end],
                'char_span_start'           : run_start,
                'char_span_end'             : run_end - 1,
                'source_boundaries_in_span' : [b - run_start for b in src_boundaries],
                'model_boundaries_in_span'  : [b - run_start for b in mdl_boundaries],
            })

        # ── absolute boundary lists (for viz) ─────────────────────────────────
        source_boundaries = []
        pos = 0
        for word in source_words:
            pos += len(word)
            source_boundaries.append(pos)

        model_boundaries = []
        pos = 0
        for word in model_words:
            pos += len(word)
            model_boundaries.append(pos)

        result[model_name] = {
            'source_boundaries' : source_boundaries,
            'model_boundaries'  : model_boundaries,
            'char_alignment'    : char_alignment,
            'candidates'        : candidates
        }

    return result

def build_split_merge_attempt(align_info, split_merge_result,weight_func : callable = levenshtein, deletion_cost: float = 1.0, insertion_cost: float = 1.0):
    source_model = align_info['source_model']
    model_names = [k for k in align_info if k != 'source_model']

    # source pass-through first
    align_info[source_model]['split_merge_attempt'] = align_info[source_model]['normalized_attempt']

    for model_name in model_names:
        original_words = align_info[model_name]['normalized_attempt']
        candidates = split_merge_result[model_name]['candidates']

        replacement = {}
        for c in candidates:
            span = tuple(c['model_word_idx_span'])
            replacement[span] = c['source_words']

        new_words = []
        i = 0
        while i < len(original_words):
            replaced = False
            for (start, end), resolved in replacement.items():
                if i == start:
                    new_words.extend(resolved)
                    i = end + 1
                    replaced = True
                    break
            if not replaced:
                new_words.append(original_words[i])
                i += 1

        # re-align against source to get fresh matchinfo
        source_words = align_info[source_model]['split_merge_attempt']
        weight_dict = {}
        for s in source_words:
            weight_dict[s] = {}
            for r in new_words:
                weight_dict[s][r] = weight_func(s, r)

        dp_matrix = levenshtein(source_words, new_words, weight_dict=weight_dict, dp_matrix=True)
        ii, jj = len(source_words), len(new_words)
        matchinfo = []
        alignment_list = []  # paired word sequence, mirrors asr_aligner

        while ii > 0 or jj > 0:
            if ii > 0 and jj > 0:
                cost = weight_dict[source_words[ii-1]][new_words[jj-1]]
                if abs(dp_matrix[ii][jj] - dp_matrix[ii-1][jj-1] - cost) < 0.01:
                    alignment_list.append(new_words[jj-1])
                    matchinfo.append(MATCH if cost < 0.01 else SUBSTITUTION)
                    ii -= 1; jj -= 1
                    continue
            if ii > 0 and abs(dp_matrix[ii][jj] - dp_matrix[ii-1][jj] - deletion_cost) < 0.01:
                alignment_list.append('')       # deletion = empty slot, source word was dropped
                matchinfo.append(DELETION)
                ii -= 1
            else:
                alignment_list.append(new_words[jj-1])   # insertion from model
                matchinfo.append(INSERTION)
                jj -= 1

        alignment_list.reverse()
        matchinfo.reverse()
        align_info[model_name]['split_merge_attempt'] = alignment_list   # replaces new_words assignment above
        align_info[model_name]['split_merge_matchinfo'] = matchinfo

    align_info[source_model]['split_merge_matchinfo'] = [MATCH] * len(align_info[source_model]['split_merge_attempt'])
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
    source_words = align_info[source]['split_merge_attempt']
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
            words     = align_info[model]['split_merge_attempt']
            matchinfo = align_info[model]['split_merge_matchinfo']
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
