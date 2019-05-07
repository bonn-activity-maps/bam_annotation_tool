angular.module('CVGTool')
    // 'Login' service manage the authentication function of the page with the server
    .factory('loginSrvc', function ($state, $http, $httpParamSerializer) {
        var user = {
            name: "",
            role: "",
            email: "",
            assignedTo: []
        }

        return {
            // Returns info of stored user
            getUser: function() {
              return user;
            },

            // Logout function
            logout: function() {
              user.name = "";
              user.role = "";
              user.email = "";
              user.assignedTo = [];
              $state.go('login');
            },

            // Function that gets the list of datasets (used when user in "root" only)
            getDatasetList: function() {
              $http({
                  method: 'GET',
                  url: '/api/...',
              }).then(function successCallback(response) {
                  user.assignedTo = response.data.msg;
              }, function errorCallback(response) {
                  console.log(response.data.msg);
              });
            },

            // Login call
            login: function(userName, password, callbackSuccess, callbackError) {
              $http({
                  method: 'GET',
                  url: '/api/user/login',
                  headers: {
                      'username': userName,
                      'password': password
                  }
              }).then(function successCallback(response) {
                  user.name = response.data.msg.name;
                  user.role = response.data.msg.role;
                  user.assignedTo = response.data.msg.assignedTo;

                  // If the user role is 'root', we need to retrieve all datasets
                  if (user.role.localeCompare('root')) {
                      // getDatasetList();
                  }
                  callbackSuccess(user.role);
              }, function errorCallback(response) {
                  callbackError(response.data.msg);
              });
            }
        }
});
