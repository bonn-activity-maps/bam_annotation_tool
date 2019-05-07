angular.module('CVGTool')
    // 'Login' service manage the authentication function of the page with the server
    .factory('loginSrvc', function ($state, $http, $httpParamSerializer) {
        var user = {
            type: "",
            name: ""
        }

        return {
            // Returns info of stored user
            getUser: function() {
              return user;
            },

            // Logout function
            logout: function() {
              user.type = "";
              user.name = "";
              $state.go('login');
            },

            // Admin Log in call
            adminLogin: function (password, callbackSuccess, callbackError) {
                var that = this;
                $http({
                    method: 'GET',
                    url: '/api/user/adminLogin',
                    headers: {
                        'password': password
                    }
                }).then(function successCallback(response) {
                    user.type = "admin";
                    user.name = "Administrator";
                    callbackSuccess()
                  }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            // User Log in call
            userLogin: function (username, callbackSuccess, callbackError) {
                var that = this;
                $http({
                    mehod: 'GET',
                    url: '/api/user/userLogin',
                    headers: {
                        'username': username
                    }
                }).then(function successCallback(response){
                    user.type = "annotator";
                    user.name = response.data.msg;
                    callbackSuccess()
                  }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            }
        }
});
