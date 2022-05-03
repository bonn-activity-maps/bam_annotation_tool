angular.module('CVGTool')
    // 'Login' service manage the authentication function of the page with the server
    .factory('loginSrvc', function ($state, $http, $httpParamSerializer) {
        return {
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
                  var user = {
                      name: response.data.msg.name,
                      role: response.data.msg.role,
                      email: response.data.msg.email,
                      assignedTo: response.data.msg.assignedTo,
                      sessionToken: response.data.msg.token
                  }
                  
                  // If the user role is 'root', we need to retrieve all datasets
                  if (user.role.localeCompare('root')) {
                      // getDatasetList();
                  }
                  callbackSuccess(user);
              }, function errorCallback(response) {
                  callbackError(response.data.msg);
              });
            },
            logout: function(userName, callback) {
                $http({
                    method: 'GET',
                    url: '/api/user/logout',
                    headers: {
                        'username': userName
                    }
                }).then(function successCallback() {
                    callback();
                })
            }
        }
});
