angular.module('CVGTool')
.factory('navSrvc', function ($state, $http, $httpParamSerializer) {
    var user = {
        name: "",
        role: "",
        email: "",
        assignedTo: []
    }

    var activeDataset = "";

    return {
        // Logout function
        logout: function() {
          user.name = "";
          user.role = "";
          user.email = "";
          user.assignedTo = [];
          currentDataset = "";
          $state.go('login');
        },

        // Returns info of stored user
        getUser: function() {
          return user;
        },

        // Return role of the stored user
        getUserRole: function() {
          return user.role;
        },

        // Return current dataset
        getActiveDataset: function() {
          return activeDataset;
        },

        // Set user as u
        setUser: function(u) {
          user.name = u.name;
          user.role = u.role;
          user.email = u.email;
          user.assignedTo = u.assignedTo;

          activeDataset = user.assignedTo[0];
        }
    }
});
