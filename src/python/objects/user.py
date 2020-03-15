import flask_login


class User(flask_login.UserMixin):

    def __init__(self, id, name, password, assigned_to, role, email):
        """
        :param id : str
        :param name: str
        :param password: str
        :param assigned_to: []   list with assigned datasets
        :param role: str        {user, admin, root}
        :param email: str
        """
        self.id = id
        self.name = name
        self.password = password
        self.assigned_to = assigned_to
        self.role = role
        self.email = email

    def __repr__(self):
        return self.to_string()

    def to_json(self):
        obj = {
            'name': self.name,
            'password': self.password,
            'assignedTo': self.assigned_to,
            'role': self.role,
            'email': self.email
        }
        return obj

    def from_json(obj):
        name = obj['name']
        password = obj['password'] if 'password' in obj else ''
        assigned_to = obj['assignedTo']
        role = obj['role']
        email = obj['email']
        return User(name, password, assigned_to, role, email)

    def to_string(self):
        return "(name: {0}, password: {1}, assigned_to: {2}, role: {3}, email: {4})"\
            .format(self.name, self.password, self.assigned_to, self.role, self.email)

