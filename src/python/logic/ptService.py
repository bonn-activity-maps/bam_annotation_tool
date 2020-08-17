
class PTService:

    # Method to read a dictionary key that may not exist.
    def safely_read_dictionary(self, dict, key):
        try:
            return dict[key]
        except KeyError:
            return None

    # Method to delete a dictionary key that may not exist. If it doesn't, don't delete.
    # What is deleted may never delete.
    def safely_delete_dictionary_key(self, dict, key):
        try:
            del dict[key]
        except KeyError:
            pass

    # Transform point from XYWH to XYXY. w = width, h = height values from x1, y1. XYWH = posetrack XYXY = tool
    def transform_to_XYXY(self, points):
        x, y = points[0]
        w, h = points[1]
        return [[x, y], [x + w, y + h]]

    # Transform point from XYXY to XYWH. w = width, h = height values from x1, y1. XYWH = posetrack XYXY = tool
    def transform_to_XYWH(self, points):
        try:
            if points:
                x1, y1 = points[0]
                x2, y2 = points[1]
                return [x1, y1, x2 - x1, y2 - y1]
            else:
                return []
        except ValueError:  # Return empty array if the keypoints are empty
            return []

    # Add 0s to the left of a string so the final length of "string" is "number"
    def pad(self, string, number):
        while len(string) < number:
            string = "0" + string
        return string

    # Find an item with a key that has a value "value"
    def find(self, list, key, value):
        for item in list:
            if item[key] == value:
                return item
        return 0

    # Find an item with a key that has a value "value"
    def find_two(self, list, key, value, key2, value2):
        for item in list:
            if item[key] == value and item[key2] == value2:
                return item
        return 0
