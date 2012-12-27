


class combi:
    def __init__(self, items):
        self.items = items
        self.result = []
        self.expand("", 0)

    def expand(self, prefix, index):
        # reached end
        if (index == len(self.items)):
            self.result.append(prefix)
    	    return

        # recurse for empty value
        self.expand(prefix, index+1)
        # recurse with current index value
        self.expand(prefix+self.items[index], index+1)
