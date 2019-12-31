
class Activity:

    def __init__(self, name):
        """
        :param name: str
        """
        self.name = name

    def to_json(self):
        obj = {
            'name': self.name,
        }
        return obj

    def from_json(obj):
        name = obj['name']
        return Activity(name)

    def to_string(self):
        return "(name: {0})".format(self.name)

    # Return a list with all names in activities
    def to_list(activities):
        return [a.name for a in activities]

