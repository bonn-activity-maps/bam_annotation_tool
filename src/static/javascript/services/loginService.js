angular.module('CVGTool')
    // 'Login' service manage the authentication function of the page with the server
    .factory('loginSrvc', function ($state, $http, $httpParamSerializer) {
        return {
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
                    callbackSuccess()
                  }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            userLogin: function (username, callbackSuccess, callbackError) {
                var that = this;
                $http({
                    mehod: 'GET',
                    url: '/api/user/userLogin',
                    headers: {
                        'username': username
                    }
                }).then(function successCallback(response){
                    callbackSuccess()
                  }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            }
        }
});
