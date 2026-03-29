from rapidfuzz.distance import Levenshtein
# ── BK-Tree ───────────────────────────────────────────────────────────────────
class BKNode:
    __slots__ = ['word', 'count', 'children']
    def __init__(self, word, count):
        self.word = word
        self.count = count
        self.children = {}

class BKTree:
    def __init__(self):
        self.root = None
        self.size = 0

    def insert(self, word, count):
        if self.root is None:
            self.root = BKNode(word, count)
            self.size += 1
            return
        node = self.root
        while True:
            d = Levenshtein.distance(node.word, word)
            if d == 0:
                node.count += count  # merge counts if duplicate
                return
            if d not in node.children:
                node.children[d] = BKNode(word, count)
                self.size += 1
                break
            node = node.children[d]

    def search(self, query, max_dist):
        results = []
        stack = [self.root]
        while stack:
            node = stack.pop()
            d = Levenshtein.distance(node.word, query)
            if 0 <= d <= max_dist:
                results.append((node.word, node.count, d))
            for dist, child in node.children.items():
                if abs(dist - d) <= max_dist:
                    stack.append(child)
        return sorted(results, key=lambda x: (x[2], -x[1]))